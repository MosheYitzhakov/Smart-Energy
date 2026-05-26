import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyReading } from './entities/energy-reading.entity';
import { EnergyHourly } from './entities/energy-hourly.entity';
import { EnergyDaily } from './entities/energy-daily.entity';
import { EnergyService } from './energy.service';
import { EnergyController } from './energy.controller';
import { EnergyConsumer } from './energy.consumer';
import { Device } from '../devices/device.entity';
import { AutomationRule } from '../automations/automation-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyReading, EnergyHourly, EnergyDaily, Device, AutomationRule])],
  controllers: [EnergyController],
  providers: [EnergyService, EnergyConsumer],
  exports: [EnergyService],
})
export class EnergyModule {}
