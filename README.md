## Development

### Frontend

#### Prerequisites

1. A package manager. I prefer `pnpm`.
2. `vite`.

#### Installation

`pnpm i`

#### Running

To run the frontend app locally:

```
pnpm run dev
```

You can then go to localhost:3000 to view the frontend. If the backend server is running, API requests will be routed through the proxy as defined in vite.config.ts.

To run tsc as a static analyzer (i.e. it does not compile; it just does
type-checking):

```
pnpm run tsc --noEmit --watch
```

To run tests:
```
pnpm run test
```

### Backend

#### Prerequisites

1. pyenv

After installing `pyenv`, put this in your .bashrc or similar file:
```
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```

2. Google Cloud CLI

See [here](https://cloud.google.com/sdk/docs/install) for installation options.
I find
[installing it as a snap package](https://cloud.google.com/sdk/docs/downloads-snap)
is easiest.

#### Authentication

See
[here](https://cloud.google.com/docs/authentication/provide-credentials-adc#local-dev)
for how to set this up on your local development environment.

#### Installation

To install the Python backend API environment:

```
cd server/
pyenv virtualenv 3.10.8 pyalgoviz_api
pip install pip-tools
pip-sync
```

In addition, to work with Google Cloud:
```
sudo snap install google-cloud-sdk --classic
gcloud config set project pyalgoviz-test
gcloud auth application-default login
```

#### Testing

To test the database functionality:
```
# tests the in-memory version, which is useful for local development and testing
python -m server.main.db.test_db memory

 # tests the Google Cloud-based version, which tests that the DatabaseProtocol implementation is correct
export GOOGLE_CLOUD_PROJECT=pyalgoviz-test
python -m server.main.db.test_db firestore
```

#### Running

To run the backend server locally:

```
./build.sh # this builds the frontend and puts its contents in the server's public folder.
./run_backend.sh # this runs the backend server
```

To run the backend server in a Docker container:
```
sudo docker build -t pyalgoviz-server .
sudo docker run -p 5000:80 -e PORT=80 pyalgoviz-server
```
