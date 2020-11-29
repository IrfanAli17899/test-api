module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    strict: 'off',
    camelcase: 'off',
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
};
