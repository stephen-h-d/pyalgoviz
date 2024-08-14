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
from main.db.models import FirebaseUserId
from main.db.models import User
from main.db.protocol import DatabaseProtocol
from main.db.protocol import SaveAlgorithmArgs
from main.middleware import JWTAuthenticator
from main.run_script import run_script  # type: ignore[attr-defined]

logger = logging.getLogger(__name__)

login_manager = LoginManager()


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
USE_GOOGLE_DB = os.environ.get("USE_GOOGLE_DB", "False")

db: DatabaseProtocol

if USE_GOOGLE_DB.lower() == "true":
    from main.db.fsdb import FirestoreDatabase

    fb = FirestoreDatabase()
else:
    from main.db.mdb import MemoryDatabase

    db = MemoryDatabase.load_cached_demo_db()

jwta = JWTAuthenticator(db)

app = Flask(__name__, static_folder="public")
app.secret_key = SECRET_KEY
login_manager.init_app(app)


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
        cached_events = []
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

        if publish is True:
            res = run_script(algo_script, viz_script)
            if res["py_error"] is None:
                events = res["events"]
                print(f"first 100 events {events[0:100]}")
                cached_events = events

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


@app.route("/api/script_names", methods=["GET", "OPTIONS"])
@jwta.authenticated
def get_script_names() -> Response:
    author: User = current_user
    try:
        script_summaries = db.get_algo_summaries(author.email)
        # TODO handle the new summary type on the FE
        return jsonify({"result": script_summaries})
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
        if script_name is None:
            logger.error("Missing script name when trying to load a script.")
            response = jsonify(
                {
                    "result": "Whoops!  Loading script failed. Missing script name.  Please report this bug."
                }
            )
            return make_response(response, HTTPStatus.BAD_REQUEST)

        algo = db.get_algo(author.email, script_name)
        return jsonify(attrs.asdict(algo))
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/api/run", methods=["POST", "OPTIONS"])
@jwta.authenticated
def run() -> Response:
    try:
        data = request.get_data().decode("utf-8")
        submission = json.loads(data)
        algo_script = submission.get("algo_script")
        viz_script = submission.get("viz_script")
        result = run_script(algo_script, viz_script)
    except Exception as e:
        msg = "Could not run script: %s" % e
        logger.error(msg)
        logger.exception(e)
        response = jsonify(
            {"result": "Whoops!  Running failed.  Please report this bug."}
        )
        return make_response(response, HTTPStatus.INTERNAL_SERVER_ERROR)
    return jsonify(result)


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
