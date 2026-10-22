/**
 * Firebase session cookie limits:
 * min = 5 minutes, max = 14 days.
 * Use the max so users are not forced to re-login the next day.
 */
export const SESSION_COOKIE_NAME = '__session'
export const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000 // 14 days (Firebase max)

/** Readable companion of the HttpOnly session cookie: lets the client skip re-creating a live session. */
export const SESSION_FLAG_COOKIE_NAME = 'mf_session'
