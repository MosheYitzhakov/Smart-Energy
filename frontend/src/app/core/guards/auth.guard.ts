import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Try silent refresh before redirecting
  const refreshed = await auth.refresh();
  if (refreshed) return true;

  return router.createUrlTree(['/login']);
};
