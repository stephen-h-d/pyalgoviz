import sys
from datetime import datetime

import firebase_admin  # type: ignore[import]
from firebase_admin import firestore

from server.main.db.mdb import MemoryDatabase
from server.main.db.models import User
from server.main.db.protocol import DatabaseProtocol
from server.main.db.protocol import SaveAlgorithmArgs


def delete_all_collections(_db) -> None:  # type: ignore[no-untyped-def]
    collections = _db.collections()
    for collection in collections:
        _delete_collection(collection)


def _delete_collection(collection_ref, batch_size=500) -> None:  # type: ignore[no-untyped-def]
    docs = collection_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
    if deleted >= batch_size:
        _delete_collection(collection_ref, batch_size)


def test_database_protocol(db: DatabaseProtocol) -> None:
    # Create test user
    test_user = User(firebase_user_id="test_user_1", email="test1@example.com")
    db.save_user(test_user)

    # Retrieve the test user and check if it matches
    retrieved_user = db.get_user("test_user_1")
    assert retrieved_user is not None, "User should be retrieved successfully"
    assert (
        retrieved_user.firebase_user_id == test_user.firebase_user_id
    ), "User ID should match"
    assert retrieved_user.email == test_user.email, "User email should match"

    # Create a test algorithm
    test_algo = SaveAlgorithmArgs(
        author_email=test_user.email,
        name="Test Algorithm",
        algo_script="print('Hello World')",
        viz_script="print('Visualize Hello World')",
        public=True,
    )
    db.save_algo(test_algo)

    # Retrieve the test algorithm
    retrieved_algo = db.get_algo(test_user.email, "Test Algorithm")
    assert retrieved_algo is not None, "Algorithm should be retrieved successfully"
    assert (
        retrieved_algo.author_email == test_algo.author_email
    ), "Author email should match"
    assert retrieved_algo.name == test_algo.name, "Algorithm name should match"
    assert (
        retrieved_algo.algo_script == test_algo.algo_script
    ), "Algorithm script should match"
    assert (
        retrieved_algo.viz_script == test_algo.viz_script
    ), "Visualization script should match"
    assert isinstance(retrieved_algo.last_updated, datetime)

    # Create and save another algorithm that is not public
    test_algo_private = SaveAlgorithmArgs(
        author_email=test_user.email,
        name="Private Algorithm",
        algo_script="print('Private Hello World')",
        viz_script="print('Private Visualize Hello World')",
        public=False,
    )
    db.save_algo(test_algo_private)

    # create another test user
    test_user2 = User(firebase_user_id="test_user_2", email="test2@example.com")
    db.save_user(test_user2)

    # create a public algorithm by test_user2
    test_algo2 = SaveAlgorithmArgs(
        author_email=test_user2.email,
        name="Test Algorithm 2",
        algo_script="print('Hello World 2')",
        viz_script="print('Visualize Hello World 2')",
        public=True,
    )
    db.save_algo(test_algo2)

    # create a private algorithm by test_user2
    test_algo2_private = SaveAlgorithmArgs(
        author_email=test_user2.email,
        name="Private Algorithm",
        algo_script="print('Private Hello World 2')",
        viz_script="print('Private Visualize Hello World 2')",
        public=False,
    )
    db.save_algo(test_algo2_private)

    # Ensure private algorithm does not appear in public listings
    public_algos = db.get_public_algos()
    assert len(public_algos) == 2, "There should be 2 public algorithms"
    assert any(
        algo.name == "Test Algorithm" for algo in public_algos
    ), "Public algorithm should be retrievable"
    assert not any(
        algo.name == "Private Algorithm" for algo in public_algos
    ), "Private algorithm should not be in public list"

    # Retrieve algorithm summaries
    algo_summaries = db.get_algo_summaries(test_user.email)
    print(f"algo summaries {algo_summaries}")
    assert len(algo_summaries) == 3, "Summaries should include 3 algorithms"
    assert any(
        summary.name == "Test Algorithm" for summary in algo_summaries
    ), "Test Algorithm should be in summaries"
    assert any(summary.name == "Test Algorithm 2" for summary in algo_summaries)

    print("All tests passed!")


# main function
def main() -> None:
    db_type = sys.argv[1]
    db: DatabaseProtocol
    if db_type == "memory":
        db = MemoryDatabase()
    elif db_type == "firestore":
        firebase_admin.initialize_app()
        db = firestore.client()
        # Clear all collections in the Firestore test database before testing.
        delete_all_collections(db)

        # db = FirestoreDatabase(app)
        raise ValueError("undo this")
    else:
        raise ValueError(f"Unknown database type: {db_type}")

    test_database_protocol(db)


# Entry point of the script
if __name__ == "__main__":
    main()
