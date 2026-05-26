import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tariff_configs')
export class TariffConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0.65 })
  peakRate!: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, default: 0.48 })
  offPeakRate!: number;

  @Column({ type: 'int', default: 17 })
  peakStart!: number;

  @Column({ type: 'int', default: 22 })
  peakEnd!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
