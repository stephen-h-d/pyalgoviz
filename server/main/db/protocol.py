from typing import Protocol

import attrs

from server.main.db.models import Algorithm
from server.main.db.models import AlgorithmSummary
from server.main.db.models import Event
from server.main.db.models import FirebaseUserId
from server.main.db.models import ScriptDemoInfo
from server.main.db.models import User


@attrs.define(kw_only=True)
class SaveAlgorithmArgs:
    author_email: str
    name: str
    algo_script: str
    viz_script: str
    requested_public: bool | None = False
    # if and only if it has cached events and requested_public is true, it is public.
    # cached events will be set manually for now.
    cached_events: list[Event] = []


class DatabaseProtocol(Protocol):
    def get_user(self, user_id: FirebaseUserId) -> User | None:
        ...

    def save_user(self, user: User) -> None:
        ...

    def get_algo(self, author_email: str, name: str) -> Algorithm | None:
        ...

    def save_algo(self, algo: SaveAlgorithmArgs) -> None:
        ...

    """
    Get a summary of each algorithm that is either public or was authored by the given user.
    These are the ones that the user can load.
    """

    def get_algo_summaries(self, author_email: str) -> list[AlgorithmSummary]:
        ...

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        ...
