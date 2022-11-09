# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import os
from functools import wraps
from typing import Any
from typing import Callable
from typing import TypeVar

import attrs
import firebase_admin  # type: ignore[import]
from firebase_admin import auth  # noqa: F401  # type: ignore[import]
from firebase_admin.auth import InvalidIdTokenError  # type: ignore[import]
from flask import request
from flask import Response
from flask_login import current_user  # type: ignore[import]
from flask_login import login_user
from google.cloud import datastore

from server.db.models import User
from server.db.protocol import DatabaseProtocol

a = TypeVar("a")

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
default_app = firebase_admin.initialize_app()
client = datastore.Client(project=PROJECT)


@attrs.define
class JWTAuthenticator:
    db: DatabaseProtocol

    # This middleware function was adapted from a google app engine docs sample.
    # I'm not sure why it's annotated as returning `int` but I'm leaving it for now.
    def authenticated(self, func: Callable[..., int]) -> Callable[..., int]:
        @wraps(func)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if current_user.is_authenticated:
                return func(*args, **kwargs)

            id_token = request.cookies.get("token")
            if id_token:
                try:
                    decoded_token = firebase_admin.auth.verify_id_token(id_token)
                    uid = decoded_token["uid"]
                    user = self.db.get_user(uid)
                    if user is None:
                        user = User(firebase_user_id=uid, email=decoded_token["email"])
                        self.db.save_user(user)

                    login_user(user)
                except InvalidIdTokenError:
                    # TODO figure out how to indicate to the client that the token is
                    # invalid.  It might not be that big a deal, though, if all the
                    # Python code is just an API.
                    # However, there might be some pages that we don't want to load if
                    # the user is not logged in.  Not sure yet.
                    return Response(
                        status=403, response="Not allowed without logging in first"
                    )
                except ValueError as exc:
                    # This will be raised if the token is expired or any other
                    # verification checks fail.
                    error_message = str(exc)
                    return Response(
                        status=403,
                        response=f"Error with authentication: {error_message}",
                    )
            else:
                return Response(
                    status=403, response="Not allowed without logging in first"
                )

            return func(*args, **kwargs)

        return decorated_function
