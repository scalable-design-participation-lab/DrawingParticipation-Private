import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const showFilter = ref(false)

  const toggleFilter = () => {
    showFilter.value = !showFilter.value
  }

  return {
    showFilter,
    toggleFilter,
  }
})
