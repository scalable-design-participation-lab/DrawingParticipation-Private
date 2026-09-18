import type { Config } from 'tailwindcss'

// The whole design is set in a monospace face, so `font-sans` (what Nuxt UI
// puts on <body>) resolves to it instead of base's DM Sans.
export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
}
