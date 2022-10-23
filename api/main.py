import os

from flask import Flask


SECRET_KEY = os.environ.get("SECRET_KEY")
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")


app = Flask(__name__)
app.secret_key = SECRET_KEY


@app.route('/source')
def source():
    return "well, that is something..."


if __name__ == '__main__':
    app.run(debug=True)
