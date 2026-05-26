import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from '../../devices/device.entity';

@Entity('energy_daily')
export class EnergyDaily {
  @PrimaryColumn()
  deviceId!: string;

  @PrimaryColumn({ type: 'varchar' })
  date!: string; // YYYY-MM-DD

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device!: Device;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  totalKwh!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  peakWatts!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  totalCost!: number;
}
