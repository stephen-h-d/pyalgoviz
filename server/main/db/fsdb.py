from datetime import datetime
from typing import List
from typing import Optional

import attrs
import firebase_admin  # type: ignore[import]
from firebase_admin import firestore
from google.oauth2 import service_account

from server.main.db.models import Algorithm
from server.main.db.models import AlgorithmSummary
from server.main.db.models import Event
from server.main.db.models import FirebaseUserId
from server.main.db.models import ScriptDemoInfo
from server.main.db.models import User
from server.main.db.protocol import DatabaseProtocol
from server.main.db.protocol import SaveAlgorithmArgs


class FirestoreDatabase(DatabaseProtocol):
    def __init__(self, client: firestore.Client) -> None:
        self._client = client

    def get_user(self, user_id: FirebaseUserId) -> Optional[User]:
        user_ref = self._client.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            data = user_doc.to_dict()
            return User(firebase_user_id=user_id, email=data["email"])
        return None

    def save_user(self, user: User) -> None:
        user_ref = self._client.collection("users").document(user.firebase_user_id)
        user_ref.set({"email": user.email})

    def get_algo(self, author_email: str, name: str) -> Optional[Algorithm]:
        algo_ref = self._client.collection("algorithms").document(
            f"{author_email}-{name}"
        )
        algo_doc = algo_ref.get()
        if algo_doc.exists:
            data = algo_doc.to_dict()
            events = [Event(**event) for event in data["cached_events"]]
            return Algorithm(
                author_email=data["author_email"],
                name=data["name"],
                algo_script=data["algo_script"],
                viz_script=data["viz_script"],
                public=data["public"],
                cached_events=events,
                last_updated=data.get("last_updated"),
            )
        return None

    def save_algo(self, algo: SaveAlgorithmArgs) -> None:
        algo_ref = self._client.collection("algorithms").document(
            f"{algo.author_email}-{algo.name}"
        )
        algo_ref.set(
            {
                "author_email": algo.author_email,
                "name": algo.name,
                "algo_script": algo.algo_script,
                "viz_script": algo.viz_script,
                "public": algo.public,
                "cached_events": [attrs.asdict(event) for event in algo.cached_events],
                "last_updated": datetime.now(),
            }
        )

    def get_algo_summaries(self, author_email: str) -> List[AlgorithmSummary]:
        # Fetch algorithms authored by the user
        algos_ref = self._client.collection("algorithms").where(
            "author_email", "==", author_email
        )
        algos = algos_ref.stream()
        summaries = [
            AlgorithmSummary(author_email=algo.get("author_email"), name=algo.get("name"))
            for algo in algos
        ]

        # Fetch public algorithms excluding the ones authored by the user
        public_algos_ref = (
            self._client.collection("algorithms")
            # note: these where clauses trigger a warning.
            # https://stackoverflow.com/questions/76110267/firestore-warning-on-filtering-with-positional-arguments-how-to-use-filter-kw
            # has a way to fix it, perhaps, but that means importing a FieldFilter from google.cloud.firestore_v1, and
            # that doesn't seem worth it / I don't know if that'd work.
            .where("public", "==", True).where("author_email", "!=", author_email)
        )
        public_algos = public_algos_ref.stream()
        summaries += [
            AlgorithmSummary(author_email=algo.get("author_email"), name=algo.get("name"))
            for algo in public_algos
        ]
        return summaries

    def get_public_algos(self) -> List[ScriptDemoInfo]:
        public_algos_ref = self._client.collection("algorithms").where(
            "public", "==", True
        )
        public_algos = public_algos_ref.stream()
        return [
            ScriptDemoInfo(
                author_email=algo.get("author_email"),
                name=algo.get("name"),
                cached_events=[Event(**event) for event in algo.get("cached_events")],
            )
            for algo in public_algos
        ]


def connect_to_fs(
    project: str, credentials_file: str, database_id: str
) -> firestore.Client:
    firebase_admin.initialize_app()
    credentials = service_account.Credentials.from_service_account_file(credentials_file)
    return firestore.Client(project, credentials, database_id)
