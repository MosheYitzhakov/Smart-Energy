import { AnomalyDetector } from '../anomaly-detector';
import type { EnergyReading } from '../../contracts';

const makeReading = (watts: number, i: number): EnergyReading => ({
  deviceId: 'dev-1',
  timestamp: 1000000 + i * 5000,
  watts,
  kwhTotal: 0,
  source: 'simulation',
});

describe('AnomalyDetector', () => {
  const detector = new AnomalyDetector();

  it('returns empty array when fewer than 5 readings', () => {
    const readings = [100, 110, 90].map(makeReading);
    expect(detector.detect(readings)).toHaveLength(0);
  });

  it('returns empty array when all readings are equal (zero std dev)', () => {
    const readings = Array.from({ length: 10 }, () => 1000).map(makeReading);
    expect(detector.detect(readings)).toHaveLength(0);
  });

  it('detects a critical anomaly when a reading is > 3 std devs above mean', () => {
    // 30 stable readings at 1000W → spike at 10000W is clearly critical
    // Mean ≈ 1290, StdDev ≈ 1589, z ≈ 5.5 → well above Z_CRITICAL=3
    const normal = Array.from({ length: 30 }, (_, i) => makeReading(1000, i));
    const spike = makeReading(10000, 30);
    const readings = [...normal, spike];

    const results = detector.detect(readings);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const anomaly = results.find((r) => r.watts === 10000);
    expect(anomaly).toBeDefined();
    expect(anomaly!.severity).toBe('critical');
    expect(anomaly!.zScore).toBeGreaterThan(3);
  });

  it('detects a warning anomaly for moderate spike', () => {
    const normal = Array.from({ length: 20 }, (_, i) => makeReading(1000, i));
    const spike = makeReading(1500, 20);
    const readings = [...normal, spike];

    const results = detector.detect(readings);
    const anomaly = results.find((r) => r.watts === 1500);
    expect(anomaly).toBeDefined();
    expect(['warning', 'critical']).toContain(anomaly!.severity);
  });

  it('preserves deviceId and timestamp on anomaly result', () => {
    const normal = Array.from({ length: 9 }, (_, i) => makeReading(1000, i));
    const spike = makeReading(9000, 9);
    const results = detector.detect([...normal, spike]);

    const anomaly = results.find((r) => r.watts === 9000);
    expect(anomaly!.deviceId).toBe('dev-1');
    expect(anomaly!.timestamp).toBe(1000000 + 9 * 5000);
  });
});
