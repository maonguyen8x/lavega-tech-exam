export const OAUTH_TEMP_KEY = 'oauth_temp';
export const OAUTH_STATE_KEY = 'oauth_state';
export const OAUTH_CODE_VERIFIER_KEY = 'oauth_code_verifier';
export const PROFILE_OVERRIDES_KEY = 'profile_overrides';

export const PKCE = {
  CODE_VERIFIER_LENGTH: 128,
  CODE_CHALLENGE_METHOD: 'S256',
};

export const TOKEN = {
  REFRESH_BUFFER_MS: 60000,
};

export const AUTH_PARAMS = {
  ACCESS_TYPE: 'offline',
  PROMPT: 'consent',
};

export const ROUTES = {
  LOGIN: '/login',
  PROFILE: '/profile',
  CALLBACK: '/callback',
};
