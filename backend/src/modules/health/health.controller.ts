import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module';
import Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    @InjectConnection() private readonly connection: Connection,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check' })
  async check() {
    const redisStatus = await this.redis
      .ping()
      .then(() => 'ok')
      .catch(() => 'error');

    const result = await this.health.check([() => this.db.pingCheck('db')]);

    return {
      ...result,
      redis: redisStatus,
      uptime: Math.floor(process.uptime()),
    };
  }
}
