import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Device } from '../../devices/device.entity';

@Entity('energy_readings')
@Index(['deviceId', 'timestamp'], { unique: true })
@Index(['deviceId', 'timestamp'])
export class EnergyReading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deviceId!: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device!: Device;

  @Column({ type: 'bigint' })
  timestamp!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  watts!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  kwhTotal!: number;

  @Column({ type: 'enum', enum: ['simulation', 'real'], default: 'simulation' })
  source!: 'simulation' | 'real';
}
