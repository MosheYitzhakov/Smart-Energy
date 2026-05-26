import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginResponse } from '../../shared/models/contracts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessToken = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  getToken(): string | null {
    return this.accessToken();
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }, {
        withCredentials: true,
      }),
    );
    this.accessToken.set(res.accessToken);
    await this.router.navigate(['/dashboard']);
  }

  async refresh(): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, {}, {
          withCredentials: true,
        }),
      );
      this.accessToken.set(res.accessToken);
      return true;
    } catch {
      this.accessToken.set(null);
      return false;
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }),
    ).catch(() => null);
    this.accessToken.set(null);
    await this.router.navigate(['/login']);
  }
}
