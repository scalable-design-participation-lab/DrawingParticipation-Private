import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userData = ref(null)
  const currentUser = ref(null)
  const showRegistration = ref(true)

  function setUserData(data: any) {
    userData.value = data
    currentUser.value = data?.userId || null
    showRegistration.value = false
  }

  function logoutUser() {
    currentUser.value = null
    userData.value = null
    showRegistration.value = true
  }

  return {
    userData,
    currentUser,
    showRegistration,
    setUserData,
    logoutUser,
  }
})
