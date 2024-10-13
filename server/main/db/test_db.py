import os
import sys
from datetime import datetime

from firebase_admin import firestore  # type: ignore[import]

from server.main.db.fsdb import connect_to_fs
from server.main.db.fsdb import FirestoreDatabase
from server.main.db.mdb import MemoryDatabase
from server.main.db.models import Event
from server.main.db.models import User
from server.main.db.protocol import DatabaseProtocol
from server.main.db.protocol import SaveAlgorithmArgs


def _empty_collection(collection_ref, batch_size=500) -> None:  # type: ignore[no-untyped-def]
    docs = collection_ref.limit(batch_size).stream()
    deleted: int = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
    if deleted >= batch_size:
        _empty_collection(collection_ref, batch_size)


def empty_all_collections(client: firestore.Client) -> None:
    collections = client.collections()
    for collection in collections:
        _empty_collection(collection)


def create_test_user(db: DatabaseProtocol, id: str, email: str) -> User:
    user = User(firebase_user_id=id, email=email)
    db.save_user(user)
    retrieved_user = db.get_user(id)
    assert retrieved_user is not None, "User should be retrieved successfully"
    assert (
        retrieved_user.firebase_user_id == user.firebase_user_id
    ), f"User ID should match: {retrieved_user.firebase_user_id} != {user.firebase_user_id}"
    assert (
        retrieved_user.email == user.email
    ), f"User email should match: {retrieved_user.email} != {user.email}"
    return user


algorithm_count = 0


def save_algo(
    db: DatabaseProtocol, user: User, requested_public: bool, has_cached_event: bool
) -> None:
    global algorithm_count
    algorithm_count += 1
    name = f"test_algo_{algorithm_count}"
    save_args = SaveAlgorithmArgs(
        author_email=user.email,
        name=name,
        algo_script="print('Hello World')",
        viz_script="print('Visualize Hello World')",
        requested_public=requested_public,
        cached_events=[
            Event(
                lineno=1,
                viz_output="dummy_viz",
                viz_log="dummy_viz_log",
                algo_log="dummy_algo_log",
            )
        ]
        if has_cached_event
        else [],
    )
    db.save_algo(save_args)
    algo = db.get_algo(user.email, name)
    assert algo is not None, "Algorithm should be retrieved successfully"
    assert algo.author_email == save_args.author_email, "Author email should match"
    assert algo.name == name, "Algorithm name should match"
    assert algo.algo_script == save_args.algo_script, "Algorithm script should match"
    assert algo.viz_script == save_args.viz_script, "Visualization script should match"
    assert isinstance(algo.last_updated, datetime)
    if has_cached_event:
        assert len(algo.cached_events) == 1, "Cached events should not be empty"
        event = algo.cached_events[0]
        assert event.lineno == 1, "Event lineno should match"
        assert event.viz_output == "dummy_viz", "Event viz_output should match"
        assert event.viz_log == "dummy_viz_log", "Event viz_log should match"
        assert event.algo_log == "dummy_algo_log", "Event algo_log should match"
    else:
        assert len(algo.cached_events) == 0, "Cached events should be empty"


def test_database_protocol(db: DatabaseProtocol) -> None:
    # Create test user
    test_user = create_test_user(db, "test_user_1", "test1@example.com")

    # Create a requested_public test algorithm with non-empty cached events and one with empty cached events
    save_algo(db, test_user, requested_public=True, has_cached_event=True)
    save_algo(db, test_user, requested_public=True, has_cached_event=False)
    # Create a not requested_public test algorithm with non-empty cached events and one with empty cached events
    save_algo(db, test_user, requested_public=False, has_cached_event=True)
    save_algo(db, test_user, requested_public=False, has_cached_event=False)

    # Create another test user
    test_user2 = create_test_user(db, "test_user_2", "test2@example.com")

    # Create a requested_public algorithm by test_user2 with non-empty cached events and with empty cached events
    save_algo(db, test_user2, requested_public=True, has_cached_event=True)
    save_algo(db, test_user2, requested_public=True, has_cached_event=False)

    # Ensure only algorithms with non-empty cached events appear in public listings
    public_algos = db.get_public_algos()
    assert (
        len(public_algos) == 2
    ), f"Public algorithms should be 2, but got {public_algos}"

    # Retrieve algorithm summaries for test_user
    algo_summaries = db.get_algo_summaries(test_user.email)
    assert (
        len(algo_summaries) == 5
    ), f"User should have 5 algorithm summaries, but got {algo_summaries}"
    # Retrieve algorithm summaries for test_user2
    algo_summaries = db.get_algo_summaries(test_user2.email)
    assert (
        len(algo_summaries) == 3
    ), f"User should have 3 algorithm summaries, but got {algo_summaries}"

    # Test get_algos_needing_caching()
    algos_needing_caching = db.get_algos_needing_caching()
    assert (
        len(algos_needing_caching) == 2
    ), f"Expected 2 algorithms needing caching, but got {len(algos_needing_caching)}"
    # Verify the names of the algorithms needing caching
    algo_names_needing_caching = {algo.name for algo in algos_needing_caching}
    assert "test_algo_2" in algo_names_needing_caching, "test_algo_2 should need caching"
    assert "test_algo_6" in algo_names_needing_caching, "test_algo_6 should need caching"

    # Test cache_events()
    new_events = [
        Event(
            lineno=10,
            viz_output="new_viz_output",
            viz_log="new_viz_log",
            algo_log="new_algo_log",
        )
    ]
    db.cache_events(test_user.email, "test_algo_2", new_events)

    # Retrieve the algorithm and verify that events were cached
    cached_algo = db.get_algo(test_user.email, "test_algo_2")
    assert (
        cached_algo is not None
    ), "Algorithm should be retrieved successfully after caching events"
    assert len(cached_algo.cached_events) == 1, "Algorithm should now have 1 cached event"
    cached_event = cached_algo.cached_events[0]
    assert cached_event.lineno == 10, "Cached event lineno should match"
    assert (
        cached_event.viz_output == "new_viz_output"
    ), "Cached event viz_output should match"
    assert cached_event.viz_log == "new_viz_log", "Cached event viz_log should match"
    assert cached_event.algo_log == "new_algo_log", "Cached event algo_log should match"

    # After caching, test_algo_2 should no longer need caching
    algos_needing_caching = db.get_algos_needing_caching()
    assert (
        len(algos_needing_caching) == 1
    ), f"Expected 1 algorithm needing caching, but got {len(algos_needing_caching)}"
    algo_names_needing_caching = {algo.name for algo in algos_needing_caching}
    assert (
        "test_algo_6" in algo_names_needing_caching
    ), "test_algo_6 should still need caching"
    assert (
        "test_algo_2" not in algo_names_needing_caching
    ), "test_algo_2 should no longer need caching"

    print("All tests passed!")


def main() -> None:
    db_type = sys.argv[1]
    db: DatabaseProtocol
    if db_type == "memory":
        db = MemoryDatabase()
    elif db_type == "firestore":
        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        client = connect_to_fs(project, "unit-test")
        # clear the collections before testing. This is why we use a separate "unit-test" database
        empty_all_collections(client)
        db = FirestoreDatabase(client)
    else:
        raise ValueError(f"Unknown database type: {db_type}")

    test_database_protocol(db)


# Entry point of the script
if __name__ == "__main__":
    main()
