from __future__ import annotations

from datetime import datetime

import attrs

FirebaseUserId = str


@attrs.define
class User:
    firebase_user_id: FirebaseUserId
    email: str

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


@attrs.define
class AlgorithmSummary:
    author_email: str
    name: str


@attrs.define(kw_only=True)
class Algorithm:
    author_email: str
    name: str
    algo_script: str
    viz_script: str
    public: bool = False
    # not sure, but I think `events` in the old model was a way to cache a run of the
    # script for the public "all" page. Assuming that for now.
    cached_events: list[Event] = []
    last_updated: datetime | None = None


@attrs.define(kw_only=True)
class ScriptDemoInfo:
    author_email: str
    name: str
    cached_events: list[Event]

    @classmethod
    def from_algorithm(cls, algo: Algorithm) -> ScriptDemoInfo:
        if algo.public is False:
            raise ValueError("Only public algorithms can be used as script demos")

        return cls(
            author_email=algo.author_email,
            name=algo.name,
            cached_events=algo.cached_events,
        )


@attrs.define
class Log:
    author: FirebaseUserId
    msg: str
    timestamp: datetime


@attrs.define
class Comment:
    author: FirebaseUserId
    name: str
    content: str
    timestamp: datetime
