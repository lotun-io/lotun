module.exports = {
  root: true,
  extends: ['eslint-config-airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  env: {
    node: true,
  },
  settings: {
    'import/core-modules': ['electron'],
  },
};
