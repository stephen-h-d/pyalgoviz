import js from "@eslint/js";
import solid from "eslint-plugin-solid/configs/typescript.js";
import * as tsParser from "@typescript-eslint/parser";
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.ts'],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.strict,
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
});
