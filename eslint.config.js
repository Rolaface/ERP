// eslint.config.js
import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

import tseslint from 'typescript-eslint';

// React plugins (required for JSX rules)
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from "eslint-plugin-unused-imports";


export default tseslint.config(
  //
  // IGNORED FILES
  //
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      'build/**/*',
      '**/*.d.ts',
      '*.config.js',
      '*.config.mjs',
      'test/**/*',
    ],
  },

  //
  // BASE CONFIGS
  //
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  //
  // PRETTIER CONFIG
  //
  prettier,

  //
  // LANGUAGE SETTINGS
  //
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  //
  // MAIN RULESET + PLUGINS
  //
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },

    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],

      'unused-imports/no-unused-imports': 'error',

      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-unused-vars': 'off',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',

      'no-unsafe-finally': 'warn',

      'react/jsx-pascal-case': 'error',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Allow snake_case for API responses from backend
      camelcase: ['warn', { properties: 'never', ignoreDestructuring: true }],

      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        {
          selector: ['variable', 'function'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
        },
      ],

      'react/jsx-handler-names': ['error', { eventHandlerPrefix: 'on', handlerPrefix: 'handle' }],

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  }
);
