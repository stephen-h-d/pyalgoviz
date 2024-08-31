import atexit
import json
import logging
import os
from http import HTTPStatus
from pathlib import Path

import attrs
from flask import Flask
from flask import jsonify
from flask import make_response
from flask import request
from flask import Response
from flask import send_file
from flask import send_from_directory
from flask_login import current_user  # type: ignore[import]
from flask_login import LoginManager

from server.main.db.models import Event
from server.main.db.models import FirebaseUserId
from server.main.db.models import User
from server.main.db.protocol import DatabaseProtocol
from server.main.db.protocol import SaveAlgorithmArgs
from server.main.middleware import JWTAuthenticator

# from server.main.run_script import run_script  # type: ignore[attr-defined]

logger = logging.getLogger(__name__)

login_manager = LoginManager()


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
USE_GOOGLE_DB = os.environ.get("USE_GOOGLE_DB", "False")

db: DatabaseProtocol

if USE_GOOGLE_DB.lower() == "true":
    from server.main.db.fsdb import FirestoreDatabase, connect_to_fs

    client = connect_to_fs(PROJECT, CREDENTIALS, "pyalgoviz-test")
    db = FirestoreDatabase(client)
else:
    from server.main.db.mdb import MemoryDatabase

    db = MemoryDatabase.load_cached_demo_db()

jwta = JWTAuthenticator(db)

app = Flask(__name__, static_folder="public")
app.secret_key = SECRET_KEY
login_manager.init_app(app)


def cleanup() -> None:
    if isinstance(db, MemoryDatabase):
        db.save_cached_demo_db()


# Register the cleanup function to run at exit
atexit.register(cleanup)


@login_manager.user_loader
def load_user(user_id: FirebaseUserId) -> User | None:
    return db.get_user(user_id)


@app.route("/")
@app.route("/edit/")
def serve_static() -> Response:
    if app.static_folder is None:
        raise ValueError("static_folder not set")

    path_to_file = Path(app.static_folder) / "dist" / "index.html"
    print(f"serve_static / {path_to_file}")
    return send_file(path_to_file)


@app.route("/api/save", methods=["POST", "OPTIONS"])
@jwta.authenticated
def save() -> Response:
    author: User = current_user
    try:
        data = request.get_data().decode("utf-8")
        submission = json.loads(data)
        publish = submission.get("publish")
        cached_events: list[Event] = []
        algo_script = submission.get("algo_script")
        viz_script = submission.get("viz_script")
        name = submission.get("name")
        if algo_script is None or viz_script is None or name is None:
            logger.error(
                f"Missing one or more arguments. {algo_script}, {viz_script}, {name}"
            )
            response = jsonify(
                {
                    "result": "Whoops!  Saving failed. Missing arguments.  Please report this bug."
                }
            )
            return make_response(response, HTTPStatus.BAD_REQUEST)

        # if publish is True:
        #     res = run_script(algo_script, viz_script)
        #     if res["py_error"] is None:
        #         events = res["events"]
        #         cached_events = [Event(**event) for event in events]
        #     else:
        #         logger.error(
        #             f"Could not run script to cache events for public view: {res['py_error']}"
        #         )

        args = SaveAlgorithmArgs(
            author_email=author.email,
            name=name,
            algo_script=algo_script,
            viz_script=viz_script,
            public=publish,
            cached_events=cached_events,
        )
        db.save_algo(args)
        # notify(author, 'save', algo.name, algo.script, algo.viz)
        msg = 'Script was successfully saved by %s as "%s"' % (author.email, name)
        # info(msg)
        # info(algo.script)
    except Exception as e:
        msg = "Could not save script: %s" % e
        logger.error(msg)
        logger.exception(e)
        response = jsonify({"result": "Whoops!  Saving failed.  Please report this bug."})
        return make_response(response, HTTPStatus.INTERNAL_SERVER_ERROR)
    response = jsonify({"result": msg})
    return make_response(response, HTTPStatus.OK)


@app.route("/api/verify_login", methods=["GET", "OPTIONS"])
@jwta.authenticated
def verify_login() -> Response:
    user: User = current_user
    logging.info(f"User {user.email} is logged in.")
    return jsonify({"result": "success"})


@app.route("/api/script_names", methods=["GET", "OPTIONS"])
@jwta.authenticated
def get_script_names() -> Response:
    author: User = current_user
    try:
        script_summaries = db.get_algo_summaries(author.email)
        dict_script_summaries = [attrs.asdict(summary) for summary in script_summaries]
        return jsonify({"result": dict_script_summaries})
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/api/public_scripts", methods=["GET", "OPTIONS"])
def get_public_scripts() -> Response:
    print("get_public_scripts")
    try:
        script_demo_info_list = [
            attrs.asdict(demo_info) for demo_info in db.get_public_algos()
        ]
        return jsonify({"result": script_demo_info_list})
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/api/load", methods=["GET", "OPTIONS"])
@jwta.authenticated
def load() -> Response:
    author: User = current_user
    try:
        script_name = request.args.get("script_name")
        author_email = request.args.get("author_email")
        if script_name is None or author_email is None:
            logger.error(f"Missing one or more arguments. {script_name}, {author_email}")
            response = jsonify(
                {
                    "result": "Whoops!  Loading script failed. Missing arguments.  Please report this bug."
                }
            )
            return make_response(response, HTTPStatus.BAD_REQUEST)

        algo = db.get_algo(author.email, script_name)
        if algo is None:
            logger.error(
                f"Could not find script with name {script_name} and author email {author.email}"
            )
            response = jsonify(
                {
                    "result": "Whoops!  Loading script failed. Could not find script.  Please report this bug."
                }
            )
            return make_response(response, HTTPStatus.BAD_REQUEST)

        return jsonify(attrs.asdict(algo))
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


# TODO decide whether to make the run_script safe/secure enough or just take this out altogether.
# @app.route("/api/run", methods=["POST", "OPTIONS"])
# @jwta.authenticated
# def run() -> Response:
#     try:
#         data = request.get_data().decode("utf-8")
#         submission = json.loads(data)
#         algo_script = submission.get("algo_script")
#         viz_script = submission.get("viz_script")
#         result = run_script(algo_script, viz_script)
#     except Exception as e:
#         msg = "Could not run script: %s" % e
#         logger.error(msg)
#         logger.exception(e)
#         response = jsonify(
#             {"result": "Whoops!  Running failed.  Please report this bug."}
#         )
#         return make_response(response, HTTPStatus.INTERNAL_SERVER_ERROR)
#     return jsonify(result)


@app.route("/<path:filename>")
def serve_static_assets(filename: str) -> Response:
    if filename.startswith("api/"):
        # If the path starts with "api/", let Flask continue to look for other matching routes
        return Response(status=404)

    if app.static_folder is None:
        raise ValueError("static_folder not set")

    path_to_dir = Path(app.static_folder) / "dist"
    sub_path = Path(filename)
    return send_from_directory(path_to_dir, sub_path)


if __name__ == "__main__":
    app.run(debug=True)
