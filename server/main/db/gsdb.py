from datetime import datetime
from enum import Enum
from typing import cast
from typing import TypeVar

import attrs
import main.db.models
from google.cloud.datastore import Client
from google.cloud.datastore import Entity
from google.cloud.datastore import Key
from main.db.models import Algorithm
from main.db.models import Event
from main.db.models import ScriptDemoInfo
from main.db.models import User
from main.db.models import UserId
from main.db.protocol import AlgorithmSummary
from main.db.protocol import DatabaseProtocol
from main.db.protocol import SaveAlgorithmArgs


class EntityType(Enum):
    USER = "User"
    ALGORITHM = "Algorithm"
    EVENT = "Event"


def _kind_for(attrs_class: type) -> str:
    match attrs_class:
        case main.db.models.User:
            return EntityType.USER.value
        case main.db.models.Algorithm:
            return EntityType.ALGORITHM.value
    raise ValueError(f"Unknown attrs_class: {attrs_class}")


T = TypeVar("T")


def entity_to_event(entity: Entity) -> Event:
    return Event(
        lineno=entity["lineno"],
        viz_output=entity["viz_output"],
        viz_log=entity["viz_log"],
        algo_log=entity["algo_log"],
    )


def entity_to_algorithm(entity: Entity) -> Algorithm:
    return Algorithm(
        author=entity["author"],
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

    def _event_to_entity(self, event: Event) -> Entity:
        entity = Entity(key=self._client.key(EntityType.EVENT.value))
        entity.update(attrs.asdict(event))
        return entity

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

    def _get_algo(self, algo_key: Key) -> Algorithm | None:
        # TODO figure out what to do here. Why can't this function just return an Entity?
        entity = cast(Entity, self._key_query(algo_key, Algorithm))
        if entity is None:
            return None
        return entity_to_algorithm(entity)

    def get_algo(self, author_id: UserId, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_id, name)
        return self._get_algo(algo_key)

    def save_algo(self, args: SaveAlgorithmArgs) -> None:
        algo_key = self._make_algo_key(args.author.firebase_user_id, args.name)
        last_updated = datetime.now()
        public = args.public
        if public is None:
            prev_algo = self._get_algo(algo_key)
            if prev_algo is None:
                # This shouldn't happen because we can't find the algorithm plus we don't have a value for public.
                # The only time args.public should be None is when the user clicks "Save" not "Save As". But we set
                # public to False in this case.
                public = False
            else:
                public = prev_algo.public
        entity = Entity(algo_key)
        entity.update(
            {
                "author": args.author,
                "name": args.name,
                "algo_script": args.algo_script,
                "viz_script": args.viz_script,
                "public": public,
                # filter out events with no viz output, since cached events are just for display on the front page
                "cached_events": [
                    self._event_to_entity(event)
                    for event in args.cached_events
                    if event.viz_output != ""
                ],
                "last_updated": last_updated,
            }
        )
        self._client.put(entity)

    def get_algo_summaries(self, author_id: UserId) -> list[AlgorithmSummary]:
        # Query for algorithms where the author is the given user
        author_query = self._client.query(kind=EntityType.ALGORITHM.value)
        author_query.add_filter("author", "=", author_id)

        # Query for public algorithms
        public_query = self._client.query(kind=EntityType.ALGORITHM.value)
        public_query.add_filter("public", "=", True)

        # Fetch both queries
        author_algos = list(author_query.fetch())
        public_algos = list(public_query.fetch())

        # Use a set to ensure there are no duplicates if the author's algorithms are also public
        all_algos = {
            entity.key.id_or_name: entity for entity in author_algos + public_algos
        }.values()

        # Create AlgorithmSummary objects
        algo_summaries = [
            AlgorithmSummary(
                author_email=algo[
                    "author"
                ].email,  # assuming `User` has an `email` attribute
                name=algo["name"],
            )
            for algo in all_algos
        ]

        return algo_summaries

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        query = self._client.query(kind=EntityType.ALGORITHM.value)
        query.add_filter("public", "=", True)
        results = list(query.fetch())
        return [ScriptDemoInfo.from_algorithm(algo) for algo in results]
