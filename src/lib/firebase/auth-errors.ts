import { FirebaseError } from 'firebase/app'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/invalid-email': 'Invalid email address',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled',
  'auth/weak-password': 'Password must be at least 8 characters',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/invalid-credential': 'Invalid email or password',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/missing-password': 'Password is required',
  'auth/missing-email': 'Email is required',
  // The rules refuse every read for a disabled account or one without a profile.
  'permission-denied':
    'This account is disabled or not fully set up. Please contact your administrator.',
}

export function mapFirebaseAuthError(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
