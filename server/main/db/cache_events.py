import os
import sys

from server.main.db.fsdb import connect_to_fs
from server.main.db.fsdb import FirestoreDatabase
from server.main.db.mdb import MemoryDatabase
from server.main.db.models import Event
from server.main.db.protocol import DatabaseProtocol
from server.main.run_script import run_script


def verify_cached_events(cached_events: list[Event]) -> list[Event]:
    # it's fine for viz errors to be in the first events, but if there is ever not an error and then a viz error later
    # on, we raise a ValueError.
    if len(cached_events) == 0:
        raise ValueError("No events to check for viz errors")

    first_good_event_idx = -1
    for event in cached_events:
        if event.viz_error_line is None:
            first_good_event_idx = cached_events.index(event)
            break  # check for any more errors

    if first_good_event_idx == -1:
        raise ValueError("All events have viz errors")

    for event in cached_events[first_good_event_idx:]:
        if event.viz_error_line is not None:
            raise ValueError(f"Viz error found at line {event.viz_error_line}")

    result = cached_events[first_good_event_idx:]
    if (
        len(result) < 2
    ):  # the last event is just "Program finished", so we need at least 2 events to display
        raise ValueError(
            f"Not enough events without viz errors. Only {len(result)} events found."
        )

    return result[0:100]  # the first 100 is plenty


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

            try:
                cached_events = verify_cached_events(cached_events)
            except ValueError as e:
                print(f"Could not cache events for public view: {e}")
                return

            db.cache_events(author_email, name, cached_events)
            if isinstance(db, MemoryDatabase):
                db.save_cached_demo_db()
            print(f"Successfully cached events for {author_email}-{name}")
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
