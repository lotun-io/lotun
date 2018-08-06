module.exports = {
  root: true,
  extends: ['eslint-config-airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  env: {
    node: true,
  },
  rules: {
    'no-underscore-dangle': 0,
    'prefer-destructuring': 0,
    'no-console': 0,
    'no-restricted-syntax': 0,
    'no-plusplus': 0,
  },
  settings: {
    'import/core-modules': ['electron'],
  },
};
