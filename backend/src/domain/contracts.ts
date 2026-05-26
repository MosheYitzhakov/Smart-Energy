/**
 * Shared data contracts — the common language of the SmartEnergy system.
 *
 * Rules:
 * - These interfaces are the only shapes passed between layers.
 * - No framework imports here (no NestJS, no TypeORM, no Angular).
 * - If a layer needs to pass data to another, it maps to these types first.
 */

// ---------------------------------------------------------------------------
// Core reading produced by the Simulation Worker
// ---------------------------------------------------------------------------
export interface EnergyReading {
  deviceId: string;
  timestamp: number; // Unix ms
  watts: number;
  kwhTotal: number;
  source: 'simulation' | 'real';
}

// ---------------------------------------------------------------------------
// Aggregates computed by Aggregation Cron (hourly / daily)
// ---------------------------------------------------------------------------
export interface HourlyAggregate {
  deviceId: string;
  hour: string; // ISO 8601 truncated to hour: "2026-05-20T14:00:00Z"
  avgWatts: number;
  maxWatts: number;
  totalKwh: number;
  estimatedCost: number;
}

export interface DailyAggregate {
  deviceId: string;
  date: string; // YYYY-MM-DD
  totalKwh: number;
  peakWatts: number;
  totalCost: number;
}

// ---------------------------------------------------------------------------
// Analytics Engine output — computed by deterministic domain code, never AI
// ---------------------------------------------------------------------------
export interface AnomalyResult {
  deviceId: string;
  timestamp: number;
  watts: number;
  zScore: number;
  severity: 'warning' | 'critical';
}

export interface CostForecast {
  deviceId: string;
  forecastedMonthlyKwh: number;
  forecastedMonthlyCost: number;
  confidenceDays: number; // how many days of data used
}

export interface PatternSummary {
  deviceId: string;
  peakHour: number; // 0-23, hour with highest average watts
  peakDayOfWeek: number; // 0=Sunday, 6=Saturday
  averageWatts: number;
  baselineWatts: number; // lowest 10th-percentile usage
}

// ---------------------------------------------------------------------------
// AI Layer input/output — AI receives pre-computed results, returns text only
// ---------------------------------------------------------------------------
export interface AIInput {
  anomalies: AnomalyResult[];
  dailySummary: DailyAggregate[]; // max 200 items (enforced by DTO validation)
  patterns: PatternSummary[];
  forecasts: CostForecast[];
}

export interface AIOutput {
  explanation: string;
  recommendation: string;
  chatResponse?: string;
  stale: boolean;
  generatedAt: string; // ISO 8601
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// WebSocket events emitted to the frontend
// ---------------------------------------------------------------------------
export interface WsEnergyUpdate {
  type: 'energy.update';
  payload: EnergyReading;
}

export interface WsAlert {
  type: 'alert';
  payload: AnomalyResult;
}

export interface WsDeviceState {
  type: 'device.state';
  payload: {
    deviceId: string;
    isActive: boolean;
    timestamp: number;
  };
}

export type WsEvent = WsEnergyUpdate | WsAlert | WsDeviceState;

// ---------------------------------------------------------------------------
// Automation rule condition / action shapes (stored as JSONB in DB)
// ---------------------------------------------------------------------------
export type AutomationCondition =
  | {
      type: 'watt_threshold';
      deviceId: string;
      value: number;
      operator: 'gt' | 'lt';
    }
  | { type: 'time_window'; startHour: number; endHour: number };

export type AutomationAction =
  | { type: 'notify'; message: string }
  | { type: 'log'; level: 'info' | 'warn' | 'error' };
