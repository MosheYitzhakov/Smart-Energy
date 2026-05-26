import type { AIProvider } from '../ai-provider.interface';
import type { AIOutput } from '../../../domain/contracts';

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
  explain(): Promise<AIOutput> {
    return Promise.resolve({
      ...EXPLAIN_FIXTURE,
      generatedAt: new Date().toISOString(),
    });
  }

  chat(): Promise<string> {
    const response =
      CHAT_RESPONSES[Math.floor(Math.random() * CHAT_RESPONSES.length)] ?? '';
    return Promise.resolve(response);
  }
}
