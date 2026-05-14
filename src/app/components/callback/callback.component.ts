/**
 * OAuth Callback Component
 * Handles the redirect from Google after authorization.
 * Exchanges the authorization code for tokens.
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ROUTES } from '../../core/constants/app.constants';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="bg-glow bg-glow--1"></div>
      <div class="bg-glow bg-glow--2"></div>

      <div class="card">
        @if (!error()) {
          <div class="loader-ring">
            <svg viewBox="0 0 50 50" class="circular">
              <circle cx="25" cy="25" r="20" fill="none" stroke-width="3" class="path" />
            </svg>
          </div>
          <p class="msg">{{ message }}</p>
          <p class="hint">Please wait while we verify your credentials</p>
        } @else {
          <div class="err-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p class="msg err-title">Authentication Failed</p>
          <p class="err-detail">{{ error() }}</p>
          <button class="btn-retry" (click)="handleRetry()">Try Again</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-page);
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

    .bg-glow--1 { width: 350px; height: 350px; background: var(--bg-glow-1); top: -80px; right: -80px; }
    .bg-glow--2 { width: 300px; height: 300px; background: var(--bg-glow-2); bottom: -60px; left: -60px; }

    .card {
      position: relative;
      background: var(--bg-card);
      backdrop-filter: var(--backdrop-blur);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 56px 48px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: background-color 0.3s ease;
    }

    .loader-ring { width: 56px; height: 56px; margin: 0 auto 28px; }

    .circular {
      width: 100%; height: 100%;
      animation: rotate 1.4s linear infinite;
    }

    .path {
      stroke: var(--accent);
      stroke-dasharray: 80, 200;
      stroke-dashoffset: 0;
      animation: dash 1.4s ease-in-out infinite;
      stroke-linecap: round;
    }

    @keyframes rotate { to { transform: rotate(360deg); } }

    @keyframes dash {
      0%   { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50%  { stroke-dasharray: 89, 200; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124; }
    }

    .msg {
      font-size: 18px; font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .hint { font-size: 14px; color: var(--text-muted); margin: 0; }

    .err-icon { width: 56px; height: 56px; margin: 0 auto 20px; color: var(--danger); }
    .err-icon svg { width: 100%; height: 100%; }
    .err-title { color: var(--danger) !important; }

    .err-detail {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0 0 28px;
      line-height: 1.6;
    }

    .btn-retry {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-retry:hover {
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    @media (max-width: 480px) { .card { padding: 40px 28px; } }
  `],
})
export class CallbackComponent implements OnInit {
  message = 'Completing authentication...';
  error = this.authService.error;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      try {
        if (error) {
          this.message = 'Authentication cancelled or failed';
        } else if (code) {
          await this.authService.handleCallback(code, state, error);
        } else {
          throw new Error('No authorization code received');
        }
      } catch {
        this.message = 'Error processing authentication';
      }
    });
  }

  handleRetry(): void {
    this.router.navigate([ROUTES.LOGIN]);
  }
}
