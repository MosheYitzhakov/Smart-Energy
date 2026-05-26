import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import type { AutomationCondition, AutomationAction } from '../../domain/contracts';

@Entity('automation_rules')
export class AutomationRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true, type: 'uuid' })
  deviceId!: string | null;

  @Column()
  name!: string;

  @Column({ type: 'jsonb' })
  condition!: AutomationCondition;

  @Column({ type: 'jsonb' })
  action!: AutomationAction;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
