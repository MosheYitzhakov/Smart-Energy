import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertTariffDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  peakRate!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offPeakRate!: number;

  @IsNumber()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  peakStart!: number;

  @IsNumber()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  peakEnd!: number;
}
