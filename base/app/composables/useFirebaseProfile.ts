import { ref } from 'vue'
import { getAuth, deleteUser, onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, type User } from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { useFirebaseAuth } from './useFirebaseAuth'

/**
 * Composable for Firebase profile operations
 * Handles user profile data fetching, updating, and account deletion
 */
export function useFirebaseProfile() {
  const auth = getAuth()
  const db = useFirestore()
  const { getUserData } = useFirebaseAuth()
  
  const isLoading = ref(false)
  const error = ref('')
  const success = ref('')

  /**
   * Load user profile data
   * @param userId - Optional user ID, defaults to current authenticated user
   * @returns User data or null if not found
   */
  async function loadUserProfile(userId?: string): Promise<any | null> {
    isLoading.value = true
    error.value = ''
    
    try {
      const currentUser = userId ? null : auth.currentUser
      const targetUserId = userId || currentUser?.uid
      
      if (!targetUserId) {
        error.value = 'User not authenticated'
        return null
      }

      const userData = await getUserData(targetUserId)
      return userData
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      error.value = 'Failed to load user profile'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Watch for auth state changes and load user profile
   * @param callback - Callback function to handle user data
   * @returns Unsubscribe function
   */
  function watchAuthState(callback: (user: User | null, userData: any) => void) {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        callback(null, null)
        return
      }

      const userData = await loadUserProfile(user.uid)
      callback(user, userData)
    })
  }

  /**
   * Update user profile data
   * @param profileData - Profile data to update
   * @returns Success status
   */
  async function updateUserProfile(profileData: Record<string, any>): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    success.value = ''
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        error.value = 'User not authenticated'
        return false
      }

      // Find the existing user document
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', currentUser.uid))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        error.value = 'User document not found'
        return false
      }

      const userDoc = querySnapshot.docs[0]
      const userData = {
        ...profileData,
        userId: currentUser.uid,
        uid: currentUser.uid,
        updatedAt: new Date()
      }

      // Update the existing document
      await updateDoc(doc(db, 'users', userDoc.id), userData)
      
      success.value = 'Profile updated successfully'
      return true
    } catch (err: any) {
      console.error('Error updating profile:', err)
      error.value = 'Failed to update profile'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete user account
   * @param password - User password for re-authentication
   * @returns Success status
   */
  async function deleteUserAccount(password: string): Promise<boolean> {
    isLoading.value = true
    error.value = ''
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser || !currentUser.email) {
        error.value = 'User not authenticated'
        return false
      }

      // Re-authenticate with password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      )
      await reauthenticateWithCredential(currentUser, credential)

      // Delete user data from Firestore
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', currentUser.uid))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        await deleteDoc(doc(db, 'users', userDoc.id))
      }

      // Delete user from Firebase Auth
      await deleteUser(currentUser)
      
      return true
    } catch (err: any) {
      console.error('Error deleting account:', err)
      if (err.code === 'auth/wrong-password') {
        error.value = 'Incorrect password. Please try again.'
      } else {
        error.value = 'Failed to delete account.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear error and success messages
   */
  function clearMessages() {
    error.value = ''
    success.value = ''
  }

  return {
    isLoading,
    error,
    success,
    loadUserProfile,
    watchAuthState,
    updateUserProfile,
    deleteUserAccount,
    clearMessages,
  }
}

