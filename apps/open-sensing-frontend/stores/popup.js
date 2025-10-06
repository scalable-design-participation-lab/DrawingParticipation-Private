import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePopupStore = defineStore('popup', () => {
  const popUpVisibility = ref({
    pcoords: false,
    dashboard: false,
    about: false,
  })

  return {
    popUpVisibility,
  }
})
