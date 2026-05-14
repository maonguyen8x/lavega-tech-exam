/**
 * OAuth 2.0 PKCE flow types and interfaces
 * Defines the structure for OAuth tokens, user info, and session state
 */

/**
 * OAuth Authorization Request parameters
 */
export interface OAuthAuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

/**
 * OAuth Token Response from Google token endpoint
 */
export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

/**
 * User information retrieved from Google
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

/**
 * OAuth Session stored in the application
 * Contains tokens and user information
 */
export interface OAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Timestamp when token expires
  user: UserInfo;
  state: string; // OAuth state for validation
}

/**
 * PKCE parameters (Proof Key for Public Clients Exchange)
 */
export interface PKCEParameters {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * OAuth error response
 */
export interface OAuthError {
  error: string;
  error_description?: string;
  state?: string;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Locally-editable profile overrides stored in sessionStorage.
 * Merged on top of the Google-provided UserInfo at display time.
 */
export interface ProfileOverrides {
  displayName?: string;
  avatar?: string;
  password?: string;
}
