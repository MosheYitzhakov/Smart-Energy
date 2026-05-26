import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from '../../devices/device.entity';

@Entity('energy_hourly')
export class EnergyHourly {
  @PrimaryColumn()
  deviceId!: string;

  @PrimaryColumn({ type: 'varchar' })
  hour!: string; // ISO 8601 truncated to hour: "2026-05-20T14:00:00.000Z"

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device!: Device;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  avgWatts!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxWatts!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  totalKwh!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  estimatedCost!: number;
}
