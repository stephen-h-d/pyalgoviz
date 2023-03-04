### Development

To run locally:

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
