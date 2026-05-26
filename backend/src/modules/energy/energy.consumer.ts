import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import type { EnergyReading as EnergyReadingContract } from '../../domain/contracts';
import { AnomalyDetector } from '../../domain/analytics/anomaly-detector';
import { EnergyService } from './energy.service';
import { EnergyReading } from './entities/energy-reading.entity';
import { Device } from '../devices/device.entity';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module';
import { ENERGY_QUEUE } from '../../infrastructure/bullmq/bullmq.constants';
import { AutomationRule } from '../automations/automation-rule.entity';
import type { AutomationCondition } from '../../domain/contracts';

@Injectable()
export class EnergyConsumer implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;
  private readonly anomalyDetector = new AnomalyDetector();

  constructor(
    private readonly configService: ConfigService,
    private readonly energyService: EnergyService,
    @InjectRepository(EnergyReading)
    private readonly readingRepo: Repository<EnergyReading>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(AutomationRule)
    private readonly automationRepo: Repository<AutomationRule>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      ENERGY_QUEUE,
      async (job: Job<EnergyReadingContract>) => this.process(job),
      {
        connection: {
          host: this.configService.getOrThrow<string>('REDIS_HOST'),
          port: this.configService.getOrThrow<number>('REDIS_PORT'),
        },
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[EnergyConsumer] Job ${job?.id ?? 'unknown'} failed: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }

  private async process(job: Job<EnergyReadingContract>): Promise<void> {
    const reading = job.data;

    await this.energyService.upsertReading(reading);

    const device = await this.deviceRepo.findOne({
      where: { id: reading.deviceId },
      select: ['userId'],
    });
    if (!device) return;

    await this.redis.publish(
      'energy.live',
      JSON.stringify({ userId: device.userId, reading }),
    );

    // Fetch last 20 readings (DESC) then reverse for AnomalyDetector (needs ASC)
    const recent = await this.readingRepo.find({
      where: { deviceId: reading.deviceId },
      order: { timestamp: 'DESC' },
      take: 20,
    });

    const window: EnergyReadingContract[] = recent.reverse().map((r) => ({
      deviceId: r.deviceId,
      timestamp: Number(r.timestamp),
      watts: Number(r.watts),
      kwhTotal: Number(r.kwhTotal),
      source: r.source,
    }));

    const anomalies = this.anomalyDetector.detect(window);
    for (const anomaly of anomalies) {
      if (anomaly.timestamp === reading.timestamp) {
        await this.redis.publish(
          'energy.alerts',
          JSON.stringify({ userId: device.userId, anomaly }),
        );
      }
    }

    await this.evaluateAutomations(device.userId, reading.deviceId, reading.watts);
  }

  private async evaluateAutomations(userId: string, deviceId: string, watts: number): Promise<void> {
    const rules = await this.automationRepo.find({ where: { userId, isActive: true } });
    for (const rule of rules) {
      if (!this.conditionMet(rule.condition, deviceId, watts)) continue;

      if (rule.action.type === 'notify') {
        await this.redis.publish(
          'energy.alerts',
          JSON.stringify({
            userId,
            anomaly: {
              deviceId,
              timestamp: Date.now(),
              watts,
              zScore: 0,
              severity: 'warning' as const,
              message: rule.action.message,
            },
          }),
        );
      } else if (rule.action.type === 'log') {
        const level = rule.action.level ?? 'info';
        console[level as 'info' | 'warn' | 'error'](
          `[Automation] ${rule.name} | ${watts.toFixed(0)}W | deviceId=${deviceId}`,
        );
      }
    }
  }

  private conditionMet(condition: AutomationCondition, deviceId: string, watts: number): boolean {
    if (condition.type === 'watt_threshold') {
      // If no deviceId specified on the rule, match all devices
      if (condition.deviceId && condition.deviceId !== deviceId) return false;
      return condition.operator === 'gt' ? watts > condition.value : watts < condition.value;
    }
    if (condition.type === 'time_window') {
      const hour = new Date().getHours();
      const { startHour, endHour } = condition;
      // Handle midnight crossing (e.g. 23:00–01:00)
      if (startHour <= endHour) {
        return hour >= startHour && hour < endHour;
      }
      return hour >= startHour || hour < endHour;
    }
    return false;
  }
}
