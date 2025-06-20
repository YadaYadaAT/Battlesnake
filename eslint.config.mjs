import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import jestPlugin from 'eslint-plugin-jest';
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
  },
  {
    files: ['**/*.test.{js,mjs,cjs}', '**/__tests__/**/*.{js,mjs,cjs}'],
    plugins: {
      jest: jestPlugin
    },
    languageOptions: {
      globals: {
        jest: 'readonly',
        ...globals.browser,
        process: 'readonly'
      },
      sourceType: 'module'
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'jest/no-disabled-tests': 'warn',
      'jest/expect-expect': 'warn',
      'jest/valid-title': 'error',
      'jest/no-conditional-expect': 'error',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-be': 'warn',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect-in-promise': 'error',
      'jest/require-top-level-describe': 'error'
    }
  }
]);
