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
from main.db.models import Algorithm
from main.db.models import Event
from main.db.models import ScriptDemoInfo
from main.db.models import User
from main.db.models import UserId
from main.db.protocol import DatabaseProtocol
from main.db.protocol import SaveAlgorithmArgs

# Function to convert dictionary back to attrs object
# def dict_to_attrs(class_type, d):
#     field_types = {f.name: f.type for f in attrs.fields(class_type)}
#     for field, field_type in field_types.items():
#
#         print(f"field {field} field_type {field_type}")
#         # TODO the abovel ine results in this: ugh.
#         # field users field_type dict[UserId, User]
#         # field algos field_type dict[str, Algorithm]
#         if attrs.has(field_type):
#             d[field] = dict_to_attrs(field_type, d[field])
#     return class_type(**d)


MODEL_ATTRS_CLASSES = {
    "Algorithm": Algorithm,
    "Event": Event,
    "ScriptDemoInfo": ScriptDemoInfo,
    "User": User,
}


def dict_to_attrs(class_type: Type[T], d: Dict) -> T:
    print(f"instantiating {class_type}")

    field_types = {f.name: f.type for f in attrs.fields(class_type)}
    for field, field_type in field_types.items():
        print(f"field {field} field_type {field_type}")
        print(f"does `attrs` have {field_type}? {attrs.has(field_type)}")

        attrs_class = MODEL_ATTRS_CLASSES.get(field_type)
        if attrs_class is not None:
            d[field] = dict_to_attrs(attrs_class, d[field])
        elif "dict[" in str(field_type):
            # Extract key and value types from the string representation. checking `__origin__` does not work so we
            # go with this hack.
            key_type_str, value_type_str = str(field_type)[5:-1].split(", ")
            key_type = globals().get(key_type_str, key_type_str)
            value_type = globals().get(value_type_str, value_type_str)
            print(f"Converting dictionary {key_type} {value_type}")

            new_dict = {}
            for k, v in d[field].items():
                new_key = dict_to_attrs(key_type, k) if attrs.has(key_type) else k
                new_value = dict_to_attrs(value_type, v) if attrs.has(value_type) else v
                print(f"new_key {new_key}")
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

    def save_algo(self, args: SaveAlgorithmArgs) -> None:
        algo_key = self._make_algo_key(args.author.firebase_user_id, args.name)
        public = args.public
        if public is None:
            prev_algo = self.algos.get(algo_key)
            if prev_algo is None:
                # This shouldn't happen because we can't find the algorithm plus we don't have a value for public.
                # The only time args.public should be None is when the user clicks "Save" not "Save As". But we set
                # public to False in this case.
                public = False
            else:
                public = prev_algo.public
        algo = Algorithm(
            author=args.author,
            name=args.name,
            algo_script=args.algo_script,
            viz_script=args.viz_script,
            public=public,
            cached_events=args.cached_events,
            last_updated=datetime.now(),
        )
        self.algos[algo_key] = algo

    def get_algo_names_by(self, author_id: UserId) -> list[str]:
        return [
            algo.name
            for algo in self.algos.values()
            if algo.author.firebase_user_id == author_id
        ]

    def get_public_algos(self) -> list[ScriptDemoInfo]:
        # sd = attrs.asdict(self)
        # with open("cached_demo_db.json","w") as f:
        #     json.dump(sd, f)
        #
        # back_converted = dict_to_attrs(MemoryDatabase, sd)
        # print("succcess...")

        return [
            ScriptDemoInfo.from_algorithm(algo)
            for algo in self.algos.values()
            if algo.public is True
        ]

    @classmethod
    def load_cached_demo_db(cls) -> MemoryDatabase:
        with open("main/cached_demo_db.json", "r") as f:
            loaded_dict = json.load(f)

        return dict_to_attrs(MemoryDatabase, loaded_dict)
