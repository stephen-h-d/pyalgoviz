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


from functools import wraps
from typing import Callable, Dict, TypeVar

import firebase_admin
from firebase_admin import auth  # noqa: F401
from flask import request, Response, redirect, url_for
from flask_login import login_user, current_user

from models import User

a = TypeVar("a")

default_app = firebase_admin.initialize_app()


def jwt_authenticated(required: bool = True):
    # This middleware function was adapted from a google app engine docs sample.
    # I'm not sure why it's annotated as returning `int` but I'm leaving it for now.
    def _jwt_authenticated(func: Callable[..., int]) -> Callable[..., int]:
        @wraps(func)
        def decorated_function(*args: a, **kwargs: a) -> a:
            if current_user.is_authenticated:
                print("current user already authenticated")
                return

            id_token = request.cookies.get("token")
            print(f"id_token {id_token}")
            if id_token:
                try:
                    decoded_token = firebase_admin.auth.verify_id_token(id_token)
                    uid = decoded_token["uid"]

                    user = User.query().filter(User.firebase_user_id == uid).get()

                    print(f"user {user}")

                    if user is None:
                        email = decoded_token["email"]
                        user = User(firebase_user_id=uid,email=email)
                        user.put()

                    print(f"user {user}")

                    login_user(user)

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

    return _jwt_authenticated
