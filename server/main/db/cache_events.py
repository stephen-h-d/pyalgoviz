import os
import sys

from server.main.db.fsdb import connect_to_fs
from server.main.db.fsdb import FirestoreDatabase
from server.main.db.mdb import MemoryDatabase
from server.main.db.models import Event
from server.main.db.protocol import DatabaseProtocol
from server.main.run_script import run_script


def main() -> None:
    db_type = sys.argv[1]
    command = sys.argv[2]

    db: DatabaseProtocol
    if db_type == "memory":
        db = MemoryDatabase.load_cached_demo_db()
    elif db_type == "firestore":
        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        client = connect_to_fs(project, cred_path, "pyalgoviz-test")
        db = FirestoreDatabase(client)
    else:
        raise ValueError(f"Unknown database type: {db_type}")

    if command == "cache":
        author_email = sys.argv[3]
        name = sys.argv[4]
        algo = db.get_algo(author_email, name)
        if algo is None:
            print(f"Algorithm {author_email}-{name} not found")
            return

        res = run_script(algo.algo_script, algo.viz_script)
        if res["py_error"] is None:
            events = res["events"]
            cached_events = [Event(**event) for event in events]
            db.cache_events(author_email, name, cached_events)
        else:
            print(
                f"Could not run script to cache events for public view: {res['py_error']}"
            )
    elif command == "list":
        algos = db.get_algos_needing_caching()
        print(f"Algorithms needing caching: {algos}")
    else:
        print(f"Unrecognized command {command}")


# Entry point of the script
if __name__ == "__main__":
    main()
