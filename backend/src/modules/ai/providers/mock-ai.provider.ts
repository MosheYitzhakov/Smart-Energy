import type { AIProvider } from '../ai-provider.interface';
import type { AIInput, AIOutput, ChatMessage } from '../../../domain/contracts';

const EXPLAIN_FIXTURE: AIOutput = {
  explanation:
    'ניתוח נתוני האנרגיה מראה דפוס צריכה תקין. ' +
    'זוהו מספר קפיצות צריכה בשעות השיא (17:00–22:00) אשר תואמות שימוש במזגן וכלי מטבח. ' +
    'הצריכה הכוללת היומית נמצאת בטווח הנורמלי לבית ממוצע.',
  recommendation:
    'מומלץ להעביר פעולות אנרגטיות (כביסה, מדיח כלים) לשעות הלילה (22:00–06:00) ' +
    'על מנת לחסוך כ-30% בעלות החשמל.',
  stale: false,
  generatedAt: new Date().toISOString(),
};

const CHAT_RESPONSES = [
  'על פי הנתונים שלך, הצריכה הממוצעת עומדת על כ-1.2 קוט"ש ביום.',
  'מזגן הוא לרוב הצרכן הגדול ביותר — עד 60% מצריכת הקיץ.',
  'בשעות השיא (17:00–22:00) התעריף גבוה יותר. כדאי לדחות שימוש חשמלי כבד.',
  'אין לי מספיק נתונים לתשובה מדויקת. נסה שוב מאוחר יותר.',
];

export class MockAIProvider implements AIProvider {
  async explain(_input: AIInput): Promise<AIOutput> {
    return { ...EXPLAIN_FIXTURE, generatedAt: new Date().toISOString() };
  }

  async chat(_history: ChatMessage[], _question: string): Promise<string> {
    return CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)];
  }
}
