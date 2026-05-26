// Mirror of backend domain/contracts.ts — keep in sync manually

export interface EnergyReading {
  deviceId: string;
  timestamp: number;
  watts: number;
  kwhTotal: number;
  source: 'simulation' | 'real';
}

export interface DailyAggregate {
  deviceId: string;
  date: string;
  totalKwh: number;
  peakWatts: number;
  totalCost: number;
}

export interface AnomalyResult {
  deviceId: string;
  timestamp: number;
  watts: number;
  zScore: number;
  severity: 'warning' | 'critical';
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: 'ac' | 'boiler' | 'solar' | 'other';
  powerWatts: number;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
}
