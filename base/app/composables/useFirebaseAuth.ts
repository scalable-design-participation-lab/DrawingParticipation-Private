import { ref } from 'vue'
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, linkWithCredential, 
  EmailAuthProvider, browserLocalPersistence,setPersistence, onAuthStateChanged, sendPasswordResetEmail,type User } from 'firebase/auth'
import { useFirestore } from 'vuefire'
import { collection, addDoc, query, where, getDocs, type DocumentData } from 'firebase/firestore'

export const useFirebaseAuth = () => {
  const auth = getAuth()
  const db = useFirestore()
  const authError = ref('')
  const isLoading = ref(false)

  // Set persistence to local (survives browser restarts)
  const initializePersistence = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      console.log('Persistence set to LOCAL')
    } catch (error) {
      console.error('Error setting persistence:', error)
    }
  }

  // Check for persistent authentication
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