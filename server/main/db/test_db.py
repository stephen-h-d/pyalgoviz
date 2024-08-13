import sys

from main.db.fsdb import FirestoreDatabase
from main.db.mdb import MemoryDatabase
from main.db.models import User
from main.db.protocol import DatabaseProtocol
from main.db.protocol import SaveAlgorithmArgs


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
        author=test_user,
        name="Test Algorithm",
        algo_script="print('Hello World')",
        viz_script="print('Visualize Hello World')",
        public=True,
    )
    db.save_algo(test_algo)

    # Retrieve the test algorithm
    retrieved_algo = db.get_algo(test_user.firebase_user_id, "Test Algorithm")
    assert retrieved_algo is not None, "Algorithm should be retrieved successfully"
    assert (
        retrieved_algo.author.firebase_user_id == test_algo.author.firebase_user_id
    ), "Author ID should match"
    assert retrieved_algo.name == test_algo.name, "Algorithm name should match"
    assert (
        retrieved_algo.algo_script == test_algo.algo_script
    ), "Algorithm script should match"
    assert (
        retrieved_algo.viz_script == test_algo.viz_script
    ), "Visualization script should match"

    # Create and save another algorithm that is not public
    test_algo_private = SaveAlgorithmArgs(
        author=test_user,
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
        author=test_user2,
        name="Test Algorithm 2",
        algo_script="print('Hello World 2')",
        viz_script="print('Visualize Hello World 2')",
        public=True,
    )
    db.save_algo(test_algo2)

    # create a private algorithm by test_user2
    test_algo2_private = SaveAlgorithmArgs(
        author=test_user2,
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
    algo_summaries = db.get_algo_summaries(test_user.firebase_user_id)
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
        db = FirestoreDatabase()
    else:
        raise ValueError(f"Unknown database type: {db_type}")

    test_database_protocol(db)


# Entry point of the script
if __name__ == "__main__":
    main()
