import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TariffConfig } from './tariff-config.entity';
import { TariffsService } from './tariffs.service';
import { TariffsController } from './tariffs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TariffConfig])],
  controllers: [TariffsController],
  providers: [TariffsService],
  exports: [TariffsService],
})
export class TariffsModule {}
