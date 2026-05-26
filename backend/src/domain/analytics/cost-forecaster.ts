import type { DailyAggregate, CostForecast } from '../contracts';

export class CostForecaster {
  /**
   * Projects monthly cost using linear regression over daily aggregates.
   * Requires at least 3 days of data for a meaningful projection.
   */
  forecast(aggregates: DailyAggregate[]): CostForecast | null {
    if (aggregates.length < 3) return null;

    const sorted = [...aggregates].sort((a, b) => a.date.localeCompare(b.date));
    const n = sorted.length;
    const deviceId = sorted[0]!.deviceId;

    // x = day index (0, 1, 2, ...), y = totalCost
    const xs = sorted.map((_, i) => i);
    const ys = sorted.map((d) => d.totalCost);

    const { slope, intercept } = this.linearRegression(xs, ys);

    // Project 30 days from the last data point
    const projectedDailyCost = slope * n + intercept;
    const forecastedMonthlyCost = Math.max(0, projectedDailyCost * 30);

    const avgKwh = sorted.reduce((s, d) => s + d.totalKwh, 0) / n;
    const forecastedMonthlyKwh = avgKwh * 30;

    return {
      deviceId,
      forecastedMonthlyKwh: Math.round(forecastedMonthlyKwh * 100) / 100,
      forecastedMonthlyCost: Math.round(forecastedMonthlyCost * 100) / 100,
      confidenceDays: n,
    };
  }

  private linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i]!, 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }
}
