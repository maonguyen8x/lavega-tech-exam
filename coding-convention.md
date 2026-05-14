# Coding Convention & Project Requirements

This document defines the rules, conventions, and requirements that all code in this project must follow. Every component, service, guard, and interceptor should comply with these standards.

---

## Functional Requirements

### Login Screen

- A single **"Sign in with Google"** button initiates the OAuth flow.
- Show a **loading indicator** while the login flow is in progress.
- Display a clear **error message** if the login fails, with an option to retry.

### User Info Screen

After signing in, display:

1. User's name
2. Email address
3. Profile picture

Provide a **"Logout"** button that clears the session and returns to the login screen.

---

## SSO Flow

- Use **OAuth 2.0 Authorization Code Flow with PKCE**.
- Redirect the user to the Google authorization endpoint.
- Exchange the authorization code for access and optional refresh tokens via the token endpoint.
- Handle cancellation and error states gracefully:
  - Network errors
  - Invalid state (CSRF detection)
  - User cancellation
  - Expired authorization code
  - Token exchange failure

---

## Security

- **Do not store client secrets in the frontend.** Sensitive credentials must be loaded from `.env` at build time and never committed to version control.
- **Never log** tokens, authorization codes, refresh tokens, or secrets to the console.
- **Keep sensitive values out of version control.** The `.env` file is git-ignored; only `.env.example` (with placeholder values) is committed.
- Use Angular environment configuration for public client settings such as client ID and redirect URI.
- Use **PKCE** and validate the OAuth **state** parameter to reduce interception and CSRF risks.
- Prefer **secure, short-lived session handling**. Use `sessionStorage` (not `localStorage`) for tokens.
- **Automatically sign the user in** on app launch if a valid session exists.
- **Clear all session information** on logout (sessionStorage, signals, timers).

---

## Technical Constraints

- Use the latest stable Angular version: **Angular 21+**.
- Use **TypeScript** with strict typing.
- Use **standalone components** as the default Angular architecture (no NgModules).
- Use **Angular Router** for routes: `/login`, `/callback`, `/profile`.
- Use **Angular Signals** or RxJS appropriately for state management.
- Use **Angular HttpClient** for all API calls.
- Use Angular forms only if needed; keep the login screen simple and accessible.
- Handle browser refresh, route reload, and application state correctly.
- The implementation must be runnable with:
  ```bash
  npm install
  ng serve
  ```

---

## Coding Standards

### File & Folder Structure

- Group by feature: `core/services/`, `core/types/`, `core/constants/`, `components/`, `guards/`, `interceptors/`.
- One component/service/guard per file.
- Use descriptive file names: `auth.service.ts`, `pkce.service.ts`, `auth.guard.ts`.

### Naming Conventions

- **Files**: kebab-case (`auth.service.ts`, `login.component.ts`)
- **Classes**: PascalCase (`AuthService`, `LoginComponent`)
- **Interfaces/Types**: PascalCase (`OAuthSession`, `GoogleUserInfo`)
- **Constants**: UPPER_SNAKE_CASE for storage keys and route paths (`SESSION_STORAGE_KEY`, `ROUTES`)
- **Functions/methods**: camelCase (`initiateLogin`, `handleCallback`)
- **CSS classes**: kebab-case (`user-chip`, `modal-overlay`)

### Code Quality

- **No hardcoded values.** Use constants for routes, storage keys, magic numbers, and repeated strings.
- **No Vietnamese comments** in source code. All code comments must be in English.
- Keep functions small and focused — each function should do one thing.
- Use TypeScript interfaces for all data structures (`OAuthSession`, `GoogleUserInfo`, `ProfileOverrides`).
- Prefer `const` over `let`; never use `var`.
- Use functional patterns: functional guards (`CanActivateFn`), functional interceptors (`HttpInterceptorFn`).

### Angular-Specific

- Use `inject()` function instead of constructor injection where appropriate.
- Use Angular Signals (`signal`, `computed`, `effect`) for synchronous state.
- Use RxJS (`Observable`, `firstValueFrom`) only for async HTTP operations.
- Use `@if` / `@for` control flow syntax (not `*ngIf` / `*ngFor`).
- Use `styleUrl` for component styles instead of inline `styles` when CSS exceeds ~2 kB.

### Security in Code

- Never call `console.log()` or `console.error()` with token values, authorization codes, or secrets.
- All error handlers must show generic messages — not raw error objects.
- Store tokens in `sessionStorage` only (cleared when browser closes).
- Validate the OAuth `state` parameter on every callback.
- Include `client_secret` only in the token exchange POST body (loaded from `.env`, not hardcoded).

---

## Environment Configuration

- All sensitive and environment-specific values are defined in **`.env`** (git-ignored).
- The file `src/environments/environment.ts` is a **template** with empty values for secrets.
- At build time, `scripts/generate-env.js` reads `.env` and populates `environment.ts`.
- The committed `environment.ts` must **never** contain real credentials.
- `.env.example` provides a template with placeholder values.

```
.env              → real credentials (git-ignored, never committed)
.env.example      → placeholder template (committed)
environment.ts    → populated at build time from .env (committed with empty values)
```

---

## Bonus Features

- Refresh token flow or automatic token refresh before expiry.
- Loading indicators during login, callback handling, and user profile API calls.
- Reusable API/networking layer with robust error handling and retry strategy.
- Route guards for authenticated pages.
- HTTP interceptor for authenticated API requests.

---

## Documentation

The `README.md` must include instructions on:

- How to install dependencies
- How to configure Google OAuth credentials
- How to configure the Angular environment file
- How to run the project locally with `ng serve`
- How to test the login flow in the browser
- Any known limitations or production security notes
