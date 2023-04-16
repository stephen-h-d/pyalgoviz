from datetime import datetime
from enum import Enum
from typing import Any
from typing import TypeVar

import attrs
from google.cloud.datastore import Client
from google.cloud.datastore import Entity
from google.cloud.datastore import Key

import server.db.models
from server.db.models import Algorithm
from server.db.models import User
from server.db.models import UserId
from server.db.protocol import DatabaseProtocol


class EntityType(Enum):
    USER = "User"
    ALGORITHM = "Algorithm"


def _kind_for(attrs_class: type) -> str:
    match attrs_class:
        case server.db.models.User:
            return EntityType.USER.value
        case server.db.models.Algorithm:
            return EntityType.ALGORITHM.value
    raise ValueError(f"Unknown attrs_class: {attrs_class}")


T = TypeVar("T")


@attrs.define
class GoogleStoreDatabase(DatabaseProtocol):
    """A database based on Google DataStore."""

    _client: Client

    def _key_query(self, key: Key, attrs_class: type[T]) -> T | None:
        query = self._client.query(kind=_kind_for(attrs_class))
        query.key_filter(key, "=")
        results = list(query.fetch())
        # NOTE: We are not checking if there is more than one result -- as far as I
        # understand, there can't ever be.
        if len(results) > 0:
            result_as_dict = dict(results[0].items())
            return attrs_class(**result_as_dict)
        else:
            return None

    def _save_entity(self, key: Key, attrs_instance: Any) -> None:
        entity = Entity(key)
        entity.update(attrs.asdict(attrs_instance))
        self._client.put(entity)

    def get_user(self, user_id: UserId) -> User | None:
        user_key = self._client.key(EntityType.USER.value, user_id)
        return self._key_query(user_key, User)

    def save_user(self, user: User) -> None:
        user_key = self._client.key(EntityType.USER.value, user.firebase_user_id)
        self._save_entity(user_key, user)

    def _make_algo_key(self, author_id: UserId, algo_name: str) -> Key:
        # keys can be strings, and there can only be one key, so this is how we guarantee
        # uniqueness of the algorithm by name and author -- by combining the author ID and
        # the algorithm name.
        key_str = str(author_id) + ":" + algo_name
        return self._client.key(EntityType.ALGORITHM.value, key_str)

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_id, name)
        return self._key_query(algo_key, Algorithm)

    def save_algo(self, algo: Algorithm) -> None:
        algo_key = self._make_algo_key(algo.author_id, algo.name)
        algo.last_updated = datetime.now()
        self._save_entity(algo_key, algo)

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        raise NotImplementedError()

    def get_public_algos(self) -> list[tuple[UserId, str]]:
        raise NotImplementedError()
