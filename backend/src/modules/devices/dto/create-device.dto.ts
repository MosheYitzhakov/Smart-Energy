import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '../device.entity';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Living Room AC' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: DeviceType })
  @IsEnum(DeviceType)
  type!: DeviceType;

  @ApiProperty({ example: 2400, description: 'Rated power in watts' })
  @IsNumber()
  @Min(1)
  powerWatts!: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
