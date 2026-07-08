#!/usr/bin/env npx tsx
import { createAuthToken, parseUserIdFromToken } from '../src/lib/auth-token'

const token = createAuthToken('user_1')
const parsed = parseUserIdFromToken(token)

if (parsed !== 'user_1') {
  console.error('FAIL: expected user_1, got', parsed)
  process.exit(1)
}

console.log('OK: auth token round-trip', { token, parsed })
