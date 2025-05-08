import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import eslintComments from 'eslint-plugin-eslint-comments';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      prettier,
      sonarjs,
      unicorn,
      'eslint-comments': eslintComments
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly'
      },
      sourceType: 'module' // ES module
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'sonarjs/no-duplicate-string': 'warn',
      'eslint-comments/no-unused-disable': 'error',

      // General rules
      semi: ['error', 'always'],
      quotes: ['error', 'single']
    }
  }
]);