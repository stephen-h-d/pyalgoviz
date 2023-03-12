### Development

To run the frontend app locally:

```
pnpm run dev
```

```
pnpm run tsc --noEmit --watch
```

To run the code generation in watch mode:
```
ls src/containers/*.ts generator/*.ts | entr ./generate_code.sh
```

To run the backend server locally:

```
cd server
export SECRET_KEY=``
export GOOGLE_CLOUD_PROJECT=pyalgoviz-361922
export PYTHONUNBUFFERED=1
```
