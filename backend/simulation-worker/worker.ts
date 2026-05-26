import { config } from 'dotenv';
config({ path: `.env.${process.env['NODE_ENV'] ?? 'dev'}` });

import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import { ENERGY_QUEUE, ENERGY_JOB } from '../src/infrastructure/bullmq/bullmq.constants';
import { generateAcReading } from './engines/ac.engine';
import { generateBoilerReading } from './engines/boiler.engine';
import { generateSolarReading } from './engines/solar.engine';
import type { EnergyReading } from '../src/domain/contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeviceType = 'ac' | 'boiler' | 'solar' | 'other';

interface DeviceRow {
  id: string;
  type: DeviceType;
  powerWatts: string; // PostgreSQL DECIMAL → string
}

interface LastReading {
  kwhTotal: string;
}

// ---------------------------------------------------------------------------
// DB + BullMQ setup
// ---------------------------------------------------------------------------

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  username: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASSWORD'] ?? 'postgres',
  database: process.env['DB_NAME'] ?? 'smartenergy',
  entities: [],
  synchronize: false,
  logging: false,
});

const queue = new Queue(ENERGY_QUEUE, {
  connection: {
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
  },
});

// kwhTotal per device (in-memory, initialised from DB on startup)
const kwhMap = new Map<string, number>();

// ---------------------------------------------------------------------------
// Device helpers
// ---------------------------------------------------------------------------

async function loadDevices(): Promise<DeviceRow[]> {
  return dataSource.query<DeviceRow[]>(
    `SELECT id, type, "powerWatts" FROM devices WHERE "isActive" = true`,
  );
}

async function initKwhMap(devices: DeviceRow[]): Promise<void> {
  for (const device of devices) {
    if (kwhMap.has(device.id)) continue;
    const rows = await dataSource.query<LastReading[]>(
      `SELECT "kwhTotal" FROM energy_readings WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1`,
      [device.id],
    );
    kwhMap.set(device.id, rows.length > 0 ? parseFloat(rows[0]!.kwhTotal) : 0);
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

async function tick(devices: DeviceRow[]): Promise<void> {
  const now = Date.now();
  for (const device of devices) {
    const kwhTotal = kwhMap.get(device.id) ?? 0;
    const powerWatts = parseFloat(device.powerWatts);

    let reading: EnergyReading | null = null;

    switch (device.type) {
      case 'ac':
        reading = generateAcReading({ id: device.id, powerWatts }, now, kwhTotal);
        break;
      case 'boiler':
        reading = generateBoilerReading({ id: device.id, powerWatts }, now, kwhTotal);
        break;
      case 'solar':
        reading = generateSolarReading({ id: device.id, powerWatts }, now, kwhTotal);
        break;
      default:
        // 'other' devices: low constant draw with noise
        reading = {
          deviceId: device.id,
          timestamp: now,
          watts: Math.round(powerWatts * 0.1),
          kwhTotal: kwhTotal + (powerWatts * 0.1 * 5_000) / 3_600_000_000,
          source: 'simulation',
        };
    }

    kwhMap.set(device.id, reading.kwhTotal);

    await queue.add(ENERGY_JOB, reading, {
      jobId: `${device.id}_${now}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 50,
      removeOnFail: 20,
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[Worker] Connecting to database…');
  await dataSource.initialize();
  console.log('[Worker] Database connected.');

  let devices = await loadDevices();
  await initKwhMap(devices);
  console.log(`[Worker] Loaded ${devices.length} active device(s).`);

  // Refresh device list every 60 s
  setInterval(async () => {
    devices = await loadDevices();
    await initKwhMap(devices);
    console.log(`[Worker] Refreshed device list: ${devices.length} device(s).`);
  }, 60_000);

  // Emit readings every 5 s
  setInterval(async () => {
    try {
      await tick(devices);
    } catch (err) {
      console.error('[Worker] Tick error:', err instanceof Error ? err.message : err);
    }
  }, 5_000);

  console.log('[Worker] Running — emitting every 5 s.');
}

main().catch((err: unknown) => {
  console.error('[Worker] Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
