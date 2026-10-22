import { auth } from '@/lib/firebase/app'

/**
 * Current user's ID token. Waits for Firebase Auth to finish restoring the persisted user, so
 * callers can start fetching data before the (slower) session verification has completed.
 */
export async function getFirebaseIdToken(): Promise<string> {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}
