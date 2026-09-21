import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      exclude: ['**/config/*.ts', '**/.env'],
    },
  },
  resolve: {
    alias: {
      '@': '/',
      '@base': path.resolve(__dirname, '../../base/app'),
      '@components': '/app/components',
      // Base's components read the manifest through '~' and Nuxt's runtime
      // through '#app'; under vitest there is no Nuxt, so point them at the
      // app and at base's stubs.
      '~': path.resolve(__dirname, './app'),
      '#app': path.resolve(__dirname, '../../base/app/__test__/nuxt-stubs.ts'),
      '#imports': path.resolve(__dirname, '../../base/app/__test__/nuxt-stubs.ts'),
      '#ui': path.resolve(
        __dirname,
        './node_modules/@nuxt/ui/dist/runtime/ui.mjs',
      ),
    },
  },
})
