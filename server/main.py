import os

from flask import Flask
from middleware import jwt_authenticated, jwt_authenticated_optional

from google.cloud import ndb
from models import Log
from models import Algorithm
from models import User
from flask_login import LoginManager, current_user, login_url
from flask import Flask, request, Response, redirect, url_for, jsonify

import logging
logger = logging.getLogger(__name__)

login_manager = LoginManager()


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")


class NDBMiddleware:
    def __init__(self, app):
        self.app = app
        self.client = ndb.Client(project=PROJECT)

    def __call__(self, environ, start_response):
        with self.client.context():
            return self.app(environ, start_response)


app = Flask(__name__)
app.secret_key = SECRET_KEY
app.wsgi_app = NDBMiddleware(app.wsgi_app)
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query().filter(User.firebase_user_id == user_id).get()


@app.route('/source')
def source():
    return "well, that is something..."


@app.route("/save", methods=["POST"])
@jwt_authenticated
def save():
    author: User = current_user
    try:
        algo = Algorithm()
        algo.author = author.key
        algo.script = request.args.get('script')
        algo.viz = "test viz" # request.args.get('viz')
        algo.name = "test name" # request.args.get('name')
        algo.public = False
        algo.put()
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
