import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'

/**
 * Signs the visitor in anonymously on app load so that contributions can be
 * attributed to a stable per-device uid instead of the literal "anonymous".
 *
 * Firebase itself is initialized by nuxt-vuefire, so getAuth() resolves the
 * default app here. Requires "Anonymous" sign-in to be enabled in the Firebase
 * console; if it is not, this fails quietly and the contributions store keeps
 * falling back to "anonymous".
 */
export default defineNuxtPlugin(() => {
  // Client-only: anonymous sign-in must run in the browser, and the plugin is
  // already named *.client.ts, but guard defensively in case of SSR contexts.
  if (import.meta.server)
    return

  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user)
      return

    signInAnonymously(auth).catch((error) => {
      console.warn(
        'Anonymous sign-in failed; contributions will use "anonymous" as userId.',
        error,
      )
    })
  })
})
