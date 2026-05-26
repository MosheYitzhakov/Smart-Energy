import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SummaryPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class QuerySummaryDto {
  @ApiProperty({ enum: SummaryPeriod, default: SummaryPeriod.DAY, required: false })
  @IsEnum(SummaryPeriod)
  @IsOptional()
  period?: SummaryPeriod = SummaryPeriod.DAY;
}
