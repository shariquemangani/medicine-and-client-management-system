import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore/lite'

const firebaseConfig = {
  // A placeholder keeps `next build` working when the variables are not set (e.g. CI, first deploy);
  // sign-in then fails with a Firebase error instead of the build failing.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'missing-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function createFirebaseApp() {
  if (getApps().length > 0) {
    return getApp()
  }
  return initializeApp(firebaseConfig)
}

export const firebaseApp = createFirebaseApp()
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
