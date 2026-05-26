/**
 * Time-of-day load factor for residential consumption.
 * Deterministic: same timestamp always returns same factor.
 */
export class ConsumptionPattern {
  getLoadFactor(timestamp: number): number {
    const hour = new Date(timestamp).getHours();
    const base = this.baseForHour(hour);
    const noise = this.deterministicNoise(timestamp) * 0.15; // ±7.5%
    return Math.min(1, Math.max(0.05, base + noise));
  }

  private baseForHour(hour: number): number {
    if (hour < 6) return 0.15;   // Night: standby
    if (hour < 9) return 0.75;   // Morning: shower + breakfast
    if (hour < 12) return 0.45;  // Mid-morning: moderate
    if (hour < 18) return 0.65;  // Afternoon: AC peak
    if (hour < 22) return 0.80;  // Evening: cooking + entertainment
    return 0.30;                  // Late night: winding down
  }

  /** Maps timestamp to a deterministic value in [-1, 1]. */
  private deterministicNoise(timestamp: number): number {
    const x = Math.sin(timestamp * 0.000137) * 43_758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }
}
