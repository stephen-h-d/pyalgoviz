from typing import Protocol

import attrs
from main.db.models import Algorithm
from main.db.models import AlgorithmSummary
from main.db.models import Event
from main.db.models import FirebaseUserId
from main.db.models import ScriptDemoInfo
from main.db.models import User


@attrs.define(kw_only=True)
class SaveAlgorithmArgs:
    author_email: str
    name: str
    algo_script: str
    viz_script: str
    public: bool | None = False
    # not sure, but I think `events` in the old model was a way to cache a run of the
    # script for the public "all" page. Assuming that for now.
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
