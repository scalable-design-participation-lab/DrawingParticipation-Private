import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const root = fileURLToPath(new URL('..', import.meta.url))

export default <Partial<Config>>{
  // Page specs are JSON, not .vue: make sure their (non-strict) classes are generated too.
  // Specs name classes through style presets, and an app declares its own
  // presets in app.json, so both files have to be scanned for class names.
  content: [`${root}apps/*/app/specs/**/*.json`, `${root}apps/*/app/app.json`],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', ...defaultTheme.fontFamily.sans],
      },
    },
  },
}
