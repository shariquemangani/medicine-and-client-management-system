import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export { SESSION_COOKIE_NAME, SESSION_EXPIRES_MS } from './session'

function createAdminApp(): App {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured')
  }

  const existing = getApps().find(
    (app) => app.name === projectId || app.options.projectId === projectId
  )
  if (existing) {
    return existing
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
    },
    projectId
  )
}

const adminApp = createAdminApp()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
