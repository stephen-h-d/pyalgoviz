import json
import logging
import os
from http import HTTPStatus

import attrs
from flask import Flask
from flask import request
from flask import Response
from flask_login import current_user  # type: ignore[import]
from flask_login import LoginManager
from google.cloud import datastore

from server.db.models import Algorithm
from server.db.models import User
from server.db.models import UserId
from server.db.protocol import DatabaseProtocol
from server.middleware import JWTAuthenticator
from server.run_script import run_script  # type: ignore[attr-defined]

logger = logging.getLogger(__name__)

login_manager = LoginManager()


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
USE_GOOGLE_DB = os.environ.get("USE_GOOGLE_DB", "False")

db: DatabaseProtocol

if USE_GOOGLE_DB == "True":
    from server.db.gsdb import GoogleStoreDatabase

    client = datastore.Client(project=PROJECT)
    db = GoogleStoreDatabase(client)
else:
    from server.db.mdb import MemoryDatabase

    db = MemoryDatabase.with_fake_entries()

jwta = JWTAuthenticator(db)

app = Flask(__name__)
app.secret_key = SECRET_KEY
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id: UserId) -> User | None:
    return db.get_user(user_id)


@app.route("/save", methods=["POST"])
@jwta.authenticated
def save() -> Response:
    author: User = current_user
    try:
        data = request.get_data().decode("utf-8")
        submission = json.loads(data)
        publish = submission.get("publish", False)
        algo = Algorithm(
            author=author,
            algo_script=submission.get("algo_script"),
            viz_script=submission.get("viz_script"),
            public=publish,
            name=submission.get("name"),
        )
        if publish:
            res = run_script(algo.algo_script, algo.viz_script)
            if res["py_error"] is None:
                events = res["events"]
                algo.cached_events = events
        db.save_algo(algo)
        # notify(author, 'save', algo.name, algo.script, algo.viz)
        msg = 'Script was successfully saved by %s as "%s"' % (author.email, algo.name)
        # info(msg)
        # info(algo.script)
    except Exception as e:
        msg = "Could not save script: %s" % e
        logger.error(msg)
        logger.exception(e)
        return {
            "result": "Whoops!  Saving failed.  Please report this bug."
        }, HTTPStatus.INTERNAL_SERVER_ERROR
    return {"result": msg}, HTTPStatus.OK


@app.route("/script_names", methods=["GET"])
@jwta.authenticated
def get_script_names() -> Response:
    author: User = current_user
    try:
        script_names = db.get_algo_names_by(author.firebase_user_id)
        return {"result": script_names}
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/public_scripts", methods=["GET"])
def get_public_scripts() -> Response:
    try:
        script_demo_info_list = [
            attrs.asdict(demo_info) for demo_info in db.get_public_algos()
        ]
        return {"result": script_demo_info_list}
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/load", methods=["GET"])
@jwta.authenticated
def load() -> Response:
    author: User = current_user
    try:
        script_name = request.args.get("script_name")
        algo = db.get_algo(author.firebase_user_id, script_name)
        return attrs.asdict(algo), HTTPStatus.OK
    except Exception as e:
        msg = "Could not load script names: %s" % e
        logger.error(msg)
        logger.exception(e)
        return Response(
            status=HTTPStatus.INTERNAL_SERVER_ERROR, mimetype="application/json"
        )


@app.route("/run", methods=["POST"])
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
        return {
            "result": "Whoops!  Running failed.  Please report this bug."
        }, HTTPStatus.INTERNAL_SERVER_ERROR
    return result, HTTPStatus.OK


if __name__ == "__main__":
    app.run(debug=True)
