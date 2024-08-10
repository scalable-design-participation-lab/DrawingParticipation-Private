// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import root from '../eslint.config.mjs'

export default createConfigForNuxt(
  {},
  root,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
