import { Injectable, signal, computed } from '@angular/core';
import type { EnergyReading, AnomalyResult, Device } from '../shared/models/contracts';

const INTERVAL_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class EnergyStore {
  readonly readings = signal<EnergyReading[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly alerts = signal<AnomalyResult[]>([]);
  readonly isStale = signal<boolean>(false);

  // Tariff rates — defaults match IEC residential; updated when settings load
  readonly peakRate = signal(0.65);
  readonly offPeakRate = signal(0.48);
  readonly peakStart = signal(17);
  readonly peakEnd = signal(22);

  readonly currentWatts = computed(() => this.readings().at(-1)?.watts ?? 0);

  readonly dailyCost = computed(() => {
    const peak = this.peakRate();
    const offPeak = this.offPeakRate();
    const start = this.peakStart();
    const end = this.peakEnd();

    return this.readings().reduce((sum, r) => {
      const kWh = (r.watts * INTERVAL_MS) / 3_600_000_000;
      const d = new Date(r.timestamp);
      const hour = d.getHours();
      const day = d.getDay();
      const isWeekend = day === 5 || day === 6;
      const rate = !isWeekend && hour >= start && hour < end ? peak : offPeak;
      return sum + kWh * rate;
    }, 0);
  });

  pushReading(reading: EnergyReading): void {
    this.readings.update((prev) => {
      const next = [...prev, reading];
      return next.length > 720 ? next.slice(-720) : next;
    });
  }

  pushAlert(alert: AnomalyResult): void {
    this.alerts.update((prev) => [alert, ...prev].slice(0, 20));
  }

  setDevices(devices: Device[]): void {
    this.devices.set(devices);
  }

  setTariff(config: { peakRate: number; offPeakRate: number; peakStart: number; peakEnd: number }): void {
    this.peakRate.set(config.peakRate);
    this.offPeakRate.set(config.offPeakRate);
    this.peakStart.set(config.peakStart);
    this.peakEnd.set(config.peakEnd);
  }

  markStale(): void { this.isStale.set(true); }
  markFresh(): void { this.isStale.set(false); }
}
