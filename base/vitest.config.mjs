import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@components': '/app/components',
      // In a Nuxt app `~` is the *app's* srcDir, which is how useAppManifest
      // picks up app.json / specs / i18n. Under vitest there is no app, so
      // point it at base/app: the globs find nothing and components fall back
      // to their prop defaults.
      '~': path.resolve(__dirname, './app'),
      // Nuxt's own runtime imports, stubbed so a component can mount without a
      // Nuxt app around it.
      '#app': path.resolve(__dirname, './app/__test__/nuxt-stubs.ts'),
      '#imports': path.resolve(__dirname, './app/__test__/nuxt-stubs.ts'),
      '#ui': path.resolve(
        __dirname,
        './node_modules/@nuxt/ui/dist/runtime/ui.mjs',
      ),
    },
  },
})
