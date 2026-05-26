import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReading } from '../energy/entities/energy-reading.entity';
import { EnergyHourly } from '../energy/entities/energy-hourly.entity';
import { EnergyDaily } from '../energy/entities/energy-daily.entity';
import { TariffConfig } from '../tariffs/tariff-config.entity';

const RETENTION_DAYS = 30;

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    @InjectRepository(EnergyReading)
    private readonly readingRepo: Repository<EnergyReading>,
    @InjectRepository(EnergyHourly)
    private readonly hourlyRepo: Repository<EnergyHourly>,
    @InjectRepository(EnergyDaily)
    private readonly dailyRepo: Repository<EnergyDaily>,
    @InjectRepository(TariffConfig)
    private readonly tariffRepo: Repository<TariffConfig>,
  ) {}

  /** Every hour: aggregate the previous hour's readings per device. */
  @Cron('0 * * * *')
  async aggregateHourly(): Promise<void> {
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    hourStart.setHours(hourStart.getHours() - 1);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const fromMs = hourStart.getTime();
    const toMs = hourEnd.getTime();
    const hourStr = hourStart.toISOString().slice(0, 13) + ':00:00Z';

    const rows = await this.readingRepo
      .createQueryBuilder('r')
      .select('r.deviceId', 'deviceId')
      .addSelect('AVG(r.watts)', 'avgWatts')
      .addSelect('MAX(r.watts)', 'maxWatts')
      .addSelect('SUM(r.watts * 5000) / 3600000000', 'totalKwh')
      .where('r.timestamp >= :from AND r.timestamp < :to', { from: fromMs, to: toMs })
      .groupBy('r.deviceId')
      .getRawMany<{ deviceId: string; avgWatts: string; maxWatts: string; totalKwh: string }>();

    for (const row of rows) {
      const rate = await this.getRateForDevice(row.deviceId, hourStart);
      const totalKwh = parseFloat(row.totalKwh ?? '0');
      await this.hourlyRepo.save(
        this.hourlyRepo.create({
          deviceId: row.deviceId,
          hour: hourStr,
          avgWatts: parseFloat(row.avgWatts),
          maxWatts: parseFloat(row.maxWatts),
          totalKwh,
          estimatedCost: totalKwh * rate,
        }),
      );
    }
    this.logger.log(`Hourly aggregation done: ${rows.length} device(s) for ${hourStr}`);
  }

  /** Every midnight: aggregate yesterday's readings per device. */
  @Cron('0 0 * * *')
  async aggregateDaily(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    const fromMs = new Date(dateStr + 'T00:00:00Z').getTime();
    const toMs = fromMs + 86_400_000;

    const rows = await this.readingRepo
      .createQueryBuilder('r')
      .select('r.deviceId', 'deviceId')
      .addSelect('SUM(r.watts * 5000) / 3600000000', 'totalKwh')
      .addSelect('MAX(r.watts)', 'peakWatts')
      .where('r.timestamp >= :from AND r.timestamp < :to', { from: fromMs, to: toMs })
      .groupBy('r.deviceId')
      .getRawMany<{ deviceId: string; totalKwh: string; peakWatts: string }>();

    for (const row of rows) {
      const rate = await this.getRateForDevice(row.deviceId, yesterday);
      const totalKwh = parseFloat(row.totalKwh ?? '0');
      await this.dailyRepo.save(
        this.dailyRepo.create({
          deviceId: row.deviceId,
          date: dateStr,
          totalKwh,
          peakWatts: parseFloat(row.peakWatts),
          totalCost: totalKwh * rate,
        }),
      );
    }
    this.logger.log(`Daily aggregation done: ${rows.length} device(s) for ${dateStr}`);
  }

  /** 02:00 daily: delete raw readings older than 30 days. */
  @Cron('0 2 * * *')
  async cleanupOldReadings(): Promise<void> {
    const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
    const result = await this.readingRepo
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoff', { cutoff })
      .execute();
    this.logger.log(`Cleanup: deleted ${result.affected ?? 0} readings older than ${RETENTION_DAYS} days`);
  }

  private async getRateForDevice(deviceId: string, date: Date): Promise<number> {
    const result = await this.tariffRepo
      .createQueryBuilder('t')
      .innerJoin('devices', 'd', 'd.id = :deviceId AND d."userId" = t."userId"', { deviceId })
      .getOne();

    if (!result) return 0.55; // fallback average
    const hour = date.getHours();
    const day = date.getDay();
    const isWeekend = day === 5 || day === 6;
    const isPeak = !isWeekend && hour >= result.peakStart && hour < result.peakEnd;
    return isPeak ? Number(result.peakRate) : Number(result.offPeakRate);
  }
}
