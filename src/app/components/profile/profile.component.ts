/**
 * Profile Component
 * Displays user info with header (logo, theme toggle, user dropdown).
 * Dropdown menu: "View Profile" opens edit modal, "Sign Out" logs out.
 * Edit modal: editable display name, password, avatar; read-only email & username.
 * Overrides are persisted in sessionStorage for the current browser session.
 */

import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROUTES, PROFILE_OVERRIDES_KEY } from '../../core/constants/app.constants';
import { ProfileOverrides } from '../../core/types/oauth.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shell">
      <!-- ═══════ HEADER ═══════ -->
      <header class="header">
        <div class="header-inner">
          <a class="brand" href="/">
            <svg viewBox="0 0 32 32" fill="none" class="brand-icon">
              <rect width="32" height="32" rx="8" fill="url(#hg)"/>
              <path d="M10 16l5 5 7-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <defs><linearGradient id="hg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
            </svg>
            <span class="brand-label">Lavega OAuth</span>
          </a>

          <div class="header-right">
            <!-- Theme toggle (animated pill) -->
            <button class="theme-pill" (click)="toggleTheme()" aria-label="Toggle theme">
              <span class="pill-track">
                <span class="pill-thumb" [class.pill-thumb--light]="!isDark()"></span>
                <svg class="pill-icon pill-icon--moon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.77.77 0 01.08.858 7.2 7.2 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 01.81.316.73.73 0 01-.031.893A8.35 8.35 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 016 .278"/>
                </svg>
                <svg class="pill-icon pill-icon--sun" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 12a4 4 0 100-8 4 4 0 000 8M8 0a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 0m0 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 13m8-5a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5M3 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2A.5.5 0 013 8m10.657-5.657a.5.5 0 010 .707l-1.414 1.415a.5.5 0 11-.707-.708l1.414-1.414a.5.5 0 01.707 0m-9.193 9.193a.5.5 0 010 .707L3.05 13.657a.5.5 0 01-.707-.707l1.414-1.414a.5.5 0 01.707 0m9.193 2.121a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 01.707-.707l1.414 1.414a.5.5 0 010 .707M3.757 4.464a.5.5 0 01-.707 0L1.636 3.05a.5.5 0 01.707-.707l1.414 1.414a.5.5 0 010 .707"/>
                </svg>
              </span>
            </button>

            <!-- User chip + dropdown -->
            <div class="user-menu-wrapper">
              <button class="user-chip" (click)="toggleDropdown($event)">
                <img
                  [src]="displayAvatar()"
                  alt=""
                  class="chip-avatar"
                  referrerpolicy="no-referrer"
                />
                <span class="chip-name">{{ displayName() }}</span>
                <svg viewBox="0 0 16 16" fill="currentColor" class="chip-caret" [class.chip-caret--open]="showDropdown()">
                  <path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clip-rule="evenodd"/>
                </svg>
              </button>

              @if (showDropdown()) {
                <div class="dropdown" role="menu">
                  <button class="dropdown-item" (click)="openEditModal()" role="menuitem">
                    <svg viewBox="0 0 16 16" fill="currentColor" class="dropdown-icon">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6m2-3a2 2 0 11-4 0 2 2 0 014 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                    </svg>
                    Profile
                  </button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item dropdown-item--danger" (click)="handleLogout()" role="menuitem">
                    <svg viewBox="0 0 16 16" fill="currentColor" class="dropdown-icon">
                      <path fill-rule="evenodd" d="M6 12.5a.5.5 0 00.5.5h8a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5h-8a.5.5 0 00-.5.5v2a.5.5 0 01-1 0v-2A1.5 1.5 0 016.5 2h8A1.5 1.5 0 0116 3.5v9a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 015 12.5v-2a.5.5 0 011 0z"/>
                      <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 010-.708l3-3a.5.5 0 11.708.708L1.707 7.5H10.5a.5.5 0 010 1H1.707l2.147 2.146a.5.5 0 01-.708.708z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- ═══════ MAIN CONTENT ═══════ -->
      <main class="content">
        @if (user(); as u) {
          <section class="profile-card">
            <div class="avatar-row">
              <img [src]="displayAvatar()" alt="Profile picture" class="avatar-lg" referrerpolicy="no-referrer" />
              <div class="user-meta">
                <h1 class="user-name">{{ displayName() }}</h1>
                <p class="user-email">{{ u.email }}</p>
                @if (u.verified_email) {
                  <span class="badge-verified">Verified</span>
                }
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ u.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Username</span>
                <span class="info-value">{{ getUsername(u.email) }}</span>
              </div>
            </div>
          </section>

          <!-- Feature cards -->
          <section class="features-grid">
            <div class="feat-card">
              <div class="feat-icon feat-icon--indigo">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
              </div>
              <h3>Secure Auth</h3>
              <p>OAuth 2.0 with PKCE protects against code interception</p>
            </div>
            <div class="feat-card">
              <div class="feat-icon feat-icon--violet">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.28a.75.75 0 00-.75.75v3.955a.75.75 0 001.5 0v-2.134l.208.21a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z" clip-rule="evenodd"/></svg>
              </div>
              <h3>Auto Refresh</h3>
              <p>Tokens refresh automatically before expiry</p>
            </div>
            <div class="feat-card">
              <div class="feat-icon feat-icon--blue">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>
              </div>
              <h3>CSRF Protection</h3>
              <p>State parameter validation prevents cross-site attacks</p>
            </div>
            <div class="feat-card">
              <div class="feat-icon feat-icon--emerald">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684z"/></svg>
              </div>
              <h3>Modern Stack</h3>
              <p>Angular 21+ with standalone components and signals</p>
            </div>
          </section>
        } @else {
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Loading profile...</p>
          </div>
        }
      </main>

      <footer class="footer">
        <p>Lavega Angular Entrance Evaluation &middot; OAuth 2.0 with PKCE</p>
      </footer>

      <!-- ═══════ EDIT PROFILE MODAL ═══════ -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Edit Profile</h2>
              <button class="modal-close" (click)="closeModal()" aria-label="Close">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Avatar -->
              <div class="modal-avatar-section">
                <div class="modal-avatar-wrap" (click)="modalFileInput.click()">
                  <img [src]="editAvatar || displayAvatar()" alt="" class="modal-avatar-img" referrerpolicy="no-referrer" />
                  <div class="modal-avatar-overlay">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                  </div>
                </div>
                <input #modalFileInput type="file" accept="image/*" class="sr-only" (change)="onModalAvatarChange($event)" />
                <span class="modal-avatar-hint">Click to change photo</span>
              </div>

              <!-- Editable: Display Name -->
              <div class="field">
                <label class="field-label">Display Name</label>
                <input type="text" class="field-input" [(ngModel)]="editDisplayName" placeholder="Enter display name" />
              </div>

              <!-- Editable: Password -->
              <div class="field">
                <label class="field-label">Password</label>
                <div class="field-password">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    class="field-input"
                    [(ngModel)]="editPassword"
                    placeholder="Enter new password"
                  />
                  <button class="pwd-toggle" (click)="showPassword.set(!showPassword())" type="button" aria-label="Toggle password visibility">
                    @if (showPassword()) {
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 00-2.79.588l.77.771A6 6 0 018 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0114.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/><path d="M11.297 9.176a3.5 3.5 0 00-4.474-4.474l.823.823a2.5 2.5 0 012.829 2.829zm-2.943 1.299l.822.822a3.5 3.5 0 01-4.474-4.474l.823.823a2.5 2.5 0 002.829 2.829"/><path d="M3.35 5.47q-.27.24-.518.487A13 13 0 001.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 018 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884l-12-12 .708-.708 12 12z"/></svg>
                    } @else {
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 011.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0114.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 011.172 8z"/><path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5M4.5 8a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0"/></svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Read-only: Username -->
              <div class="field">
                <label class="field-label">Username</label>
                <div class="field-row-locked">
                  <input type="text" class="field-input field-input--locked" [value]="getUsername(user()!.email)" disabled />
                  <svg viewBox="0 0 16 16" fill="currentColor" class="lock"><path fill-rule="evenodd" d="M8 1a3.5 3.5 0 00-3.5 3.5V7H4a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-.5V4.5A3.5 3.5 0 008 1zm2 6V4.5a2 2 0 10-4 0V7h4z" clip-rule="evenodd"/></svg>
                </div>
              </div>

              <!-- Read-only: Email -->
              <div class="field">
                <label class="field-label">Email Address</label>
                <div class="field-row-locked">
                  <input type="email" class="field-input field-input--locked" [value]="user()!.email" disabled />
                  @if (user()!.verified_email) {
                    <span class="badge-sm">Verified</span>
                  }
                  <svg viewBox="0 0 16 16" fill="currentColor" class="lock"><path fill-rule="evenodd" d="M8 1a3.5 3.5 0 00-3.5 3.5V7H4a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-.5V4.5A3.5 3.5 0 008 1zm2 6V4.5a2 2 0 10-4 0V7h4z" clip-rule="evenodd"/></svg>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
              <button class="btn-save" (click)="saveProfile()">Save Changes</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  user = this.authService.user;
  isDark = this.themeService.isDark;

  showDropdown = signal(false);
  showModal = signal(false);
  showPassword = signal(false);

  private overrides = signal<ProfileOverrides>(this.loadOverrides());

  displayName = computed(() => this.overrides().displayName || this.user()?.name || '');
  displayAvatar = computed(() => this.overrides().avatar || this.user()?.picture || '');

  editDisplayName = '';
  editPassword = '';
  editAvatar: string | null = null;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([ROUTES.LOGIN]);
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showDropdown()) {
      this.showDropdown.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  getUsername(email: string): string {
    return email?.split('@')[0] || '';
  }

  /* ── Dropdown ── */
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown.update((v) => !v);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  /* ── Modal ── */
  openEditModal(): void {
    this.closeDropdown();
    this.editDisplayName = this.displayName();
    this.editPassword = this.overrides().password || '';
    this.editAvatar = null;
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onModalAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.editAvatar = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveProfile(): void {
    const updated: ProfileOverrides = {
      ...this.overrides(),
      displayName: this.editDisplayName.trim() || undefined,
      password: this.editPassword || undefined,
    };

    if (this.editAvatar) {
      updated.avatar = this.editAvatar;
    }

    this.overrides.set(updated);
    this.persistOverrides(updated);
    this.closeModal();
  }

  async handleLogout(): Promise<void> {
    this.closeDropdown();
    sessionStorage.removeItem(PROFILE_OVERRIDES_KEY);
    await this.authService.logout();
  }

  /* ── Persistence ── */
  private loadOverrides(): ProfileOverrides {
    try {
      const raw = sessionStorage.getItem(PROFILE_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistOverrides(data: ProfileOverrides): void {
    try {
      sessionStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(data));
    } catch {
      // Storage may be unavailable
    }
  }
}
