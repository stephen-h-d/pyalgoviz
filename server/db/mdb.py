import attrs

from datetime import datetime

from server.db.models import User, Algorithm, UserId
from server.db.protocol import DatabaseProtocol


@attrs.define
class MemoryDatabase(DatabaseProtocol):
    """A database based on Google DataStore."""
    users: dict[UserId, User] = attrs.field(factory=dict,init=False)
    algos: dict[str, Algorithm] = attrs.field(factory=dict,init=False)

    def get_user(self, user_id: UserId) -> User | None:
        return self.users.get(user_id)

    def save_user(self, user: User) -> None:
        self.users[user.firebase_user_id] = user

    @staticmethod
    def _make_algo_key(author_id: UserId, algo_name: str):
        return str(author_id) + ":" + algo_name

    def get_algo(self, author_id: UserId, name: str) -> Algorithm:
        algo_key = self._make_algo_key(author_id, name)
        return self.algos.get(algo_key)

    def save_algo(self, algo: Algorithm):
        algo_key = self._make_algo_key(algo.author_id, algo.name)
        algo.last_updated = datetime.now()
        self.algos[algo_key] = algo

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        raise NotImplementedError()

    def get_public_algos(self) -> list[Algorithm]:
        raise NotImplementedError()
