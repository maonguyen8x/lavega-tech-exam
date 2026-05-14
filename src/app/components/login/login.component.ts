/**
 * Login Component
 * Displays the sign-in screen with Google OAuth button
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROUTES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="bg-glow bg-glow--1"></div>
      <div class="bg-glow bg-glow--2"></div>

      <!-- Theme toggle -->
      <button
        class="theme-btn"
        (click)="toggleTheme()"
        [title]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        @if (isDark()) {
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clip-rule="evenodd"/></svg>
        } @else {
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-8-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0115 10z"/><path fill-rule="evenodd" d="M10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
        }
      </button>

      <div class="card" role="main">
        <div class="logo">
          <svg viewBox="0 0 48 48" fill="none" class="logo-icon">
            <rect width="48" height="48" rx="12" fill="url(#loginG)"/>
            <path d="M16 24l6 6 10-12" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <defs><linearGradient id="loginG" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
          </svg>
        </div>

        <h1 class="title">Welcome Back</h1>
        <p class="subtitle">Sign in to your Lavega account</p>

        @if (error()) {
          <div class="alert" role="alert">
            <span>{{ error() }}</span>
          </div>
        }

        <button
          class="btn-google"
          (click)="handleLogin()"
          [disabled]="isLoading()"
          [attr.aria-busy]="isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            <span>Connecting...</span>
          } @else {
            <svg class="g-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09a6.97 6.97 0 010-4.18V7.07H2.18A11 11 0 001 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          }
        </button>

        <div class="divider"><span>Secured with OAuth 2.0 + PKCE</span></div>

        <ul class="features">
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
            Authorization Code Flow with PKCE
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
            Secure session management
          </li>
          <li>
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.28a.75.75 0 00-.75.75v3.955a.75.75 0 001.5 0v-2.134l.208.21a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clip-rule="evenodd"/></svg>
            Automatic token refresh
          </li>
        </ul>
      </div>

      <footer class="footer">Lavega Angular Entrance Evaluation</footer>
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-page);
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: background-color 0.3s ease;
    }

    .bg-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }

    .bg-glow--1 {
      width: 400px; height: 400px;
      background: var(--bg-glow-1);
      top: -100px; right: -100px;
      animation: float 8s ease-in-out infinite;
    }

    .bg-glow--2 {
      width: 350px; height: 350px;
      background: var(--bg-glow-2);
      bottom: -80px; left: -80px;
      animation: float 10s ease-in-out infinite reverse;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, -30px); }
    }

    /* Theme button (top-right) */
    .theme-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px; height: 38px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      backdrop-filter: var(--backdrop-blur);
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .theme-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
    .theme-btn svg { width: 18px; height: 18px; }

    .card {
      position: relative;
      background: var(--bg-card);
      backdrop-filter: var(--backdrop-blur);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .logo { margin-bottom: 28px; }
    .logo-icon { width: 56px; height: 56px; margin: 0 auto; }

    .title {
      font-size: 26px; font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px; letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 32px;
    }

    .alert {
      background: var(--danger-bg);
      border: 1px solid var(--danger-border);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 24px;
      color: var(--danger);
      font-size: 14px;
      text-align: left;
    }

    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px 24px;
      background: #f8fafc;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .btn-google:hover:not(:disabled) {
      background: #fff;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
      transform: translateY(-1px);
    }

    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

    .g-icon { width: 20px; height: 20px; }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid #cbd5e1;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 28px 0;
      color: var(--text-dimmed);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .features {
      list-style: none;
      text-align: left;
    }

    .features li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .features li svg {
      width: 16px; height: 16px;
      color: var(--accent);
      flex-shrink: 0;
    }

    .footer {
      position: relative;
      margin-top: 32px;
      font-size: 12px;
      color: var(--text-dimmed);
    }

    @media (max-width: 480px) {
      .card { padding: 36px 24px; }
      .title { font-size: 22px; }
    }
  `],
})
export class LoginComponent implements OnInit {
  isLoading = this.authService.isLoading;
  error = this.authService.error;
  isDark = this.themeService.isDark;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([ROUTES.PROFILE]);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  async handleLogin(): Promise<void> {
    try {
      await this.authService.initiateLogin();
    } catch {
      // Error is handled by AuthService
    }
  }
}
