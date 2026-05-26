import { EnergyCalculator } from '../../src/domain/simulation/energy-calculator';
import type { EnergyReading } from '../../src/domain/contracts';

const calculator = new EnergyCalculator();

export interface DeviceRow {
  id: string;
  powerWatts: number;
}

/** Boiler: morning heating spikes (6–9), brief evening spike (20–21), otherwise standby. */
export function generateBoilerReading(
  device: DeviceRow,
  timestamp: number,
  kwhTotal: number,
): EnergyReading {
  const hour = new Date(timestamp).getHours();
  const load = boilerLoad(hour, timestamp);
  const watts = Math.round(device.powerWatts * load);
  return {
    deviceId: device.id,
    timestamp,
    watts,
    kwhTotal: calculator.accumulate(kwhTotal, watts),
    source: 'simulation',
  };
}

function boilerLoad(hour: number, timestamp: number): number {
  let base: number;
  if (hour >= 6 && hour < 9) base = 0.85;       // Morning shower
  else if (hour >= 20 && hour < 21) base = 0.60; // Evening shower
  else base = 0.05;                               // Standby

  const noise = deterministicNoise(timestamp) * 0.08;
  return Math.min(1, Math.max(0.02, base + noise));
}

function deterministicNoise(timestamp: number): number {
  const x = Math.sin(timestamp * 0.000211) * 31_415.9265;
  return (x - Math.floor(x)) * 2 - 1;
}
