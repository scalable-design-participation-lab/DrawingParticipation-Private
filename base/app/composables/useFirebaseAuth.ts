import { ref } from 'vue'
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, addDoc, query, where, getDocs, type DocumentData } from 'firebase/firestore'

/**
 * Firebase authentication composable.
 *
 * @remarks
 * Provides methods for email/password auth, anonymous auth, and user data management.
 * All methods update the `authError` and `isLoading` refs automatically.
 *
 * @example
 * ```ts
 * const { signInWithEmail, authError, isLoading } = useFirebaseAuth()
 * const user = await signInWithEmail('test@example.com', 'password')
 * ```
 *
 * @category Composables
 */
export const useFirebaseAuth = () => {
  /**
   * Firebase Auth instance used by all authentication methods.
   *
   * @remarks
   * Exposed so advanced consumers can interact with the underlying Firebase Auth API directly if needed.
   */
  const auth = getAuth()
  const db = useFirestore()

  /**
   * Reactive authentication error message.
   *
   * @remarks
   * Cleared automatically before each auth call and by {@link clearError}.
   */
  const authError = ref('')

  /**
   * Loading state for in-flight authentication requests.
   *
   * @remarks
   * Set to `true` while an auth method is running and reset in a `finally` block.
   */
  const isLoading = ref(false)

  // Set persistence to local (survives browser restarts)
  /**
   * Initializes Firebase auth persistence.
   *
   * @remarks
   * Sets browser-local persistence so sessions survive page reloads and browser restarts.
   */
  const initializePersistence = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      console.log('Persistence set to LOCAL')
    } catch (error) {
      console.error('Error setting persistence:', error)
    }
  }

  // Check for persistent authentication
  /**
   * Checks for an already authenticated user using Firebase persistence.
   *
   * @returns Current user and associated user data, or `null` values when not authenticated or on error.
   *
   * @remarks
   * Looks up the user's profile document in the `users` collection by `uid`.
   */
  const checkPersistentAuth = async (): Promise<{ user: User | null, userData: DocumentData | null }> => {
    try {
      const currentUser = auth.currentUser
      
      if (currentUser) {
        console.log('Persistent auth check - user found:', currentUser.uid)
        
        // Look up user data in Firestore
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('uid', '==', currentUser.uid))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          console.log('Found existing user data:', userData)
          return { user: currentUser, userData }
        } else {
          console.log('User authenticated but no profile found in database')
          return { 
            user: currentUser, 
            userData: { uid: currentUser.uid, email: currentUser.email } 
          }
        }
      } else {
        console.log('No persistent authenticated user found')
        return { user: null, userData: null }
      }
    } catch (error) {
      console.error('Error checking persistent auth:', error)
      return { user: null, userData: null }
    }
  }

  // Sign up with email and password
  /**
   * Signs up a user with email and password.
   *
   * @param email - User's email address.
   * @param password - User's chosen password.
   * @returns Authenticated Firebase user or `null` if sign-up fails.
   */
  const signUpWithEmail = async (email: string, password: string): Promise<User | null> => {
    authError.value = ''
    isLoading.value = true
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Error signing up:', error)
      authError.value = error.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Sign in with email and password
  /**
   * Signs in a user with email and password.
   *
   * @param email - User's email address.
   * @param password - User's password.
   * @returns Authenticated Firebase user or `null` if sign-in fails.
   */
  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    authError.value = ''
    isLoading.value = true
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Error signing in:', error)
      authError.value = error.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Send password reset email
  /**
   * Sends a password reset email to the given address.
   *
   * @param email - User's email address.
   * @returns `true` if the reset email was sent successfully, `false` otherwise.
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    authError.value = ''
    isLoading.value = true
    
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      authError.value = error.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Sign in anonymously
  /**
   * Signs in a user anonymously.
   *
   * @returns Authenticated anonymous Firebase user or `null` if sign-in fails.
   * @remarks
   * You can later link this anonymous user to an email/password account using {@link linkAnonymousWithEmail}.
   */
  const signInAnonymously = async (): Promise<User | null> => {
    authError.value = ''
    isLoading.value = true
    
    try {
      const userCredential = await signInAnonymously(auth)
      return userCredential.user
    } catch (error: any) {
      console.error('Error signing in anonymously:', error)
      authError.value = error.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Link anonymous user with email credentials
  /**
   * Links the current anonymous session to an email/password account.
   *
   * @param email - Email address to link to the current anonymous user.
   * @param password - Password to use for the linked account.
   * @returns Linked Firebase user or `null` if linking fails.
   * @remarks
   * If the current user is not anonymous, this returns the existing user without changes.
   */
  const linkAnonymousWithEmail = async (email: string, password: string): Promise<User | null> => {
    authError.value = ''
    isLoading.value = true
    
    try {
      const user = auth.currentUser
      if (user && user.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password)
        const result = await linkWithCredential(user, credential)
        console.log('Anonymous session linked to email account')
        return result.user
      }
      return user
    } catch (error: any) {
      console.error('Error linking anonymous session:', error)
      authError.value = error.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Save user data to Firestore
  /**
   * Persists user profile data to the `users` collection.
   *
   * @param userData - Arbitrary user profile payload, expected to include at least a `uid`.
   * @returns The created document ID, or `null` if saving fails.
   */
  const saveUserData = async (userData: Record<string, any>): Promise<string | null> => {
    try {
      const usersCollection = collection(db, 'users')
      const docRef = await addDoc(usersCollection, {
        ...userData,
        createdAt: new Date(),
      })
      
      console.log('User data saved to Firestore:', {
        docId: docRef.id,
        uid: userData.uid,
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error saving user data:', error)
      authError.value = 'Failed to save user data'
      return null
    }
  }

  // Get user data from Firestore
  /**
   * Loads user profile data by Firebase UID.
   *
   * @param uid - Firebase user ID to query.
   * @returns The first matching document's data, or `null` if not found or on error.
   */
  const getUserData = async (uid: string): Promise<DocumentData | null> => {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data()
      }
      return null
    } catch (error) {
      console.error('Error getting user data:', error)
      return null
    }
  }

  // Clear auth error
  /**
   * Clears the current authentication error message.
   *
   * @remarks
   * Useful when resetting auth forms or navigating between auth views.
   */
  const clearError = () => {
    authError.value = ''
  }

  return {
    auth,
    authError,
    isLoading,
    initializePersistence,
    checkPersistentAuth,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    signInAnonymously,
    linkAnonymousWithEmail,
    saveUserData,
    getUserData,
    clearError,
  }
}