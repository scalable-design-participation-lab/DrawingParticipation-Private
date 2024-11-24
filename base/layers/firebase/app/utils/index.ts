import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function getServices(app) {
  const db = getFirestore(app)
  const auth = getAuth(app)
  return {
    db,
    auth,
  }
}

export function getFirebaseApp() {
  const isAppInitialized = getApps().length > 0

  if (isAppInitialized)
    return getApp() // get existing firebase app

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)

  // Initialize the Firebase services to avoid potential issues with lazy loading.
  // This ensures those services are initialized before they are used to avoid potential issues.
  getServices(app)

  return app
}
