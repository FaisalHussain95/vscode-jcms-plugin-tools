export default [
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': '@typescript-eslint/eslint-plugin',
        },
        rules: {
            'semi': 'error',
            'quotes': ['error', 'single'],
        },
    },
    {
        ignores: ['out/**', 'node_modules/**', '.vscode-test/**'],
    },
];