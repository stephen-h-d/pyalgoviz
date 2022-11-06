import attrs
from datetime import datetime

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

    def get_id(self) -> bool:
        return self.firebase_user_id


@attrs.define
class Algorithm:
    author: UserId
    name: str
    algo_script: str
    viz_script: str
    last_updated: datetime
    public: bool
    # not sure, but I think `events` in the old model was a way to cache a run of the
    # script for the public "all" page.
    cached_events: list[str]


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
