/** Normalize email for Firebase Auth + Firestore security rules (token email is lowercase). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeAuthFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ')
}
