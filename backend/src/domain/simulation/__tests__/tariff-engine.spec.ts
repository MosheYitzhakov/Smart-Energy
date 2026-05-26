import { TariffEngine } from '../tariff-engine';

describe('TariffEngine', () => {
  const engine = new TariffEngine();

  // Sunday 20:00 Israel time = peak (weekday, 17–22)
  const peakTs = new Date('2026-05-24T17:00:00+03:00').getTime();
  // Sunday 02:00 = off-peak
  const offPeakTs = new Date('2026-05-24T02:00:00+03:00').getTime();
  // Saturday 20:00 = off-peak (weekend)
  const weekendPeakHourTs = new Date('2026-05-23T20:00:00+03:00').getTime();

  it('returns peak rate during peak hours on weekdays', () => {
    const rate = engine.getRateAt(peakTs);
    expect(rate.period).toBe('peak');
    expect(rate.rateILS).toBe(TariffEngine.PEAK_RATE_ILS);
  });

  it('returns off-peak rate outside peak hours', () => {
    const rate = engine.getRateAt(offPeakTs);
    expect(rate.period).toBe('off-peak');
    expect(rate.rateILS).toBe(TariffEngine.OFF_PEAK_RATE_ILS);
  });

  it('returns off-peak rate on weekends even during peak hours', () => {
    const rate = engine.getRateAt(weekendPeakHourTs);
    expect(rate.period).toBe('off-peak');
    expect(rate.rateILS).toBe(TariffEngine.OFF_PEAK_RATE_ILS);
  });

  it('calculates cost correctly for 1kW device over 1 hour at peak rate', () => {
    const watts = 1000;
    const intervalMs = 3_600_000; // 1 hour
    const cost = engine.calculateCostILS(watts, intervalMs, peakTs);
    // 1kWh × 0.65 = 0.65 ILS
    expect(cost).toBeCloseTo(0.65, 4);
  });

  it('calculateCostILS is deterministic for same inputs', () => {
    const a = engine.calculateCostILS(500, 5000, peakTs);
    const b = engine.calculateCostILS(500, 5000, peakTs);
    expect(a).toBe(b);
  });
});
