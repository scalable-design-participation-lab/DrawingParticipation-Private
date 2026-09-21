/**
 * Stand-ins for the Nuxt runtime imports (`#app` / `#imports`) that a couple of
 * components pull in, so any component can be mounted under vitest without a
 * Nuxt app around it. Aliased in `base/vitest.config.mjs`.
 */
export const useRuntimeConfig = () => ({ public: {} as Record<string, unknown> })
export function defineNuxtPlugin<T>(plugin: T) {
  return plugin
}
export function updateAppConfig() {}
export const useColorMode = () => ({ preference: 'light', value: 'light' })
export const useRoute = () => ({ path: '/', params: {}, query: {} })
export const navigateTo = () => Promise.resolve()
