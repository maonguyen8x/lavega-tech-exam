/**
 * Environment Configuration — TEMPLATE
 *
 * This file is committed to Git with empty values. It serves as the type
 * definition and fallback. At build time, Angular replaces it with
 * environment.local.ts (generated from .env by scripts/generate-env.js).
 *
 * Setup:
 *   1. cp .env.example .env
 *   2. Fill in your Google OAuth credentials in .env
 *   3. Run: npm start  (generates environment.local.ts, then serves)
 */
export const environment = {
  production: false,
  google: {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scope: 'profile email',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
    revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
  },
  session: {
    storageKey: 'oauth_session',
    useSessionStorage: true,
  },
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
};
