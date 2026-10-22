/**
 * Extracts a readable message from the many shapes an API/Firebase error can take.
 * @param error - The thrown value or error payload
 * @param fallbackMessage - Message used when nothing readable can be extracted
 */
export const extractErrorMessage = (
  error: unknown,
  fallbackMessage: string = 'An error occurred'
): string => {
  if (!error) return fallbackMessage

  if (typeof error === 'string') return error

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>

    if (typeof record.message === 'string' && record.message) return record.message

    const data = record.data
    if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).message === 'string') {
      return (data as Record<string, string>).message
    }

    if (typeof record.error === 'string' && record.error) return record.error
  }

  return fallbackMessage
}
