import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyReading } from '../energy/entities/energy-reading.entity';
import { EnergyHourly } from '../energy/entities/energy-hourly.entity';
import { EnergyDaily } from '../energy/entities/energy-daily.entity';
import { TariffConfig } from '../tariffs/tariff-config.entity';
import { AggregationService } from './aggregation.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyReading, EnergyHourly, EnergyDaily, TariffConfig])],
  providers: [AggregationService],
})
export class AggregationModule {}
