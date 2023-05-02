from datetime import datetime
from enum import Enum
from typing import TypeVar

import attrs
from google.cloud.datastore import Client
from google.cloud.datastore import Entity
from google.cloud.datastore import Key

import server.db.models
from server.db.models import Algorithm
from server.db.models import Event
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


def event_to_entity(event: Event) -> Entity:
    entity = Entity(key=Key("Event"))
    entity.update(
        {
            "lineno": event.lineno,
            "viz_output": event.viz_output,
            "viz_log": event.viz_log,
            "algo_log": event.algo_log,
        }
    )
    return entity


def entity_to_event(entity: Entity) -> Event:
    return Event(
        lineno=entity["lineno"],
        viz_output=entity["viz_output"],
        viz_log=entity["viz_log"],
        algo_log=entity["algo_log"],
    )


def entity_to_algorithm(entity: Entity) -> Algorithm:
    return Algorithm(
        author_id=entity["author_id"],
        name=entity["name"],
        algo_script=entity["algo_script"],
        viz_script=entity["viz_script"],
        public=entity["public"],
        cached_events=[
            entity_to_event(event_entity) for event_entity in entity["cached_events"]
        ],
        last_updated=entity["last_updated"],
    )


@attrs.define
class GoogleStoreDatabase(DatabaseProtocol):
    """A database based on Google DataStore."""

    _client: Client

    def _key_query(self, key: Key, attrs_class: type[T]) -> dict | None:
        query = self._client.query(kind=_kind_for(attrs_class))
        query.key_filter(key, "=")
        results = list(query.fetch())
        # NOTE: We are not checking if there is more than one result -- as far as I
        # understand, there can't ever be.
        if len(results) > 0:
            return dict(results[0].items())
        else:
            return None

    def get_user(self, user_id: UserId) -> User | None:
        user_key = self._client.key(EntityType.USER.value, user_id)
        entity = self._key_query(user_key, User)
        if entity is None:
            return None

        return User(**entity)

    def save_user(self, user: User) -> None:
        user_key = self._client.key(EntityType.USER.value, user.firebase_user_id)
        entity = Entity(user_key)
        entity.update(attrs.asdict(user))
        self._client.put(entity)

    def _make_algo_key(self, author_id: UserId, algo_name: str) -> Key:
        # keys can be strings, and there can only be one key, so this is how we guarantee
        # uniqueness of the algorithm by name and author -- by combining the author ID and
        # the algorithm name.
        key_str = str(author_id) + ":" + algo_name
        return self._client.key(EntityType.ALGORITHM.value, key_str)

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_id, name)
        entity = self._key_query(algo_key, Algorithm)
        if entity is None:
            return None
        return entity_to_algorithm(entity)

    def save_algo(self, algo: Algorithm) -> None:
        algo_key = self._make_algo_key(algo.author_id, algo.name)
        algo.last_updated = datetime.now()
        entity = Entity(algo_key)
        print(f"cached_events before updating {algo.cached_events}")
        entity.update(
            {
                "author_id": algo.author_id,
                "name": algo.name,
                "algo_script": algo.algo_script,
                "viz_script": algo.viz_script,
                "public": algo.public,
                "cached_events": [event_to_entity(event) for event in algo.cached_events],
                "last_updated": algo.last_updated,
            }
        )
        print(f"cached_events before saving {entity['cached_events']}")
        self._client.put(entity)

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        query = self._client.query(kind=EntityType.ALGORITHM.value)
        query.add_filter("author_id", "=", author_id)
        results = list(query.fetch())
        algo_names = [result["name"] for result in results]
        return algo_names

    def get_public_algos(self) -> list[tuple[UserId, str]]:
        query = self._client.query(kind=EntityType.ALGORITHM.value)
        query.add_filter("public", "=", True)
        results = list(query.fetch())
        public_algos = [(result["author_id"], result["name"]) for result in results]
        return public_algos
