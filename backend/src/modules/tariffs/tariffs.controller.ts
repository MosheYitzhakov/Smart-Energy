import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TariffsService } from './tariffs.service';
import { UpsertTariffDto } from './dto/upsert-tariff.dto';

@UseGuards(JwtAuthGuard)
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.tariffsService.get(userId);
  }

  @Post()
  upsert(@CurrentUser('id') userId: string, @Body() dto: UpsertTariffDto) {
    return this.tariffsService.upsert(userId, dto);
  }
}
