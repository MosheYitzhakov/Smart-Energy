import { MockAIProvider } from '../providers/mock-ai.provider';
import type { AIInput } from '../../../domain/contracts';

const emptyInput: AIInput = { anomalies: [], dailySummary: [], patterns: [], forecasts: [] };

describe('MockAIProvider', () => {
  const provider = new MockAIProvider();

  it('explain returns a non-empty explanation', async () => {
    const result = await provider.explain(emptyInput);
    expect(result.explanation.length).toBeGreaterThan(10);
  });

  it('explain returns stale: false', async () => {
    const result = await provider.explain(emptyInput);
    expect(result.stale).toBe(false);
  });

  it('explain returns a valid ISO timestamp', async () => {
    const result = await provider.explain(emptyInput);
    expect(() => new Date(result.generatedAt)).not.toThrow();
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('chat returns a non-empty string', async () => {
    const answer = await provider.chat([], 'מה הצריכה שלי?');
    expect(typeof answer).toBe('string');
    expect(answer.length).toBeGreaterThan(0);
  });

  it('explain is repeatable with different generatedAt timestamps', async () => {
    const a = await provider.explain(emptyInput);
    await new Promise((r) => setTimeout(r, 5));
    const b = await provider.explain(emptyInput);
    expect(a.explanation).toBe(b.explanation);
    expect(a.generatedAt).not.toBe(b.generatedAt);
  });
});
