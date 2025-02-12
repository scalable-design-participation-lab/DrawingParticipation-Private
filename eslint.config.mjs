// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    rules: {
      'no-console': 'off',
    },
  },
).renamePlugins({
  // Doc: https://github.com/antfu/eslint-config?tab=readme-ov-file#plugins-renaming
  import: 'import-antfu', // It seems there is a conflict with the config from the nuxt-ui package.
})
