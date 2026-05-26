import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { I18nService } from '../../core/i18n/i18n.service';
import type { Device } from '../../shared/models/contracts';
import { environment } from '../../../environments/environment';

interface AutomationRule {
  id: string;
  name: string;
  condition: { type: string; value?: number; operator?: string; deviceId?: string; startHour?: number; endHour?: number };
  action: { type: string; message?: string; level?: string };
  isActive: boolean;
}

@Component({
  selector: 'app-automations',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
  ],
  templateUrl: './automations.component.html',
  styleUrl: './automations.component.scss',
})
export class AutomationsComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly rules = signal<AutomationRule[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name:          ['', Validators.required],
    conditionType: ['watt_threshold', Validators.required],
    deviceId:      [''],   // empty string = all devices
    threshold:     [100, Validators.min(0)],
    operator:      ['gt'],
    startHour:     [8,  [Validators.min(0), Validators.max(23)]],
    endHour:       [22, [Validators.min(0), Validators.max(23)]],
    actionType:    ['notify', Validators.required],
    message:       [''],
    logLevel:      ['info'],
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadRules(), this.loadDevices()]);
  }

  async loadRules(): Promise<void> {
    this.loading.set(true);
    try {
      const rules = await firstValueFrom(
        this.http.get<AutomationRule[]>(`${environment.apiUrl}/automations`),
      );
      this.rules.set(rules);
    } finally {
      this.loading.set(false);
    }
  }

  async loadDevices(): Promise<void> {
    try {
      const devices = await firstValueFrom(
        this.http.get<Device[]>(`${environment.apiUrl}/devices`),
      );
      this.devices.set(devices);
    } catch { /* silently keep empty */ }
  }

  deviceName(deviceId: string | undefined): string {
    if (!deviceId) return this.i18n.t().automations.allDevices;
    return this.devices().find((d) => d.id === deviceId)?.name ?? deviceId;
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.value;
    const conditionType = v.conditionType;
    const deviceId = v.deviceId || undefined; // empty string → undefined (all devices)

    const condition = conditionType === 'watt_threshold'
      ? { type: 'watt_threshold', deviceId, value: v.threshold, operator: v.operator }
      : { type: 'time_window', startHour: v.startHour, endHour: v.endHour };

    const action = v.actionType === 'notify'
      ? { type: 'notify', message: v.message || 'Automation triggered' }
      : { type: 'log', level: v.logLevel };

    this.saving.set(true);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/automations`, {
          name: v.name,
          deviceId,
          condition,
          action,
        }),
      );
      this.showForm.set(false);
      this.form.reset({ conditionType: 'watt_threshold', operator: 'gt', threshold: 100, startHour: 8, endHour: 22, actionType: 'notify', logLevel: 'info' });
      await this.loadRules();
    } finally {
      this.saving.set(false);
    }
  }

  async deleteRule(id: string): Promise<void> {
    if (!confirm(this.i18n.t().automations.deleteConfirm)) return;
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/automations/${id}`));
    await this.loadRules();
  }
}
