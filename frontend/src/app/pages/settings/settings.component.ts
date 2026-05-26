import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import { EnergyStore } from '../../store/energy.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  readonly i18n  = inject(I18nService);
  readonly theme = inject(ThemeService);
  private readonly store = inject(EnergyStore);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    peakRate:    [0.65, [Validators.required, Validators.min(0)]],
    offPeakRate: [0.48, [Validators.required, Validators.min(0)]],
    peakStart:   [17,   [Validators.required, Validators.min(0), Validators.max(23)]],
    peakEnd:     [22,   [Validators.required, Validators.min(0), Validators.max(23)]],
  });

  async ngOnInit(): Promise<void> {
    try {
      const tariff = await firstValueFrom(
        this.http.get<{ peakRate: number; offPeakRate: number; peakStart: number; peakEnd: number }>(
          `${environment.apiUrl}/tariffs`,
        ),
      );
      this.form.patchValue(tariff);
    } catch { /* use defaults */ }
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      const v = this.form.value as { peakRate: number; offPeakRate: number; peakStart: number; peakEnd: number };
      await firstValueFrom(this.http.post(`${environment.apiUrl}/tariffs`, v));
      this.store.setTariff(v);
      this.snack.open(this.i18n.t().settings.saved, '✓', { duration: 2000 });
      setTimeout(() => void this.router.navigate(['/dashboard']), 1500);
    } catch {
      this.snack.open('שגיאה בשמירה', '✕', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }
}
