import sys

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

    # Test public algorithms retrieval
    public_algos = db.get_public_algos()
    assert len(public_algos) > 0, "There should be at least one public algorithm"
    assert any(
        algo.name == "Test Algorithm" for algo in public_algos
    ), "Public algorithm should be retrievable"

    # Create and save another algorithm that is not public
    test_algo_private = SaveAlgorithmArgs(
        author=test_user,
        name="Private Algorithm",
        algo_script="print('Private Hello World')",
        viz_script="print('Private Visualize Hello World')",
        public=False,
    )
    db.save_algo(test_algo_private)

    # Ensure private algorithm does not appear in public listings
    public_algos = db.get_public_algos()
    assert not any(
        algo.name == "Private Algorithm" for algo in public_algos
    ), "Private algorithm should not be in public list"

    # Retrieve algorithm summaries
    algo_summaries = db.get_algo_summaries(test_user.firebase_user_id)
    assert len(algo_summaries) == 2, "User should have two algorithms"
    assert any(
        summary.name == "Test Algorithm" for summary in algo_summaries
    ), "Test Algorithm should be in summaries"
    assert any(
        summary.name == "Private Algorithm" for summary in algo_summaries
    ), "Private Algorithm should be in summaries"

    print("All tests passed!")


# main function
def main() -> None:
    db_type = sys.argv[1]
    if db_type == "memory":
        db = MemoryDatabase()
    else:
        raise ValueError(f"Unknown database type: {db_type}")

    test_database_protocol(db)


# Entry point of the script
if __name__ == "__main__":
    main()
