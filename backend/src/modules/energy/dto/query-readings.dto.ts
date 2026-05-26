import { IsUUID, IsEnum, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Granularity {
  RAW = 'raw',
  HOURLY = 'hourly',
  DAILY = 'daily',
}

export class QueryReadingsDto {
  @ApiProperty({ description: 'Device UUID' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ description: 'From timestamp (Unix ms)', required: false })
  @IsNumberString()
  @IsOptional()
  from?: string;

  @ApiProperty({ description: 'To timestamp (Unix ms)', required: false })
  @IsNumberString()
  @IsOptional()
  to?: string;

  @ApiProperty({ enum: Granularity, default: Granularity.RAW, required: false })
  @IsEnum(Granularity)
  @IsOptional()
  granularity?: Granularity = Granularity.RAW;
}
