from datetime import datetime

import attrs

from server.db.models import Algorithm
from server.db.models import User
from server.db.models import UserId
from server.db.protocol import DatabaseProtocol


@attrs.define
class MemoryDatabase(DatabaseProtocol):
    """A database based on Google DataStore."""

    users: dict[UserId, User] = attrs.field(factory=dict)
    algos: dict[str, Algorithm] = attrs.field(factory=dict)

    def get_user(self, user_id: UserId) -> User | None:
        return self.users.get(user_id)

    def save_user(self, user: User) -> None:
        self.users[user.firebase_user_id] = user

    @staticmethod
    def _make_algo_key(author_id: UserId, algo_name: str) -> str:
        return str(author_id) + ":" + algo_name

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_id, name)
        return self.algos.get(algo_key)

    def save_algo(self, algo: Algorithm) -> None:
        algo_key = self._make_algo_key(algo.author_id, algo.name)
        algo.last_updated = datetime.now()
        self.algos[algo_key] = algo

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        return [algo.name for algo in self.algos.values() if algo.author_id == author_id]

    def get_public_algos(self) -> list[tuple[UserId, str]]:
        return [(algo.author_id, algo.name) for algo in self.algos.values()]

    @classmethod
    def with_fake_entries(cls):  #
        user_id = "1jfsBKaFvEeM5PxP6GCzVadvrq33"
        user = User(user_id, "stephendause@gmail.com")
        algo = Algorithm(
            author_id=user_id, name="foo", algo_script="", viz_script="", public=False
        )
        algo_key = cls._make_algo_key(user_id, "foo")
        return cls({user_id: user}, {algo_key: algo})
