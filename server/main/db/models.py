from __future__ import annotations

from datetime import datetime

import attrs

FirebaseUserId = str


@attrs.define
class User:
    firebase_user_id: FirebaseUserId
    email: str
    display_name: str | None

    # The following three properties and method are necessary for use in conjunction with
    # the flask-login library
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_active(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return True

    def get_id(self) -> FirebaseUserId:
        return self.firebase_user_id


@attrs.define(kw_only=True)
class Event:
    lineno: int
    viz_output: str
    viz_log: str
    algo_log: str
    viz_error_line: int | None = None


# An ephemeral summary of an algorithm used for listing available algorithms.
@attrs.define
class AlgorithmSummary:
    author_firebase_user_id: FirebaseUserId
    author_display_name: str
    name: str


@attrs.define(kw_only=True)
class Algorithm:
    author_firebase_user_id: FirebaseUserId
    name: str
    algo_script: str
    viz_script: str
    requested_public: bool = False
    # if and only if it has cached events and requested_public is true, it is public.
    # cached events will be set manually for now.
    cached_events: list[Event] = []
    last_updated: datetime | None = None

    def to_dict(self) -> dict:
        return {
            "author_firebase_user_id": self.author_firebase_user_id,
            "name": self.name,
            "algo_script": self.algo_script,
            "viz_script": self.viz_script,
            "requested_public": self.requested_public,
            "cached_events": [attrs.asdict(event) for event in self.cached_events],
            "last_updated": self.last_updated.strftime("%Y-%m-%d %H:%M:%S")
            if self.last_updated is not None
            else None,
        }

    @classmethod
    def from_dict(cls, d: dict) -> Algorithm:
        events = [Event(**event) for event in d["cached_events"]]
        last_updated = datetime.strptime(d["last_updated"], "%Y-%m-%d %H:%M:%S")
        return cls(
            author_firebase_user_id=d["author_firebase_user_id"],
            name=d["name"],
            algo_script=d["algo_script"],
            viz_script=d["viz_script"],
            requested_public=d["requested_public"],
            cached_events=events,
            last_updated=last_updated,
        )


@attrs.define(kw_only=True)
class ScriptDemoInfo:
    author_display_name: str
    name: str
    cached_events: list[Event]

    @classmethod
    def from_algorithm(cls, algo: Algorithm, author_display_name: str) -> ScriptDemoInfo:
        if algo.requested_public is False:
            raise ValueError("Only public algorithms can be used as script demos")

        return cls(
            author_display_name=author_display_name,
            name=algo.name,
            cached_events=algo.cached_events,
        )
