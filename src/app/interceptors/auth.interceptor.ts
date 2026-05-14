/**
 * HTTP Interceptor for OAuth Authentication
 * Attaches access token to outgoing requests and handles HTTP errors
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 401:
            console.error('Unauthorized: Token may be invalid or expired');
            break;
          case 403:
            console.error('Forbidden: Access denied');
            break;
          case 500:
            console.error('Internal server error');
            break;
        }
      }
      return throwError(() => error);
    })
  );
};
