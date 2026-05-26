import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';

@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.automationsService.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAutomationDto) {
    return this.automationsService.create(userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.automationsService.remove(userId, id);
  }
}
