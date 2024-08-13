from typing import Optional

import firebase_admin  # type: ignore[import]
from firebase_admin import firestore
from main.db.models import Algorithm
from main.db.models import AlgorithmSummary
from main.db.models import ScriptDemoInfo
from main.db.models import User
from main.db.models import UserId
from main.db.protocol import DatabaseProtocol
from main.db.protocol import SaveAlgorithmArgs


class FirestoreDatabase(DatabaseProtocol):
    def __init__(self) -> None:
        self._app = firebase_admin.initialize_app()
        self._db = firestore.client()

    def get_user(self, user_id: UserId) -> Optional[User]:
        ...

    def save_user(self, user: User) -> None:
        ...

    def get_algo(self, author_id: UserId, name: str) -> Optional[Algorithm]:
        ...

    def save_algo(self, algo: SaveAlgorithmArgs) -> None:
        ...

    def get_algo_summaries(self, author_id: UserId) -> list[AlgorithmSummary]:
        ...

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        ...
