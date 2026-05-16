// ── Rate limiting ─────────────────────────────────────────────────────────────
export const RATE_LIMIT = {
  AUTH_WINDOW_MS: 15 * 60 * 1000,   // 15 minutes
  AUTH_MAX:       10,
  SIGNUP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  SIGNUP_MAX:     5,
} as const;

// ── Cookie ────────────────────────────────────────────────────────────────────
export const COOKIE = {
  REFRESH_TOKEN_NAME: 'refreshToken',
  REFRESH_TOKEN_PATH: '/api/auth/refresh',
  MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// ── Profile update — fields the user is allowed to change ────────────────────
export const PROFILE_UPDATABLE_FIELDS = [
  'fullName',
  'phone',
  'location',
  'organization',
  'nationalId',
] as const;
