module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'node', 'prettier'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      files: ['test/**', '**/*.test.ts', '**/*.spec.ts'], // Apply only to test files
      plugins: ['jest'],
      rules: {
        // Disable TypeScript's default rule in test files
        '@typescript-eslint/unbound-method': 'off',
        // Enable Jest-specific handling of unbound methods
        'jest/unbound-method': 'error',
      },
    },
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'warn',
    'node/no-missing-import': 'off',
    'node/no-empty-function': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-require': 'off',
    'node/shebang': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    quotes: ['warn', 'single', { avoidEscape: true }],
    'node/no-unpublished-import': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/unbound-method': 'error', // Keep it on for non-test files
  },
};
