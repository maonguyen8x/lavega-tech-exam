/**
 * PKCE (Proof Key for Public Clients Exchange) Service
 * Generates cryptographically secure code verifier and challenge for OAuth 2.0
 * This enhances security for public clients (like SPAs) by preventing authorization code interception
 */

import { Injectable } from '@angular/core';
import { PKCEParameters } from '../types/oauth.types';

@Injectable({
  providedIn: 'root',
})
export class PKCEService {
  /**
   * Generates a random PKCE code verifier
   * Code verifier is a cryptographically random string using characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
   * Length between 43 and 128 characters (RFC 7636)
   *
   * @returns Base64URL encoded code verifier string
   */
  private generateCodeVerifier(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const length = 128; // Maximum length for best security

    let verifier = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      verifier += charset[randomValues[i] % charset.length];
    }

    return verifier;
  }

  /**
   * Generates SHA-256 hash of the code verifier
   * and returns it as Base64URL encoded string
   *
   * @param codeVerifier - The code verifier string
   * @returns Promise resolving to Base64URL encoded challenge
   */
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);

    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to Base64URL
    return this.base64UrlEncode(hashBuffer);
  }

  /**
   * Encodes ArrayBuffer to Base64URL string
   * Base64URL is URL-safe variant without padding
   *
   * @param buffer - ArrayBuffer to encode
   * @returns Base64URL encoded string
   */
  private base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    // Convert to base64
    const base64 = btoa(binary);

    // Convert to base64url (replace + with -, / with _, remove padding =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Generates PKCE parameters (code verifier and challenge)
   * These are used in OAuth 2.0 Authorization Code Flow
   *
   * @returns Promise resolving to PKCE parameters
   */
  async generatePKCEParameters(): Promise<PKCEParameters> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
    };
  }
}
