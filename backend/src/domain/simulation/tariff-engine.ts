export interface TariffRate {
  rateILS: number;
  period: 'peak' | 'off-peak';
}

/**
 * Israeli IEC residential Time-of-Use tariff.
 * Peak: Sunday–Thursday 17:00–22:00.
 * Weekend in Israel: Friday (5) + Saturday (6).
 */
export class TariffEngine {
  static readonly PEAK_RATE_ILS = 0.65;
  static readonly OFF_PEAK_RATE_ILS = 0.48;
  private static readonly PEAK_START = 17;
  private static readonly PEAK_END = 22;

  getRateAt(timestamp: number): TariffRate {
    const { hour, day } = TariffEngine.getJerusalemHourAndDay(timestamp);
    const isWeekend = day === 5 || day === 6; // Fri=5, Sat=6
    const isPeak =
      !isWeekend &&
      hour >= TariffEngine.PEAK_START &&
      hour < TariffEngine.PEAK_END;

    return isPeak
      ? { rateILS: TariffEngine.PEAK_RATE_ILS, period: 'peak' }
      : { rateILS: TariffEngine.OFF_PEAK_RATE_ILS, period: 'off-peak' };
  }

  private static getJerusalemHourAndDay(timestamp: number): { hour: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jerusalem',
      hour: 'numeric',
      weekday: 'short',
      hour12: false,
    }).formatToParts(new Date(timestamp));

    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour, day: dayMap[weekday] ?? 0 };
  }

  /** Returns cost in ILS for watts consumed over intervalMs milliseconds. */
  calculateCostILS(watts: number, intervalMs: number, timestamp: number): number {
    const kWh = (watts * intervalMs) / 3_600_000_000;
    return kWh * this.getRateAt(timestamp).rateILS;
  }
}
