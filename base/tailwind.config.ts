import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const root = fileURLToPath(new URL('..', import.meta.url))

export default <Partial<Config>>{
  // Page specs are JSON, not .vue: make sure their (non-strict) classes are generated too.
  content: [`${root}apps/*/app/specs/**/*.json`],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', ...defaultTheme.fontFamily.sans],
      },
    },
  },
}
