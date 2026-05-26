import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { configValidationSchema } from './infrastructure/config/config.validation';
import { RedisModule } from './infrastructure/redis/redis.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevicesModule } from './modules/devices/devices.module';
import { EnergyModule } from './modules/energy/energy.module';
import { HealthModule } from './modules/health/health.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env['NODE_ENV'] ?? 'dev'}`,
      validationSchema: configValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        migrations: [
          __dirname + '/infrastructure/database/migrations/*{.ts,.js}',
        ],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    RedisModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    EnergyModule,
    HealthModule,
    GatewayModule,
    TariffsModule,
    AutomationsModule,
    AggregationModule,
    AIModule,
  ],
})
export class AppModule {}
