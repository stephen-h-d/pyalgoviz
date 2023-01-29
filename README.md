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
ls src/edit_page.ts generator/gen_code.ts | entr ./generate_code.sh 
```
