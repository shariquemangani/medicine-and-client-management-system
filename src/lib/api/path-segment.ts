import { DomainError } from '@/lib/api/api-error'

/**
 * Route params end up inside Firestore REST paths. Only plain ids (letters, digits, `_`, `-`) are
 * accepted so a crafted value can never add path segments or query parameters.
 */
export function safeSegment(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new DomainError('Not found', 404)
  return value
}
