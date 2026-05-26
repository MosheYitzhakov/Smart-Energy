import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'devices',
    loadComponent: () =>
      import('./pages/devices/devices.component').then((m) => m.DevicesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'ai',
    loadComponent: () =>
      import('./pages/ai/ai.component').then((m) => m.AIComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'automations',
    loadComponent: () =>
      import('./pages/automations/automations.component').then((m) => m.AutomationsComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
];
