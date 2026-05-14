/**
 * Auth Guard
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ROUTES } from '../core/constants/app.constants';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate([ROUTES.LOGIN]);
  return false;
};
