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

To run tsc as a static analyzer (i.e. it does not compile; it just does
type-checking):

```
pnpm run tsc --noEmit --watch
```

### Backend

#### Prerequisites

1. pyenv
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
pyenv virtualenv 3.10.8 pyalgoviz_api
pip install pip-tools
pip-sync
```

#### Running

To run the backend server locally:

```
cd server
export FLASK_APP=server/app.py
export SECRET_KEY=`openssl rand -base64 32`
export GOOGLE_CLOUD_PROJECT=pyalgoviz-361922
export PYTHONUNBUFFERED=1
flask run
```
