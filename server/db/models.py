from datetime import datetime

import attrs

UserId = str


@attrs.define
class User:
    firebase_user_id: UserId
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

    def get_id(self) -> UserId:
        return self.firebase_user_id


@attrs.define(kw_only=True)
class Event:
    lineno: int
    viz_output: str
    viz_log: str
    algo_log: str


@attrs.define(kw_only=True)
class Algorithm:
    author_id: UserId
    name: str
    algo_script: str
    viz_script: str
    public: bool = False
    # not sure, but I think `events` in the old model was a way to cache a run of the
    # script for the public "all" page. I made the `Event` attrs class above, but since they are stored as JSON when
    # returned to the frontend and as an Entity (which is easier to create via a dictionary), I am just using
    # the `dict[str, str | int]` annotation/approach for now.
    cached_events: list[dict[str, str | int]] = []
    last_updated: datetime | None = None


@attrs.define
class Log:
    author: UserId
    msg: str
    timestamp: datetime


@attrs.define
class Comment:
    author: UserId
    name: str
    content: str
    timestamp: datetime
