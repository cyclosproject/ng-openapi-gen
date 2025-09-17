import typescriptEslint from '@typescript-eslint/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['node_modules/**', 'dist/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      globals: {
        node: true,
        es6: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      jsdoc: jsdoc,
    },
    rules: {
      // Basic indentation and spacing
      indent: ['error', 2],
      'brace-style': ['error', '1tbs'],
      'eol-last': 'error',
      eqeqeq: ['error', 'smart'],
      'guard-for-in': 'error',
      'no-throw-literal': 'error',
      'no-trailing-spaces': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],

      // TypeScript-specific rules
      '@typescript-eslint/naming-convention': 'error',
      '@typescript-eslint/no-shadow': [
        'error',
        {
          hoist: 'all',
        },
      ],
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for this project
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-shadow': 'off', // Turn off base rule to use TypeScript version

      // JSDoc rules
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',
    },
  },
];
