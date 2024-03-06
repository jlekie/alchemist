module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname
    },
    plugins: [ '@typescript-eslint' ],
    root: true,
    ignorePatterns: [ '.eslintrc.js', './transmutations/*.js' ],
    rules: {
        '@typescript-eslint/no-unused-vars': 1,
        '@typescript-eslint/no-floating-promises': 2,
        '@typescript-eslint/no-misused-promises': 2,
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-empty-function": 1,
        "@typescript-eslint/no-empty-interface": 0,
        "@typescript-eslint/require-await": 1,
        "@typescript-eslint/restrict-template-expressions": 0
    },
}
