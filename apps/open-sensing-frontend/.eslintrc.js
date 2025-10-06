module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['prettier', 'plugin:vue/vue3-recommended'],
  plugins: ['prettier'],
  // add your custom rules here
  rules: {
    'no-prototype-builtins': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    'vue/max-attributes-per-line': 'off',

    'prettier/prettier': 'warn',

    'vue/singleline-html-element-content-newline': 'off',

    'vue/html-self-closing': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
}
