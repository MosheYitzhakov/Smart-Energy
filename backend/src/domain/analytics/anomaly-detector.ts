import type { EnergyReading, AnomalyResult } from '../contracts';

const Z_WARNING = 2.0;
const Z_CRITICAL = 3.0;

export class AnomalyDetector {
  /**
   * Detects anomalies in a stream of readings using z-score.
   * Readings must be sorted by timestamp ASC.
   * Returns only readings that exceed the z-score threshold.
   */
  detect(readings: EnergyReading[]): AnomalyResult[] {
    if (readings.length < 5) return [];

    const watts = readings.map((r) => r.watts);
    const mean = this.mean(watts);
    const std = this.stdDev(watts, mean);

    if (std === 0) return [];

    const results: AnomalyResult[] = [];
    for (const reading of readings) {
      const z = Math.abs((reading.watts - mean) / std);
      if (z >= Z_WARNING) {
        results.push({
          deviceId: reading.deviceId,
          timestamp: reading.timestamp,
          watts: reading.watts,
          zScore: Math.round(z * 100) / 100,
          severity: z >= Z_CRITICAL ? 'critical' : 'warning',
        });
      }
    }
    return results;
  }

  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private stdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
