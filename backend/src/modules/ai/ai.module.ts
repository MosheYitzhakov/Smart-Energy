import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AI_PROVIDER } from './ai-provider.interface';
import { MockAIProvider } from './providers/mock-ai.provider';
import { OllamaAIProvider } from './providers/ollama-ai.provider';
import { EnergyReading } from '../energy/entities/energy-reading.entity';
import { EnergyDaily } from '../energy/entities/energy-daily.entity';
import { Device } from '../devices/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EnergyReading, EnergyDaily, Device])],
  controllers: [AIController],
  providers: [
    AIService,
    {
      provide: AI_PROVIDER,
      useFactory: (config: ConfigService) => {
        if (config.get<boolean>('AI_MOCK')) return new MockAIProvider();
        const ollamaUrl = config.getOrThrow<string>('OLLAMA_URL');
        return new OllamaAIProvider(ollamaUrl);
      },
      inject: [ConfigService],
    },
  ],
})
export class AIModule {}
