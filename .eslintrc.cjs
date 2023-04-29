module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:prettier/recommended",
        "prettier",
        "plugin:solid/recommended",
      ],
      "plugins": [
        "@typescript-eslint", "solid"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        project: ["./tsconfig.json"],
    },
    "rules": {
    }
}
