/**
 * Authentication Service
 * Manages OAuth 2.0 Authorization Code Flow with PKCE
 * Handles login, token exchange, session management, and logout
 */

import { Injectable, computed, effect, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PKCEService } from './pkce.service';
import {
  OAUTH_STATE_KEY,
  OAUTH_CODE_VERIFIER_KEY,
  AUTH_PARAMS,
  ROUTES,
  TOKEN,
} from '../constants/app.constants';
import {
  OAuthAuthorizationRequest,
  OAuthSession,
  OAuthTokenResponse,
  UserInfo,
} from '../types/oauth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sessionSignal = signal<OAuthSession | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly user = computed(() => this.sessionSignal()?.user || null);
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  private readonly STORAGE_KEY = environment.session.storageKey;
  private readonly storage = environment.session.useSessionStorage
    ? sessionStorage
    : localStorage;

  private tokenRefreshTimeout: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private pkceService: PKCEService
  ) {
    this.loadSessionFromStorage();

    effect(() => {
      const session = this.sessionSignal();
      if (session) {
        this.scheduleTokenRefresh(session);
      }
    });
  }

  /**
   * Initiates OAuth 2.0 Authorization Code Flow with PKCE.
   * Generates PKCE parameters, state for CSRF protection,
   * and redirects the user to Google's authorization endpoint.
   */
  async initiateLogin(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const { codeChallenge, codeVerifier } =
        await this.pkceService.generatePKCEParameters();

      const state = this.generateRandomState();

      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      sessionStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);

      const authorizationUrl = this.buildAuthorizationUrl({
        clientId: environment.google.clientId,
        redirectUri: environment.google.redirectUri,
        responseType: 'code',
        scope: environment.google.scope,
        state,
        codeChallenge,
        codeChallengeMethod: 'S256',
      });

      window.location.href = authorizationUrl;
    } catch {
      this.handleError('Failed to initiate login');
      this.loadingSignal.set(false);
    }
  }

  /**
   * Handles the OAuth callback after the user authorizes the app.
   * Validates the state parameter (CSRF), exchanges the authorization code
   * for tokens via PKCE, then fetches user info.
   */
  async handleCallback(code: string, state: string, error?: string): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      if (error) {
        throw new Error(`Authorization failed: ${error}`);
      }

      const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      const codeVerifier = sessionStorage.getItem(OAUTH_CODE_VERIFIER_KEY);

      if (!storedState || !codeVerifier) {
        throw new Error('OAuth session expired');
      }

      if (state !== storedState) {
        throw new Error('Invalid state parameter — possible CSRF attack');
      }

      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
      const userInfo = await this.fetchUserInfo(tokens.access_token);

      const session: OAuthSession = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        user: userInfo,
        state,
      };

      this.sessionSignal.set(session);
      this.saveSessionToStorage(session);
      this.clearOAuthTempData();

      this.router.navigate([ROUTES.PROFILE]);
    } catch (err) {
      this.handleError('OAuth callback failed', err);
      this.clearOAuthTempData();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Exchanges the authorization code for tokens at Google's token endpoint.
   * Uses PKCE code_verifier plus client_secret (required by Google for web apps).
   * No retry: authorization codes are single-use.
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: environment.google.clientId,
      client_secret: environment.google.clientSecret,
      redirect_uri: environment.google.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await firstValueFrom(
      this.http
        .post<OAuthTokenResponse>(environment.google.tokenEndpoint, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .pipe(
          catchError((error: HttpErrorResponse) => {
            return throwError(() =>
              new Error(error.error?.error_description || 'Failed to exchange authorization code')
            );
          })
        )
    );

    if (!response) {
      throw new Error('Empty token response');
    }

    return response;
  }

  /**
   * Fetches user profile information from Google's userinfo endpoint.
   * Includes retry logic for transient network errors.
   */
  private async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await firstValueFrom(
      this.http
        .get<UserInfo>(environment.google.userInfoEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .pipe(
          retry({ count: environment.api.retryAttempts, delay: environment.api.retryDelay }),
          catchError(() => {
            return throwError(() => new Error('Failed to fetch user profile'));
          })
        )
    );

    if (!response) {
      throw new Error('Empty user info response');
    }

    return response;
  }

  /**
   * Refreshes the access token using the stored refresh token.
   * Triggered automatically before the current token expires.
   */
  private async refreshAccessToken(): Promise<void> {
    const session = this.sessionSignal();
    if (!session?.refreshToken) {
      return;
    }

    try {
      const tokens = await this.exchangeRefreshToken(session.refreshToken);

      const updatedSession: OAuthSession = {
        ...session,
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };

      this.sessionSignal.set(updatedSession);
      this.saveSessionToStorage(updatedSession);
    } catch {
      this.logout();
    }
  }

  /**
   * Exchanges a refresh token for a new access token.
   * Includes client_secret as required by Google for web application clients.
   */
  private async exchangeRefreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: environment.google.clientId,
      client_secret: environment.google.clientSecret,
    });

    const response = await firstValueFrom(
      this.http
        .post<OAuthTokenResponse>(environment.google.tokenEndpoint, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .pipe(
          retry({ count: environment.api.retryAttempts, delay: environment.api.retryDelay }),
          catchError(() => {
            return throwError(() => new Error('Failed to refresh access token'));
          })
        )
    );

    if (!response) {
      throw new Error('Empty token response');
    }

    return response;
  }

  /**
   * Schedules an automatic token refresh shortly before expiry.
   */
  private scheduleTokenRefresh(session: OAuthSession): void {
    if (this.tokenRefreshTimeout !== null) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const refreshTime = Math.max(0, session.expiresAt - Date.now() - TOKEN.REFRESH_BUFFER_MS);

    this.tokenRefreshTimeout = window.setTimeout(() => {
      this.refreshAccessToken();
    }, refreshTime);
  }

  /**
   * Logs out the user: revokes the token, clears all session data,
   * and navigates to the login page.
   */
  async logout(): Promise<void> {
    try {
      const session = this.sessionSignal();
      if (session) {
        try {
          await firstValueFrom(
            this.http.post(
              `${environment.google.revokeEndpoint}?token=${session.accessToken}`,
              null,
              { responseType: 'text' }
            )
          );
        } catch {
          // Token revocation is best-effort; failure is non-critical
        }
      }
    } finally {
      this.sessionSignal.set(null);
      this.errorSignal.set(null);
      this.clearSessionFromStorage();

      if (this.tokenRefreshTimeout !== null) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }

      this.router.navigate([ROUTES.LOGIN]);
    }
  }

  getAccessToken(): string | null {
    return this.sessionSignal()?.accessToken || null;
  }

  private buildAuthorizationUrl(request: OAuthAuthorizationRequest): string {
    const params = new URLSearchParams({
      client_id: request.clientId,
      redirect_uri: request.redirectUri,
      response_type: request.responseType,
      scope: request.scope,
      state: request.state,
      code_challenge: request.codeChallenge,
      code_challenge_method: request.codeChallengeMethod,
      access_type: AUTH_PARAMS.ACCESS_TYPE,
      prompt: AUTH_PARAMS.PROMPT,
    });

    return `${environment.google.authorizationEndpoint}?${params.toString()}`;
  }

  private generateRandomState(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 32;
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    return Array.from(randomValues, (v) => charset[v % charset.length]).join('');
  }

  private saveSessionToStorage(session: OAuthSession): void {
    try {
      this.storage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage may be full or unavailable
    }
  }

  private loadSessionFromStorage(): void {
    try {
      const raw = this.storage.getItem(this.STORAGE_KEY);
      if (!raw) return;

      const session = JSON.parse(raw) as OAuthSession;

      if (session.expiresAt > Date.now()) {
        this.sessionSignal.set(session);
        this.scheduleTokenRefresh(session);
      } else {
        this.clearSessionFromStorage();
      }
    } catch {
      this.clearSessionFromStorage();
    }
  }

  private clearSessionFromStorage(): void {
    try {
      this.storage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore storage errors during cleanup
    }
  }

  private clearOAuthTempData(): void {
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
  }

  private handleError(message: string, error?: unknown): void {
    let errorMessage = message;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error instanceof HttpErrorResponse) {
      errorMessage = error.error?.error_description || message;
    }

    this.errorSignal.set(errorMessage);
  }
}
