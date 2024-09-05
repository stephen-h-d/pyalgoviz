from __future__ import annotations

import json
from datetime import datetime
from typing import Dict
from typing import Type
from typing import TYPE_CHECKING
from typing import TypeVar

if TYPE_CHECKING:
    from attr import AttrsInstance

    T = TypeVar("T", bound=AttrsInstance)

import attrs
from server.main.db.models import Algorithm, AlgorithmSummary
from server.main.db.models import Event
from server.main.db.models import ScriptDemoInfo
from server.main.db.models import User
from server.main.db.models import FirebaseUserId
from server.main.db.protocol import SaveAlgorithmArgs, DatabaseProtocol

MODEL_ATTRS_CLASSES = {
    "Algorithm": Algorithm,
    "Event": Event,
    "ScriptDemoInfo": ScriptDemoInfo,
    "User": User,
}


def dict_to_attrs(class_type: Type[T], d: Dict) -> T:
    field_types = {f.name: f.type for f in attrs.fields(class_type)}
    for field, field_type in field_types.items():
        attrs_class = MODEL_ATTRS_CLASSES.get(field_type)
        if attrs_class is not None:
            d[field] = dict_to_attrs(attrs_class, d[field])
        elif "dict[" in str(field_type):
            # Extract key and value types from the string representation. checking `__origin__` does not work so we
            # go with this hack.
            key_type_str, value_type_str = str(field_type)[5:-1].split(", ")
            key_type = globals().get(key_type_str, key_type_str)
            value_type = globals().get(value_type_str, value_type_str)

            new_dict = {}
            for k, v in d[field].items():
                new_key = dict_to_attrs(key_type, k) if attrs.has(key_type) else k
                new_value = dict_to_attrs(value_type, v) if attrs.has(value_type) else v
                new_dict[new_key] = new_value
            d[field] = new_dict
        elif "list[" in str(field_type):
            # Extract the list's element type from the string representation
            element_type_str = str(field_type)[5:-1]
            element_type = globals().get(element_type_str, element_type_str)
            # print(f"Converting list element_type {element_type}")

            new_list = []
            for item in d[field]:
                new_item = (
                    dict_to_attrs(element_type, item) if attrs.has(element_type) else item
                )
                new_list.append(new_item)
            d[field] = new_list

    return class_type(**d)


@attrs.define
class MemoryDatabase(DatabaseProtocol):
    """An in-memory database used solely for development."""

    users: dict[FirebaseUserId, User] = attrs.field(factory=dict)
    algos: dict[str, Algorithm] = attrs.field(factory=dict)

    def get_user(self, user_id: FirebaseUserId) -> User | None:
        return self.users.get(user_id)

    def save_user(self, user: User) -> None:
        self.users[user.firebase_user_id] = user

    @staticmethod
    def _make_algo_key(author_email: str, algo_name: str) -> str:
        return author_email + ":" + algo_name

    def get_algo(self, author_email: str, name: str) -> Algorithm | None:
        algo_key = self._make_algo_key(author_email, name)
        return self.algos.get(algo_key)

    def save_algo(self, args: SaveAlgorithmArgs) -> None:
        algo_key = self._make_algo_key(args.author_email, args.name)
        public = args.requested_public
        if public is None:
            prev_algo = self.algos.get(algo_key)
            if prev_algo is None:
                # This shouldn't happen because we can't find the algorithm plus we don't have a value for public.
                # The only time args.public should be None is when the user clicks "Save" not "Save As". But we set
                # public to False in this case.
                public = False
            else:
                public = prev_algo.requested_public
        algo = Algorithm(
            author_email=args.author_email,
            name=args.name,
            algo_script=args.algo_script,
            viz_script=args.viz_script,
            requested_public=public,
            cached_events=args.cached_events,
            last_updated=datetime.now(),
        )
        self.algos[algo_key] = algo

    def get_algo_summaries(self, author_email: str) -> list[AlgorithmSummary]:
        return [
            AlgorithmSummary(name=algo.name, author_email=algo.author_email)
            for algo in self.algos.values()
            if author_email == algo.author_email
            or (algo.requested_public is True and len(algo.cached_events) > 0)
        ]

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        values = self.algos.values()
        result = [
            ScriptDemoInfo.from_algorithm(algo)
            for algo in values
            if algo.requested_public is True and len(algo.cached_events) > 0
        ]
        return result

    def cache_events(self, author_email: str, name: str, events: list[Event]) -> None:
        algo_key = self._make_algo_key(author_email, name)
        algo = self.algos.get(algo_key)
        if algo is None:
            raise ValueError(f"Algorithm {algo_key} not found.")
        algo.cached_events = events

    def get_algos_needing_caching(self) -> list[AlgorithmSummary]:
        return [
            AlgorithmSummary(name=algo.name, author_email=algo.author_email)
            for algo in self.algos.values()
            if (algo.requested_public is True and len(algo.cached_events) == 0)
        ]

    def to_dict(self) -> dict:
        return {
            "users": {k: attrs.asdict(v) for k, v in self.users.items()},
            "algos": {k: v.to_dict() for k, v in self.algos.items()},
        }

    @classmethod
    def from_dict(cls, d: dict) -> MemoryDatabase:
        users = {k: dict_to_attrs(User, v) for k, v in d.get("users", {}).items()}
        algos = {k: Algorithm.from_dict(v) for k, v in d.get("algos", {}).items()}
        return cls(users=users, algos=algos)

    def save_cached_demo_db(self) -> None:
        # Save the database to a file when the object is deleted so we can
        # load it next time.
        with open("server/main/cached_demo_db.json", "w") as f:
            json.dump(self.to_dict(), f)

    @classmethod
    def load_cached_demo_db(cls) -> MemoryDatabase:
        try:
            with open("server/main/cached_demo_db.json", "r") as f:
                loaded_dict = json.load(f)
                # print(f"loaded_dict {loaded_dict}")

            return MemoryDatabase.from_dict(loaded_dict)
        except Exception as e:
            print(f"Error loading cached demo db: {e}. Starting with empty database.")
            return MemoryDatabase()


# quick and dirty test of to_dict and from_dict
def main() -> None:
    db = MemoryDatabase()
    user = User(firebase_user_id="test_user", email="test@exampl.com")
    db.save_user(user)
    algo = SaveAlgorithmArgs(
        author_email=user.email,
        name="Test Algorithm",
        algo_script="print('Hello World')",
        viz_script="print('Visualize Hello World')",
        requested_public=True,
        cached_events=[Event(lineno=1, viz_output="viz", viz_log="log", algo_log="log")],
    )
    db.save_algo(algo)

    dict_version = db.to_dict()
    loaded_db = MemoryDatabase.from_dict(dict_version)
    assert loaded_db.users == db.users

    print("All tests passed!")


if __name__ == "__main__":
    main()
