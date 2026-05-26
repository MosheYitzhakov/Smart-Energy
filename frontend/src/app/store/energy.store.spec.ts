import { TestBed } from '@angular/core/testing';
import { EnergyStore } from './energy.store';
import type { EnergyReading, AnomalyResult } from '../shared/models/contracts';

const makeReading = (watts: number, timestamp: number): EnergyReading => ({
  deviceId: 'dev-1',
  timestamp,
  watts,
  kwhTotal: 0,
  source: 'simulation',
});

describe('EnergyStore', () => {
  let store: EnergyStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(EnergyStore);
  });

  it('starts with empty readings', () => {
    expect(store.readings()).toEqual([]);
  });

  it('currentWatts is 0 with no readings', () => {
    expect(store.currentWatts()).toBe(0);
  });

  it('pushReading appends a reading', () => {
    const r = makeReading(500, Date.now());
    store.pushReading(r);
    expect(store.readings().length).toBe(1);
    expect(store.readings()[0].watts).toBe(500);
  });

  it('currentWatts reflects the last reading', () => {
    store.pushReading(makeReading(300, 1_000));
    store.pushReading(makeReading(800, 2_000));
    expect(store.currentWatts()).toBe(800);
  });

  it('pushReading caps buffer at 720 entries', () => {
    for (let i = 0; i < 730; i++) {
      store.pushReading(makeReading(100, i));
    }
    expect(store.readings().length).toBe(720);
  });

  it('pushAlert prepends and caps at 20', () => {
    for (let i = 0; i < 25; i++) {
      const alert: AnomalyResult = {
        deviceId: 'dev-1',
        timestamp: i,
        watts: 1000 + i,
        zScore: 3,
        severity: 'warning',
      };
      store.pushAlert(alert);
    }
    expect(store.alerts().length).toBe(20);
    expect(store.alerts()[0].timestamp).toBe(24);
  });

  it('setTariff updates all tariff signals', () => {
    store.setTariff({ peakRate: 0.9, offPeakRate: 0.5, peakStart: 16, peakEnd: 21 });
    expect(store.peakRate()).toBe(0.9);
    expect(store.offPeakRate()).toBe(0.5);
    expect(store.peakStart()).toBe(16);
    expect(store.peakEnd()).toBe(21);
  });

  it('isStale toggles with markStale / markFresh', () => {
    expect(store.isStale()).toBe(false);
    store.markStale();
    expect(store.isStale()).toBe(true);
    store.markFresh();
    expect(store.isStale()).toBe(false);
  });

  it('dailyCost uses off-peak rate for weekend readings', () => {
    store.setTariff({ peakRate: 0.65, offPeakRate: 0.48, peakStart: 17, peakEnd: 22 });
    // Saturday = getDay() === 6 → off-peak
    const saturdayTs = new Date('2026-05-23T20:00:00+03:00').getTime();
    store.pushReading(makeReading(1000, saturdayTs));
    // 1000W × 5s / 3_600_000_000 × 0.48
    const expected = (1000 * 5_000) / 3_600_000_000 * 0.48;
    expect(store.dailyCost()).toBeCloseTo(expected, 6);
  });
});
