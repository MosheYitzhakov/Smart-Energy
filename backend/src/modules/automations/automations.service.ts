import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule } from './automation-rule.entity';
import { CreateAutomationDto } from './dto/create-automation.dto';
import type { AutomationCondition, AutomationAction } from '../../domain/contracts';

const MAX_RULES_PER_USER = 50;

@Injectable()
export class AutomationsService {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly repo: Repository<AutomationRule>,
  ) {}

  async list(userId: string): Promise<AutomationRule[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async create(userId: string, dto: CreateAutomationDto): Promise<AutomationRule> {
    const count = await this.repo.count({ where: { userId } });
    if (count >= MAX_RULES_PER_USER) {
      throw new ForbiddenException(`Maximum ${MAX_RULES_PER_USER} automation rules per user`);
    }
    return this.repo.save(
      this.repo.create({
        userId,
        deviceId: dto.deviceId ?? null,
        name: dto.name,
        condition: dto.condition as AutomationCondition,
        action: dto.action as AutomationAction,
      }),
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException();
    if (rule.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(rule);
  }

  async getActiveRulesForUser(userId: string): Promise<AutomationRule[]> {
    return this.repo.find({ where: { userId, isActive: true } });
  }
}
