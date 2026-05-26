import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module';
import { AI_PROVIDER, type AIProvider } from './ai-provider.interface';
import type { AIOutput, ChatMessage } from '../../domain/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyReading } from '../energy/entities/energy-reading.entity';
import { EnergyDaily } from '../energy/entities/energy-daily.entity';
import { Device } from '../devices/device.entity';
import { AnomalyDetector } from '../../domain/analytics/anomaly-detector';
import type { EnergyReading as EnergyReadingContract, DailyAggregate, AIInput } from '../../domain/contracts';

const RATE_LIMIT = 20;
const RATE_TTL_S = 3600;
const CACHE_TTL_S = 1800;
const CB_THRESHOLD = 3;
const CB_RESET_MS = 30_000;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly anomalyDetector = new AnomalyDetector();

  // Simple in-process circuit breaker state
  private cbFailures = 0;
  private cbOpenedAt = 0;

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AIProvider,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(EnergyReading) private readonly readingRepo: Repository<EnergyReading>,
    @InjectRepository(EnergyDaily) private readonly dailyRepo: Repository<EnergyDaily>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
  ) {}

  async getInsight(userId: string): Promise<AIOutput> {
    await this.checkRateLimit(userId);

    const input = await this.buildAIInput(userId);
    const cacheKey = `ai:insight:${userId}:${hash(input)}`;

    // Circuit breaker — if open, return stale cache
    if (this.isCircuitOpen()) {
      return this.staleOrError(cacheKey);
    }

    // Cache hit
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as AIOutput;

    // Call AI
    try {
      const result = await this.provider.explain(input);
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_S);
      this.cbFailures = 0;
      return result;
    } catch (err) {
      this.recordFailure();
      this.logger.error(`AI explain failed: ${(err as Error).message}`);
      return this.staleOrError(cacheKey);
    }
  }

  async chat(userId: string, history: ChatMessage[], question: string): Promise<string> {
    await this.checkRateLimit(userId);

    if (this.isCircuitOpen()) {
      return 'מערכת ה-AI אינה זמינה כרגע. נסה שוב בעוד מספר דקות.';
    }

    try {
      const answer = await this.provider.chat(history, question);
      this.cbFailures = 0;
      return answer;
    } catch (err) {
      this.recordFailure();
      this.logger.error(`AI chat failed: ${(err as Error).message}`);
      return 'אירעה שגיאה בתקשורת עם ה-AI. נסה שוב.';
    }
  }

  private async buildAIInput(userId: string): Promise<AIInput> {
    const devices = await this.deviceRepo.find({ where: { userId } });
    const deviceIds = devices.map((d) => d.id);

    const since = Date.now() - 24 * 60 * 60 * 1000;

    // Recent raw readings for anomaly detection
    const rawRows = deviceIds.length
      ? await this.readingRepo
          .createQueryBuilder('r')
          .where('r.deviceId IN (:...ids)', { ids: deviceIds })
          .andWhere('r.timestamp >= :since', { since })
          .orderBy('r.timestamp', 'ASC')
          .take(200)
          .getMany()
      : [];

    const readings: EnergyReadingContract[] = rawRows.map((r) => ({
      deviceId: r.deviceId,
      timestamp: Number(r.timestamp),
      watts: Number(r.watts),
      kwhTotal: Number(r.kwhTotal),
      source: r.source,
    }));

    const anomalies = this.anomalyDetector.detect(readings);

    // Daily aggregates (last 7 days)
    const dailyRows = deviceIds.length
      ? await this.dailyRepo
          .createQueryBuilder('d')
          .where('d.deviceId IN (:...ids)', { ids: deviceIds })
          .orderBy('d.date', 'DESC')
          .take(7 * deviceIds.length)
          .getMany()
      : [];

    const dailySummary: DailyAggregate[] = dailyRows.map((r) => ({
      deviceId: r.deviceId,
      date: r.date,
      totalKwh: Number(r.totalKwh),
      peakWatts: Number(r.peakWatts),
      totalCost: Number(r.totalCost),
    }));

    return { anomalies, dailySummary, patterns: [], forecasts: [] };
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const key = `ai:calls:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, RATE_TTL_S);
    if (count > RATE_LIMIT) {
      throw new HttpException('AI rate limit exceeded — try again in an hour', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private isCircuitOpen(): boolean {
    if (this.cbFailures < CB_THRESHOLD) return false;
    if (Date.now() - this.cbOpenedAt > CB_RESET_MS) {
      // Half-open: allow one retry
      this.cbFailures = CB_THRESHOLD - 1;
      return false;
    }
    return true;
  }

  private recordFailure(): void {
    this.cbFailures++;
    if (this.cbFailures >= CB_THRESHOLD) this.cbOpenedAt = Date.now();
  }

  private async staleOrError(cacheKey: string): Promise<AIOutput> {
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const output = JSON.parse(cached) as AIOutput;
      return { ...output, stale: true };
    }
    return {
      explanation: 'מערכת ה-AI אינה זמינה כרגע.',
      recommendation: 'נסה שוב בעוד מספר דקות.',
      stale: true,
      generatedAt: new Date().toISOString(),
    };
  }
}

function hash(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}
