import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '#ui': path.resolve(
        __dirname,
        './node_modules/@nuxt/ui/dist/runtime/ui.mjs'
      ),
    },
  },
})
