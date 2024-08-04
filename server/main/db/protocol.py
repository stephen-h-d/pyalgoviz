from typing import Protocol
from datetime import datetime

import attrs

from main.db.models import ScriptDemoInfo
from main.db.models import User
from main.db.models import Algorithm
from main.db.models import UserId

from main.db.models import Event


@attrs.define(kw_only=True)
class SaveAlgorithmArgs:
    author: User
    name: str
    algo_script: str
    viz_script: str
    public: bool | None = False
    # not sure, but I think `events` in the old model was a way to cache a run of the
    # script for the public "all" page. Assuming that for now.
    cached_events: list[Event] = []
    last_updated: datetime | None = None

class DatabaseProtocol(Protocol):
    def get_user(self, user_id: UserId) -> User | None:
        ...

    def save_user(self, user: User) -> None:
        ...

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        ...

    def save_algo(self, algo: SaveAlgorithmArgs) -> None:
        ...

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        ...

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        ...
