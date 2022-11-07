import os
import json

from middleware import JWTAuthenticator

from google.cloud import datastore

from server.db.mdb import MemoryDatabase
from server.db.models import Algorithm
from server.db.models import User
from flask_login import LoginManager, current_user
from flask import Flask, request, Response

import logging
logger = logging.getLogger(__name__)

login_manager = LoginManager()


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")

# client = datastore.Client(project=PROJECT)
db = MemoryDatabase()
jwta = JWTAuthenticator(db)

app = Flask(__name__)
app.secret_key = SECRET_KEY
# app.wsgi_app = NDBMiddleware(app.wsgi_app)
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.get_user(user_id)


@app.route("/save", methods=["POST"])
@jwta.authenticated
def save():
    author: User = current_user
    try:
        data = request.get_data().decode("utf-8")
        submission = json.loads(data)
        algo = Algorithm(author_id=author.get_id(),
                         algo_script = submission.get('script'),
                         viz_script="test viz",
                         name="test name")
        db.save_algo(algo)
        # notify(author, 'save', algo.name, algo.script, algo.viz)
        msg = 'Script was successfully saved by %s as "%s"' % (author.email, algo.name)
        # info(msg)
        # info(algo.script)
    except Exception as e:
        msg = 'Could not save script: %s' % e
        logger.error(msg)
        logger.exception(e)
    return Response({'result': msg}, mimetype='application/json')


if __name__ == '__main__':
    app.run(debug=True)
