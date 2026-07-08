const TOKEN_PREFIX = 'mock_token_'

export function createAuthToken(userId: string): string {
  return `${TOKEN_PREFIX}${userId}_${Date.now()}`
}

export function parseUserIdFromToken(token: string): string | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null

  const rest = token.slice(TOKEN_PREFIX.length)
  const separator = rest.lastIndexOf('_')
  if (separator <= 0) return null

  const timestamp = rest.slice(separator + 1)
  if (!/^\d+$/.test(timestamp)) return null

  return rest.slice(0, separator)
}
