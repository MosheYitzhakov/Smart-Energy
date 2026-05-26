import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnergyService } from './energy.service';
import { QueryReadingsDto } from './dto/query-readings.dto';
import { QuerySummaryDto } from './dto/query-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('energy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('energy')
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get last 720 raw readings for all user devices (for dashboard seed)' })
  getRecent(@CurrentUser() user: User) {
    return this.energyService.getRecent(user.id);
  }

  @Get('readings')
  @ApiOperation({ summary: 'Get energy readings (raw | hourly | daily)' })
  getReadings(@Query() dto: QueryReadingsDto, @CurrentUser() user: User) {
    return this.energyService.getReadings(user.id, dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get energy summary for a period' })
  getSummary(@Query() dto: QuerySummaryDto, @CurrentUser() user: User) {
    return this.energyService.getSummary(user.id, dto);
  }
}
