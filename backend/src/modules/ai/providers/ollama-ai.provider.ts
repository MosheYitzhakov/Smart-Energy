import type { AIProvider } from '../ai-provider.interface';
import type { AIInput, AIOutput, ChatMessage } from '../../../domain/contracts';

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

export class OllamaAIProvider implements AIProvider {
  constructor(private readonly baseUrl: string, private readonly model = 'llama3.1:8b') {}

  async explain(input: AIInput): Promise<AIOutput> {
    const anomalySummary = input.anomalies.length
      ? `זוהו ${input.anomalies.length} אנומליות. החמורה ביותר: ${input.anomalies[0].watts.toFixed(0)}W (z-score: ${input.anomalies[0].zScore.toFixed(1)}).`
      : 'לא זוהו אנומליות.';

    const dailySummary = input.dailySummary.length
      ? `סה"כ ${input.dailySummary.reduce((s, d) => s + d.totalKwh, 0).toFixed(2)} קוט"ש ב-${input.dailySummary.length} ימים אחרונים.`
      : 'אין נתוני היסטוריה.';

    const prompt =
      `אתה מנתח צריכת חשמל ביתית. ענה בעברית, בצורה ידידותית וקצרה (עד 3 משפטים לכל חלק).\n\n` +
      `נתונים: ${anomalySummary} ${dailySummary}\n\n` +
      `ספק: 1) הסבר על הנתונים 2) המלצה לחיסכון.\n` +
      `פרמט: הסבר: [טקסט]\nהמלצה: [טקסט]`;

    const raw = await this.generate(prompt);
    const parts = raw.split(/המלצה:/i);
    const explanation = parts[0].replace(/הסבר:/i, '').trim();
    const recommendation = parts[1]?.trim() ?? '';

    return {
      explanation: explanation || raw,
      recommendation,
      stale: false,
      generatedAt: new Date().toISOString(),
    };
  }

  async chat(history: ChatMessage[], question: string): Promise<string> {
    const messages = [
      {
        role: 'system' as const,
        content:
          'אתה עוזר חכם לניהול אנרגיה ביתית. עונה בעברית בצורה קצרה וממוקדת. ' +
          'אתה יכול לענות על שאלות לגבי חשמל, תעריפים וחיסכון באנרגיה.',
      },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: question },
    ];

    const body = JSON.stringify({ model: this.model, messages, stream: false });
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) throw new Error(`Ollama chat error: ${res.status}`);
    const data = (await res.json()) as OllamaChatResponse;
    return data.message.content;
  }

  private async generate(prompt: string): Promise<string> {
    const body = JSON.stringify({ model: this.model, prompt, stream: false });
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) throw new Error(`Ollama generate error: ${res.status}`);
    const data = (await res.json()) as OllamaGenerateResponse;
    return data.response;
  }
}
