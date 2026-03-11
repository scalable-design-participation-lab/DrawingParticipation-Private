import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserData } from './types/store'

/**
 * Pinia store for authenticated user state.
 *
 * @remarks
 * Single source of truth for the current authenticated user and their profile data.
 * Typically updated after successful authentication and consumed across the application.
 *
 * @category Stores
 */
export const useUserStore = defineStore('user', () => {
  /**
   * The current user data object.
   *
   * @remarks
   * `null` when no user is authenticated. Usually populated from Firestore.
   */
  const userData = ref<UserData | null>(null)

  /**
   * The ID of the currently logged-in user.
   *
   * @remarks
   * Mirrors the Firebase `uid` of the current user when available.
   */
  const currentUser = ref<string | null>(null)

  /**
   * Whether the registration modal or page is visible.
   *
   * @remarks
   * Can be used by UI components to toggle between registration and authenticated views.
   */
  const showRegistration = ref<boolean>(false)

  /**
   * Sets the user data and updates the state to reflect the logged-in user.
   *
   * @param data - User profile data to store, or `null` to clear the current session.
   *
   * @remarks
   * Also updates {@link currentUser} and hides registration UI when a user is present.
   */
  function setUserData(data: UserData | null): void {
    userData.value = data
    currentUser.value = data?.uid || null
    showRegistration.value = false
  }

  /**
   * Logs out the current user, clears user data, and resets the registration visibility state.
   *
   * @remarks
   * Resets {@link currentUser}, {@link userData}, and shows registration UI again.
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
