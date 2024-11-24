import { defineStore } from 'pinia'

import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'

import { useAuth } from '@vueuse/firebase/useAuth'

export const useAuthStore = defineStore('auth', () => {
  const auth = getAuth()
  const { isAuthenticated, user } = useAuth(auth)

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider())

  const methods = {
    signIn,
  }

  return {
    isAuthenticated,
    user,

    ...methods,
  }
})
