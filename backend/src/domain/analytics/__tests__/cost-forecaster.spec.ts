import { CostForecaster } from '../cost-forecaster';
import type { DailyAggregate } from '../../contracts';

const makeDay = (date: string, totalCost: number, totalKwh = 10): DailyAggregate => ({
  deviceId: 'dev-1',
  date,
  totalKwh,
  peakWatts: 2000,
  totalCost,
});

describe('CostForecaster', () => {
  const forecaster = new CostForecaster();

  it('returns null when fewer than 3 days of data', () => {
    expect(forecaster.forecast([makeDay('2026-05-01', 10)])).toBeNull();
    expect(forecaster.forecast([makeDay('2026-05-01', 10), makeDay('2026-05-02', 11)])).toBeNull();
  });

  it('projects monthly cost from flat cost trend', () => {
    const data = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2026-05-${String(i + 1).padStart(2, '0')}`, 12, 10),
    );
    const result = forecaster.forecast(data);
    expect(result).not.toBeNull();
    // flat trend → ~12/day × 30 = ~360
    expect(result!.forecastedMonthlyCost).toBeCloseTo(360, 0);
    expect(result!.forecastedMonthlyKwh).toBeCloseTo(300, 0);
    expect(result!.confidenceDays).toBe(7);
  });

  it('projects increasing trend correctly', () => {
    // cost increases by 1 per day: 10, 11, 12, ..., 16
    const data = Array.from({ length: 7 }, (_, i) =>
      makeDay(`2026-05-${String(i + 1).padStart(2, '0')}`, 10 + i),
    );
    const result = forecaster.forecast(data);
    expect(result).not.toBeNull();
    // day 7 cost ≈ 16, projected monthly = 16 × 30 ≈ 480
    expect(result!.forecastedMonthlyCost).toBeGreaterThan(400);
  });

  it('result deviceId matches input', () => {
    const data = Array.from({ length: 5 }, (_, i) =>
      makeDay(`2026-05-${String(i + 1).padStart(2, '0')}`, 10),
    );
    expect(forecaster.forecast(data)!.deviceId).toBe('dev-1');
  });
});
