from typing import Protocol

from server.db.models import Algorithm
from server.db.models import ScriptDemoInfo
from server.db.models import User
from server.db.models import UserId


class DatabaseProtocol(Protocol):
    def get_user(self, user_id: UserId) -> User | None:
        ...

    def save_user(self, user: User) -> None:
        ...

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        ...

    def save_algo(self, algo: Algorithm) -> None:
        ...

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        ...

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        ...
