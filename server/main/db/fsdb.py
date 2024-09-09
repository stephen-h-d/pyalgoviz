from datetime import datetime
from typing import cast
from typing import List
from typing import Literal
from typing import Optional
from typing import TypeVar
from typing import Union

import attrs
import firebase_admin  # type: ignore[import]
from firebase_admin import firestore
from google.cloud.firestore_v1 import DocumentSnapshot

from server.main.db.models import Algorithm
from server.main.db.models import AlgorithmSummary
from server.main.db.models import Event
from server.main.db.models import FirebaseUserId
from server.main.db.models import ScriptDemoInfo
from server.main.db.models import User
from server.main.db.protocol import DatabaseProtocol
from server.main.db.protocol import SaveAlgorithmArgs


T = TypeVar("T")


def get_with_default(doc: DocumentSnapshot, key: str, default: T) -> T:
    result = doc.get(key)
    if result is None:
        return default
    return cast(T, result)


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
                requested_public=data["requested_public"],
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
                "requested_public": algo.requested_public,
                "cached_events": [attrs.asdict(event) for event in algo.cached_events],
                "last_updated": datetime.now(),
            }
        )

    def get_algo_summaries(self, author_email: str) -> List[AlgorithmSummary]:
        # Fetch all algorithms authored by the user
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
            .where("requested_public", "==", True)
            .where("author_email", "!=", author_email)
        )
        public_algos = public_algos_ref.stream()
        summaries += [
            AlgorithmSummary(author_email=algo.get("author_email"), name=algo.get("name"))
            for algo in public_algos
            if get_with_default(algo, "cached_events", default=[]) != []
        ]
        return summaries

    def get_public_algos(self) -> List[ScriptDemoInfo]:
        public_algos_ref = self._client.collection("algorithms").where(
            "requested_public", "==", True
        )
        requested_public_algos = public_algos_ref.stream()
        return [
            ScriptDemoInfo(
                author_email=algo.get("author_email"),
                name=algo.get("name"),
                cached_events=[Event(**event) for event in algo.get("cached_events")],
            )
            for algo in requested_public_algos
            if get_with_default(algo, "cached_events", default=[]) != []
        ]

    def cache_events(self, author_email: str, name: str, events: list[Event]) -> None:
        algo_ref = self._client.collection("algorithms").document(
            f"{author_email}-{name}"
        )
        algo_ref.update({"cached_events": [attrs.asdict(event) for event in events]})

    def get_algos_needing_caching(self) -> list[AlgorithmSummary]:
        public_algos_ref = self._client.collection("algorithms").where(
            "requested_public", "==", True
        )
        requested_public_algos = public_algos_ref.stream()
        return [
            AlgorithmSummary(author_email=algo.get("author_email"), name=algo.get("name"))
            for algo in requested_public_algos
            if get_with_default(algo, "cached_events", default=[]) == []
        ]


DatabaseId = Union[Literal["pyalgoviz-test"], Literal["unit-test"]]


def connect_to_fs(project: str, database_id: DatabaseId) -> firestore.Client:
    firebase_admin.initialize_app()
    return firestore.Client(project, database=database_id)
