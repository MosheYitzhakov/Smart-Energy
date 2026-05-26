import { SolarCurveModel } from '../solar-curve-model';

describe('SolarCurveModel', () => {
  const model = new SolarCurveModel();
  const PANEL_KW = 4;

  const tsAt = (hour: number) => new Date(`2026-05-24T${String(hour).padStart(2, '0')}:00:00`).getTime();

  it('generates zero output at night (03:00)', () => {
    expect(model.generate(tsAt(3), PANEL_KW)).toBe(0);
  });

  it('generates zero output before sunrise (05:00)', () => {
    expect(model.generate(tsAt(5), PANEL_KW)).toBe(0);
  });

  it('generates positive output at midday (13:00)', () => {
    expect(model.generate(tsAt(13), PANEL_KW)).toBeGreaterThan(0);
  });

  it('peak generation does not exceed panel capacity × efficiency', () => {
    const efficiency = 0.85;
    const maxExpected = PANEL_KW * 1000 * efficiency;
    for (let h = 0; h < 24; h++) {
      expect(model.generate(tsAt(h), PANEL_KW)).toBeLessThanOrEqual(maxExpected + 1);
    }
  });

  it('is deterministic — same input returns same output', () => {
    const ts = tsAt(12);
    expect(model.generate(ts, PANEL_KW)).toBe(model.generate(ts, PANEL_KW));
  });
});
