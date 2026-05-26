import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EnergyReading } from './entities/energy-reading.entity';
import { EnergyHourly } from './entities/energy-hourly.entity';
import { EnergyDaily } from './entities/energy-daily.entity';
import { Granularity, QueryReadingsDto } from './dto/query-readings.dto';
import { SummaryPeriod, QuerySummaryDto } from './dto/query-summary.dto';
import type { EnergyReading as EnergyReadingContract } from '../../domain/contracts';

const MAX_ROWS = 500;

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(EnergyReading)
    private readonly readingRepo: Repository<EnergyReading>,
    @InjectRepository(EnergyHourly)
    private readonly hourlyRepo: Repository<EnergyHourly>,
    @InjectRepository(EnergyDaily)
    private readonly dailyRepo: Repository<EnergyDaily>,
  ) {}

  async getReadings(userId: string, dto: QueryReadingsDto) {
    const { deviceId, from, to, granularity = Granularity.RAW } = dto;

    if (granularity === Granularity.HOURLY) {
      return this.hourlyRepo.find({
        where: { deviceId },
        order: { hour: 'DESC' },
        take: MAX_ROWS,
      });
    }

    if (granularity === Granularity.DAILY) {
      return this.dailyRepo.find({
        where: { deviceId },
        order: { date: 'DESC' },
        take: MAX_ROWS,
      });
    }

    const where: Record<string, unknown> = { deviceId };
    if (from && to) {
      where['timestamp'] = Between(Number(from), Number(to));
    } else if (from) {
      where['timestamp'] = MoreThanOrEqual(Number(from));
    } else if (to) {
      where['timestamp'] = LessThanOrEqual(Number(to));
    }

    return this.readingRepo.find({
      where,
      order: { timestamp: 'DESC' },
      take: MAX_ROWS,
    });
  }

  async getSummary(userId: string, dto: QuerySummaryDto) {
    const now = Date.now();
    const periodMs: Record<SummaryPeriod, number> = {
      [SummaryPeriod.DAY]: 24 * 60 * 60 * 1000,
      [SummaryPeriod.WEEK]: 7 * 24 * 60 * 60 * 1000,
      [SummaryPeriod.MONTH]: 30 * 24 * 60 * 60 * 1000,
    };
    const from = now - periodMs[dto.period ?? SummaryPeriod.DAY];

    const rows = await this.readingRepo
      .createQueryBuilder('r')
      .innerJoin('r.device', 'd')
      .where('d.userId = :userId', { userId })
      .andWhere('r.timestamp >= :from', { from })
      .select([
        'r.deviceId as "deviceId"',
        'SUM(r.watts) / COUNT(*) as "avgWatts"',
        'MAX(r.watts) as "peakWatts"',
        'MAX(r.kwhTotal) - MIN(r.kwhTotal) as "totalKwh"',
      ])
      .groupBy('r.deviceId')
      .getRawMany<{
        deviceId: string;
        avgWatts: string;
        peakWatts: string;
        totalKwh: string;
      }>();

    return rows.map((r) => ({
      deviceId: r.deviceId,
      avgWatts: parseFloat(r.avgWatts),
      peakWatts: parseFloat(r.peakWatts),
      totalKwh: parseFloat(r.totalKwh),
    }));
  }

  /** Last `limit` raw readings across all devices belonging to userId, ASC order for charts. */
  async getRecent(userId: string, limit = 720): Promise<EnergyReadingContract[]> {
    const rows = await this.readingRepo
      .createQueryBuilder('r')
      .innerJoin('r.device', 'd')
      .where('d.userId = :userId', { userId })
      .orderBy('r.timestamp', 'DESC')
      .take(limit)
      .getMany();

    return rows.reverse().map((r) => ({
      deviceId: r.deviceId,
      timestamp: Number(r.timestamp),
      watts: Number(r.watts),
      kwhTotal: Number(r.kwhTotal),
      source: r.source,
    }));
  }

  async upsertReading(data: EnergyReadingContract): Promise<void> {
    await this.readingRepo
      .createQueryBuilder()
      .insert()
      .into(EnergyReading)
      .values({
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        watts: data.watts,
        kwhTotal: data.kwhTotal,
        source: data.source,
      })
      .orIgnore()
      .execute();
  }
}
