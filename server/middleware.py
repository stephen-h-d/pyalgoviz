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
from typing import Callable, TypeVar

import firebase_admin
from firebase_admin import auth  # noqa: F401
from firebase_admin.auth import InvalidIdTokenError
from flask import request, Response, redirect, url_for
from flask_login import login_user, current_user
from google.cloud import datastore

a = TypeVar("a")

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
default_app = firebase_admin.initialize_app()
client = datastore.Client(project=PROJECT)


def _jwt_authenticated(required: bool = True):
    # This middleware function was adapted from a google app engine docs sample.
    # I'm not sure why it's annotated as returning `int` but I'm leaving it for now.
    def inner_jwt_authenticated(func: Callable[..., int]) -> Callable[..., int]:
        @wraps(func)
        def decorated_function(*args: a, **kwargs: a) -> a:
            if current_user.is_authenticated:
                return func(*args, **kwargs)

            id_token = request.cookies.get("token")
            if id_token:
                try:
                    decoded_token = firebase_admin.auth.verify_id_token(id_token)
                    uid = decoded_token["uid"]
                    user_key = client.key("User", uid)

                    # user = User.query().filter(User.firebase_user_id == uid).get()
                    query = client.query(kind="User")
                    query.key_filter(user_key, "=")
                    results = list(query.fetch())

                    if len(results) == 0:
                        user = datastore.Entity(key=user_key)
                        user.update({
                            "email": decoded_token["email"],
                            "firebase_user_id": uid,
                        })
                        client.put(user)

                    print(f"user {user}")

                    login_user(user)
                except InvalidIdTokenError as e:
                    # TODO figure out how to indicate to the client that the token is
                    # invalid.  Also, I can't user `url_for` any more...
                    return redirect(url_for('login'))
                except ValueError as exc:
                    # This will be raised if the token is expired or any other
                    # verification checks fail.
                    error_message = str(exc)
                    return Response(status=403,
                                    response=f"Error with authentication: {error_message}")
            elif required:
                return redirect(url_for('login'))

            return func(*args, **kwargs)

        return decorated_function

    return inner_jwt_authenticated


jwt_authenticated = _jwt_authenticated(required=True)
jwt_authenticated_optional = _jwt_authenticated(required=False)
