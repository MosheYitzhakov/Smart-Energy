/**
 * Sinusoidal solar generation model.
 * Peak at solar noon (13:00), zero at sunrise (06:00) and sunset (20:00).
 * Deterministic: same timestamp always returns same watts.
 */
export class SolarCurveModel {
  private static readonly SUNRISE_HOUR = 6;
  private static readonly SUNSET_HOUR = 20;

  generate(timestamp: number, panelCapacityKw: number, efficiency = 0.85): number {
    const date = new Date(timestamp);
    const hour = date.getHours() + date.getMinutes() / 60;

    if (hour < SolarCurveModel.SUNRISE_HOUR || hour >= SolarCurveModel.SUNSET_HOUR) {
      return 0;
    }

    const dayLength = SolarCurveModel.SUNSET_HOUR - SolarCurveModel.SUNRISE_HOUR;
    const angle = (Math.PI * (hour - SolarCurveModel.SUNRISE_HOUR)) / dayLength;
    const irradiance = Math.sin(angle); // 0 at sunrise/sunset, 1 at solar noon

    return panelCapacityKw * 1000 * irradiance * efficiency;
  }
}
