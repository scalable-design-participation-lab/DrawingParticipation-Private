import { defineStore } from 'pinia'

export const useAqiStore = defineStore('aqi', {
  state: () => ({
    byModule: {},
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAQI(moduleId: string) {
      this.loading = true
      this.error = null
      try {
        this.byModule[moduleId] = await $fetch('/api/aqi', {
          params: { moduleId },
        })
      } catch (e: any) {
        this.error = e?.message ?? 'Failed to load AQI'
      } finally {
        this.loading = false
      }
    },
  },
})
