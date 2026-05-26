import type { AIInput, AIOutput, ChatMessage } from '../../domain/contracts';

export interface AIProvider {
  explain(input: AIInput): Promise<AIOutput>;
  chat(history: ChatMessage[], question: string): Promise<string>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
