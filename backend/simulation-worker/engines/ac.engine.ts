import { ConsumptionPattern } from '../../src/domain/simulation/consumption-pattern';
import { EnergyCalculator } from '../../src/domain/simulation/energy-calculator';
import type { EnergyReading } from '../../src/domain/contracts';

const pattern = new ConsumptionPattern();
const calculator = new EnergyCalculator();

export interface DeviceRow {
  id: string;
  powerWatts: number;
}

export function generateAcReading(
  device: DeviceRow,
  timestamp: number,
  kwhTotal: number,
): EnergyReading {
  const load = pattern.getLoadFactor(timestamp);
  const watts = Math.round(device.powerWatts * load);
  return {
    deviceId: device.id,
    timestamp,
    watts,
    kwhTotal: calculator.accumulate(kwhTotal, watts),
    source: 'simulation',
  };
}
