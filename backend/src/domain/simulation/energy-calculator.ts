export class EnergyCalculator {
  static readonly INTERVAL_MS = 5_000; // 5-second simulation tick

  toKwh(watts: number, intervalMs = EnergyCalculator.INTERVAL_MS): number {
    return (watts * intervalMs) / 3_600_000_000;
  }

  accumulate(current: number, watts: number, intervalMs = EnergyCalculator.INTERVAL_MS): number {
    return current + this.toKwh(watts, intervalMs);
  }
}
