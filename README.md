# lavega-tech-exam

> Angular 21+ | OAuth 2.0 Authorization Code Flow with PKCE | TypeScript | Standalone Components

A modern Angular application demonstrating **Google Single Sign-On** using the OAuth 2.0 Authorization Code Flow with PKCE. Built with standalone components, Angular Signals for state management, and secure session handling.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing the Login Flow](#testing-the-login-flow)
- [Project Structure](#project-structure)
- [Security](#security)
- [Known Limitations & Production Notes](#known-limitations--production-notes)

---

## Overview

This application implements a complete Google SSO flow:

1. **Login Screen** — "Sign in with Google" button with loading/error states
2. **OAuth Callback** — Exchanges authorization code for tokens via PKCE
3. **User Profile** — Displays name, email, and profile picture; editable display name and avatar
4. **Session Management** — Short-lived sessionStorage; automatic token refresh before expiry
5. **Dark / Light Theme** — User-selectable theme persisted in localStorage

### Highlights

- PKCE (SHA-256 code challenge) for authorization code security
- State parameter validation for CSRF protection
- Automatic sign-in on app launch when a valid session exists
- Functional route guard and HTTP interceptor
- No tokens or secrets are ever logged to the console

---

## Architecture

### OAuth Flow

```
User clicks "Sign in with Google"
  → Generate PKCE code_verifier + code_challenge
  → Generate random state (CSRF token)
  → Redirect to Google Authorization Endpoint

Google authorizes the user
  → Redirects to /callback?code=...&state=...

Callback Component
  → Validate state against sessionStorage
  → POST to Google Token Endpoint (code + code_verifier + client_secret)
  → Receive access_token + refresh_token
  → GET Google UserInfo endpoint
  → Store session in sessionStorage
  → Navigate to /profile

Profile Page (protected by auth guard)
  → Display user info
  → Auto-refresh token 60 seconds before expiry
  → Logout clears all session data
```

### Directory Structure

```
src/
├── app/
│   ├── core/
│   │   ├── constants/app.constants.ts   — Shared constants (routes, storage keys)
│   │   ├── services/
│   │   │   ├── auth.service.ts          — OAuth flow, session, token refresh
│   │   │   ├── pkce.service.ts          — PKCE code verifier/challenge generation
│   │   │   └── theme.service.ts         — Dark/light mode management
│   │   └── types/oauth.types.ts         — TypeScript interfaces
│   ├── components/
│   │   ├── login/login.component.ts     — Login screen
│   │   ├── callback/callback.component.ts — OAuth callback handler
│   │   └── profile/profile.component.ts — User profile + edit modal
│   ├── guards/auth.guard.ts             — Functional route guard
│   ├── interceptors/auth.interceptor.ts — Functional HTTP interceptor
│   ├── app.component.ts                 — Root component
│   └── app.routes.ts                    — Route configuration
├── environments/
│   ├── environment.ts                   — Committed template (empty values, safe for Git)
│   └── environment.local.ts             — Generated from .env (git-ignored, real credentials)
├── main.ts                              — Bootstrap
├── index.html
└── styles.css                           — Global styles + CSS custom properties for theming
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 18.0 |
| npm | >= 9.0 (ships with Node) |
| Angular CLI | >= 21.0 (installed as a dev dependency) |
| Google OAuth Credentials | From [Google Cloud Console](https://console.cloud.google.com/) |

Optionally, you can use **Yarn 4** instead of npm:

```bash
corepack enable       # activates Yarn via Node.js Corepack
yarn --version        # should show 4.x
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd lavega-tech-exam
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Verify Angular is installed

```bash
npx ng version
```

You should see Angular 21.x listed.

---

## Configuration

### Step 1 — Create Google OAuth Credentials

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a project (or select an existing one)
3. Click **Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized JavaScript origins: `http://localhost:4200`
6. Add Authorized redirect URIs: `http://localhost:4200/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4200/callback
```

Running `npm start` (or `npm run build`) automatically generates `src/environments/environment.local.ts` from your `.env` file. Angular's `fileReplacements` in `angular.json` swaps this in place of the committed template at build time.

You can also regenerate manually:

```bash
npm run env:generate
```

> **How it works:**
> - `environment.ts` — committed to Git with **empty values** (safe, no secrets)
> - `environment.local.ts` — generated from `.env` at build time (**git-ignored**, contains real credentials)
> - Angular `fileReplacements` swaps the template → local file during build/serve
> - `.env` is git-ignored and never committed

### Step 3 — Verify the generated file

After running the generate script, check that `environment.local.ts` was created:

```bash
cat src/environments/environment.local.ts
```

---

## Running the Application

### Development server

```bash
npm start
# or
yarn start
```

This automatically regenerates `environment.ts` from `.env`, then starts `ng serve`.

Open **http://localhost:4200** in your browser.

### Using Angular CLI directly

If you prefer to use `ng serve` directly, first generate the environment file:

```bash
npm run env:generate
ng serve
```

### Production build

```bash
npm run build
# output → dist/lavega-angular-oauth/
```

---

## Testing the Login Flow

### Step-by-step

1. **Start the app** — `npm start`, open http://localhost:4200
2. **Click "Sign in with Google"** — Redirects to Google authorization page
3. **Authorize the app** — Sign in with your Google account, grant permissions
4. **Callback processing** — App exchanges the code for tokens, fetches your profile
5. **Profile page** — Your name, email, and picture are displayed
6. **Edit profile** — Click your name in the header → "Hồ sơ" to open the edit modal
7. **Theme toggle** — Use the sun/moon toggle in the header to switch dark/light mode
8. **Logout** — Click your name → "Đăng xuất" or close the browser (session cleared)

### Error scenarios to test

| Scenario | Expected behavior |
|---|---|
| Cancel Google consent | Error message shown, user stays on login |
| Tamper with `state` parameter | "Invalid state" error (CSRF protection) |
| Refresh browser on /profile | Session restored from sessionStorage |
| Close and reopen browser | Session cleared (sessionStorage), redirected to login |
| Network error during token exchange | Error message with retry option |

---

## Project Structure

### Core Services

- **`AuthService`** — Manages the full OAuth lifecycle: login initiation, callback handling, token exchange, session persistence, automatic token refresh, and logout. Uses Angular Signals for reactive state.
- **`PKCEService`** — Generates cryptographically secure code verifier (128 chars) and SHA-256 code challenge per RFC 7636.
- **`ThemeService`** — Manages dark/light mode preference using a signal, persisted in localStorage.

### Components

- **`LoginComponent`** — Centered card with Google sign-in button, loading spinner, error alerts. Redirects to /profile if already authenticated.
- **`CallbackComponent`** — Processes the OAuth redirect, shows a loading animation or error state.
- **`ProfileComponent`** — Displays user info, header with logo/theme toggle/user dropdown, edit profile modal with avatar upload.

### Guards & Interceptors

- **`authGuard`** (functional `CanActivateFn`) — Redirects unauthenticated users to /login.
- **`authInterceptor`** (functional `HttpInterceptorFn`) — Attaches `Authorization: Bearer <token>` to outgoing requests.

---

## Security

### PKCE (RFC 7636)

The app generates a 128-character random `code_verifier` and derives a SHA-256 `code_challenge`. The verifier is stored in sessionStorage during the auth flow and sent to the token endpoint to prove ownership of the authorization request.

### State validation (CSRF protection)

A 32-character random `state` string is generated before each login, stored in sessionStorage, and validated when Google redirects back. Mismatches are rejected immediately.

### Session handling

- Tokens are stored in **sessionStorage** (not localStorage) — cleared when the browser closes.
- Automatic token refresh is scheduled 60 seconds before expiry.
- All session data is cleared on logout: sessionStorage, signals, and refresh timers.
- The app automatically restores a valid session on page refresh.

### Sensitive values

- `.env` contains credentials and is **git-ignored** — never committed.
- `environment.ts` is committed with **empty values** (safe template).
- `environment.local.ts` is generated from `.env` at build time and is **git-ignored** (contains real credentials).
- Angular `fileReplacements` swaps the template with the local file during build/serve.
- No tokens, authorization codes, or secrets are ever logged to the console.

### Google OAuth note

Google's token endpoint for **Web Application** client types requires `client_secret` in the token exchange request. This is a Google-specific requirement. The secret is loaded from `.env` at build time into `environment.local.ts` and is **never committed** to version control. For production, consider proxying the token exchange through a backend server.

---

## Known Limitations & Production Notes

### Limitations

1. **Frontend-only** — No backend server; token exchange happens in the browser.
2. **SessionStorage** — Tokens are not persisted across browser sessions (by design).
3. **Google-specific** — The OAuth implementation targets Google's endpoints specifically.

### Production recommendations

1. **Backend token exchange** — Proxy the code-for-token exchange through a backend to keep client_secret server-side only.
2. **HTTPS only** — Always use HTTPS redirect URIs in production.
3. **HTTP-only cookies** — Store tokens in secure, HTTP-only cookies instead of sessionStorage.
4. **Content Security Policy** — Add CSP headers to prevent XSS and unauthorized redirects.
5. **Rate limiting** — Limit login attempts and token refresh requests.
6. **Token rotation** — Implement refresh token rotation for enhanced security.

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [PKCE — RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Angular Documentation](https://angular.dev)
- [OWASP OAuth Security](https://owasp.org/www-community/OAuth_Security_Cheat_Sheet)

---

## License

Provided as-is for the Lavega Angular Developer Entrance Evaluation — May 2026.
