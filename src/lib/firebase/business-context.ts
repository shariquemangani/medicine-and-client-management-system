const SCHOOL_ID_KEY = 'businessId'

export function persistBusinessId(businessId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SCHOOL_ID_KEY, businessId)
}

export function readBusinessId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SCHOOL_ID_KEY)
}

export function clearBusinessId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SCHOOL_ID_KEY)
}

export function requireBusinessId(): string {
  const businessId = readBusinessId()
  if (!businessId) {
    throw new Error('School context is missing. Please sign in again.')
  }
  return businessId
}
