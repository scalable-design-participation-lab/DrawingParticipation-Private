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
      '@': '/',
      '@base': path.resolve(__dirname, '../../base/app'),
      '@components': '/app/components',
      '#ui': path.resolve(
        __dirname,
        './node_modules/@nuxt/ui/dist/runtime/ui.mjs',
      ),
    },
  },
})
