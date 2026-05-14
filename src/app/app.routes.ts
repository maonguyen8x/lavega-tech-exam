/**
 * Application Routes Configuration
 */

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CallbackComponent } from './components/callback/callback.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthService } from './core/services/auth.service';
import { ROUTES } from './core/constants/app.constants';

/**
 * Functional auth guard — redirects to login if not authenticated
 */
const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate([ROUTES.LOGIN]);
  return false;
};

export const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' },
  },
  {
    path: 'callback',
    component: CallbackComponent,
    data: { title: 'Authorizing...' },
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
    data: { title: 'User Profile' },
  },
  {
    path: '',
    redirectTo: ROUTES.LOGIN,
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: ROUTES.LOGIN,
  },
];
