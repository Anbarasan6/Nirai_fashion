import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        },
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'tests/**'],
  },
];
