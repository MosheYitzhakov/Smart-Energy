import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/services/theme.service';
import type { Device } from '../../shared/models/contracts';

@Component({
  selector: 'app-devices',
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss',
})
export class DevicesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly i18n  = inject(I18nService);
  readonly theme = inject(ThemeService);

  readonly devices = signal<Device[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showAddForm = signal(false);

  readonly addForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['other', Validators.required],
    powerWatts: [100, [Validators.required, Validators.min(1)]],
  });

  readonly deviceTypes = ['ac', 'boiler', 'solar', 'other'] as const;

  async ngOnInit(): Promise<void> {
    await this.loadDevices();
  }

  async loadDevices(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Device[]>(`${environment.apiUrl}/devices`),
      );
      this.devices.set(data);
    } catch {
      this.error.set(this.i18n.t().devices.loadError);
    } finally {
      this.loading.set(false);
    }
  }

  openAddForm(): void {
    this.addForm.reset({ name: '', type: 'other', powerWatts: 100 });
    this.showAddForm.set(true);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  async createDevice(): Promise<void> {
    if (this.addForm.invalid) return;
    try {
      const device = await firstValueFrom(
        this.http.post<Device>(`${environment.apiUrl}/devices`, this.addForm.getRawValue()),
      );
      this.devices.update((prev) => [...prev, device]);
      this.showAddForm.set(false);
    } catch {
      this.error.set(this.i18n.t().devices.createError);
    }
  }

  async deleteDevice(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/devices/${id}`));
      this.devices.update((prev) => prev.filter((d) => d.id !== id));
    } catch {
      this.error.set(this.i18n.t().devices.deleteError);
    }
  }
}
