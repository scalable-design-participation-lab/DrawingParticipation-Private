import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserData } from './types/store'

/**
 * Pinia store for managing user state, such as the current user, registration visibility, and user data.
 */
export const useUserStore = defineStore('user', () => {
  /**
   * The current user data object.
   */
  const userData = ref<UserData | null>(null)

  /**
   * The ID of the currently logged-in user.
   */
  const currentUser = ref<string | null>(null)

  /**
   * Whether the registration modal or page is visible.
   */
  const showRegistration = ref<boolean>(true)

  /**
   * Sets the user data and updates the state to reflect the logged-in user.
   *
   * @param data - The user data object to set. Must include at least a `userId` property.
   */
  function setUserData(data: UserData | null): void {
    userData.value = data
    currentUser.value = data?.uid || null
    showRegistration.value = false
  }

  /**
   * Logs out the current user, clears user data, and resets the registration visibility state.
   */
  function logoutUser(): void {
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
