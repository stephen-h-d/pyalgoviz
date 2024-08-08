import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import solid from 'eslint-plugin-solid';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'solid': solid,
      'prettier': prettier
    },
    rules: {
      'solid/reactivity': 'error',
      'solid/no-destructure': 'error',
      'solid/jsx-no-undef': 'error'
    }
  }
];
