// @ts-check
const eslint = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularTemplateParser = require('@angular-eslint/template-parser');
const angularTemplateEslint = require('@angular-eslint/eslint-plugin-template');
const boundariesPlugin = require('eslint-plugin-boundaries');

module.exports = [
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**', 'coverage/**'],
  },

  // TypeScript files
  {
    files: ['projects/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './projects/mati/tsconfig.app.json'],
        createDefaultProgram: true,
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        queueMicrotask: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Node globals (for build scripts)
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@angular-eslint': angularEslint,
      '@typescript-eslint': tsPlugin,
      boundaries: boundariesPlugin,
    },
    rules: {
      // ESLint recommended rules
      ...eslint.configs.recommended.rules,
      // TypeScript ESLint recommended rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off', // Turn off base rule as it conflicts with @typescript-eslint/no-unused-vars
      // Angular ESLint recommended rules
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      // Project-specific rules
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'main',
              allow: [['app', { app: '${from.app}' }]],
            },
            {
              from: 'core',
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
              ],
            },
            {
              from: 'ui',
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['ui', { app: '${from.app}' }],
              ],
            },
            {
              from: 'layout',
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
                ['ui', { app: '${from.app}' }],
                ['pattern', { app: '${from.app}' }],
              ],
            },
            {
              from: 'app',
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['app', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
                ['layout', { app: '${from.app}' }],
                ['feature-routes', { app: '${from.app}' }],
              ],
            },
            {
              from: ['pattern'],
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
                ['ui', { app: '${from.app}' }],
                ['pattern', { app: '${from.app}' }],
              ],
            },
            {
              from: ['feature'],
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
                ['ui', { app: '${from.app}' }],
                ['pattern', { app: '${from.app}' }],
              ],
            },
            {
              from: ['feature-routes'],
              allow: [
                ['lib-api'],
                ['env', { app: '${from.app}' }],
                ['core', { app: '${from.app}' }],
                ['pattern', { app: '${from.app}' }],
                ['feature', { app: '${from.app}', feature: '${from.feature}' }],
                [
                  'feature-routes',
                  { app: '${from.app}', feature: '!${from.feature}' },
                ],
              ],
            },
            {
              from: ['lib-api'],
              allow: [['lib', { app: '${from.lib}' }]],
            },
            {
              from: ['lib'],
              allow: [['lib', { app: '${from.lib}' }]],
            },
          ],
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'mati',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'mati',
          style: 'kebab-case',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      'boundaries/ignore': [],
      'boundaries/dependency-nodes': ['import', 'dynamic-import'],
      'boundaries/elements': [
        {
          type: 'env',
          pattern: 'environments',
          basePattern: 'projects/**/src',
          baseCapture: ['app'],
        },
        {
          type: 'main',
          mode: 'file',
          pattern: 'main.ts',
          basePattern: 'projects/**/src',
          baseCapture: ['app'],
        },
        {
          type: 'app',
          mode: 'file',
          pattern: 'app(-|.)*.ts',
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'core',
          pattern: 'core',
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'ui',
          pattern: 'ui',
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'layout',
          pattern: 'layout',
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'pattern',
          pattern: 'pattern',
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'feature-routes',
          mode: 'file',
          pattern: 'feature/*/*.routes.ts',
          capture: ['feature'],
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'feature',
          pattern: 'feature/*',
          capture: ['feature'],
          basePattern: 'projects/**/src/app',
          baseCapture: ['app'],
        },
        {
          type: 'lib-api',
          mode: 'file',
          pattern: 'projects/**/src/public-api.ts',
          capture: ['lib'],
        },
        {
          type: 'lib',
          pattern: 'projects/**/src/lib',
          capture: ['lib'],
        },
      ],
    },
  },
  {
    files: ['projects/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplateEslint,
    },
    rules: {
      ...angularTemplateEslint.configs.recommended.rules,
      ...angularTemplateEslint.configs.accessibility.rules,
    },
  },
];
