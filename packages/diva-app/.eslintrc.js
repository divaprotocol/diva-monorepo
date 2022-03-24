// eslint-disable-next-line no-undef
module.exports = {
  parser: '@typescript-eslint/parser',
  root: true,
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: [
    'prettier',
    '@typescript-eslint',
    'react-hooks',
    'eslint-plugin-no-floating-promise',
    'eslint-plugin-no-only-tests',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      1,
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-only-tests/no-only-tests': 'error',
    'no-floating-promise/no-floating-promise': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}
