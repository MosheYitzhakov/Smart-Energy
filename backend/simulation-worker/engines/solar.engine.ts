import { SolarCurveModel } from '../../src/domain/simulation/solar-curve-model';
import { EnergyCalculator } from '../../src/domain/simulation/energy-calculator';
import type { EnergyReading } from '../../src/domain/contracts';

const solar = new SolarCurveModel();
const calculator = new EnergyCalculator();

export interface DeviceRow {
  id: string;
  powerWatts: number; // panel capacity in watts (e.g. 3000 = 3 kW system)
}

/** Solar panel: generates power (positive watts = generation), zero at night. */
export function generateSolarReading(
  device: DeviceRow,
  timestamp: number,
  kwhTotal: number,
): EnergyReading {
  const panelCapacityKw = device.powerWatts / 1000;
  const watts = Math.round(solar.generate(timestamp, panelCapacityKw));
  return {
    deviceId: device.id,
    timestamp,
    watts,
    kwhTotal: calculator.accumulate(kwhTotal, watts),
    source: 'simulation',
  };
}
