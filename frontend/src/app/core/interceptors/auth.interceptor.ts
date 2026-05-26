import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
        return from(auth.refresh()).pipe(
          switchMap((refreshed) => {
            if (!refreshed) return throwError(() => err);
            const retryToken = auth.getToken();
            const retryReq = retryToken
              ? req.clone({ setHeaders: { Authorization: `Bearer ${retryToken}` } })
              : req;
            return next(retryReq);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
