import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AIService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('insight')
  getInsight(@CurrentUser('id') userId: string) {
    return this.aiService.getInsight(userId);
  }

  @Post('chat')
  chat(@CurrentUser('id') userId: string, @Body() dto: ChatDto) {
    return this.aiService.chat(userId, dto.history, dto.question).then((answer) => ({ answer }));
  }
}
