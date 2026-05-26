import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAutomationDto {
  @IsString() @IsNotEmpty()
  name!: string;

  // Optional — only relevant for watt_threshold conditions
  @IsOptional() @IsUUID()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : value))
  deviceId?: string;

  // Validated in the service — class-validator cannot discriminate union DTOs
  @IsObject()
  condition!: Record<string, unknown>;

  @IsObject()
  action!: Record<string, unknown>;
}
