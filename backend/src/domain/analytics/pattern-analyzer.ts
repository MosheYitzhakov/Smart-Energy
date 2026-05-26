import type { EnergyReading, PatternSummary } from '../contracts';

export class PatternAnalyzer {
  /**
   * Computes hour-of-day and day-of-week patterns from raw readings.
   * Readings must include at least 24 hours of data.
   */
  analyze(deviceId: string, readings: EnergyReading[]): PatternSummary {
    if (readings.length === 0) {
      return { deviceId, peakHour: 0, peakDayOfWeek: 0, averageWatts: 0, baselineWatts: 0 };
    }

    const byHour = new Array<number[]>(24).fill(null as unknown as number[]).map(() => [] as number[]);
    const byDay = new Array<number[]>(7).fill(null as unknown as number[]).map(() => [] as number[]);

    for (const r of readings) {
      const d = new Date(r.timestamp);
      byHour[d.getHours()]!.push(r.watts);
      byDay[d.getDay()]!.push(r.watts);
    }

    const hourAvg = byHour.map((h) => (h.length ? this.mean(h) : 0));
    const dayAvg = byDay.map((d) => (d.length ? this.mean(d) : 0));

    const peakHour = hourAvg.indexOf(Math.max(...hourAvg));
    const peakDayOfWeek = dayAvg.indexOf(Math.max(...dayAvg));

    const allWatts = readings.map((r) => r.watts).sort((a, b) => a - b);
    const baselineIdx = Math.floor(allWatts.length * 0.1);
    const baselineWatts = allWatts[baselineIdx] ?? 0;

    return {
      deviceId,
      peakHour,
      peakDayOfWeek,
      averageWatts: Math.round(this.mean(allWatts) * 100) / 100,
      baselineWatts: Math.round(baselineWatts * 100) / 100,
    };
  }

  private mean(values: number[]): number {
    return values.reduce((s, v) => s + v, 0) / values.length;
  }
}
