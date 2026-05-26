export interface Translations {
  lang: 'he' | 'en';
  dir: 'rtl' | 'ltr';
  login: {
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    errorMsg: string;
    footer: string;
  };
  dashboard: {
    currentLoad: string;
    dailyCost: string;
    today: string;
    alerts: string;
    noAlerts: string;
    liveChart: string;
    reconnecting: string;
    warning: string;
    critical: string;
  };
  devices: {
    title: string;
    addBtn: string;
    emptyTitle: string;
    emptyAction: string;
    formTitle: string;
    name: string;
    nameRequired: string;
    type: string;
    power: string;
    save: string;
    cancel: string;
    loadError: string;
    createError: string;
    deleteError: string;
  };
  nav: {
    devices: string;
    settings: string;
    automations: string;
    logout: string;
    back: string;
  };
  settings: {
    title: string;
    tariffTitle: string;
    peakRate: string;
    offPeakRate: string;
    peakStart: string;
    peakEnd: string;
    save: string;
    saved: string;
  };
  automations: {
    title: string;
    addBtn: string;
    empty: string;
    name: string;
    condition: string;
    conditionWatt: string;
    conditionTime: string;
    device: string;
    allDevices: string;
    threshold: string;
    operator: string;
    gt: string;
    lt: string;
    startHour: string;
    endHour: string;
    action: string;
    actionNotify: string;
    actionLog: string;
    message: string;
    logLevel: string;
    save: string;
    cancel: string;
    deleteConfirm: string;
  };
  ai: {
    title: string;
    insightTitle: string;
    insightEmpty: string;
    stale: string;
    refresh: string;
    chatPlaceholder: string;
    send: string;
    thinking: string;
  };
}

export const HE: Translations = {
  lang: 'he',
  dir: 'rtl',
  login: {
    subtitle: 'ניהול אנרגיה ביתית מבוסס AI',
    email: 'כתובת דוא"ל',
    password: 'סיסמה',
    submit: 'כניסה',
    emailRequired: 'נדרשת כתובת דוא"ל',
    emailInvalid: 'כתובת דוא"ל לא תקינה',
    passwordRequired: 'נדרשת סיסמה',
    errorMsg: 'שם משתמש או סיסמה שגויים',
    footer: 'SmartEnergy © 2026 — מאובטח ופרטי',
  },
  dashboard: {
    currentLoad: 'עומס נוכחי',
    dailyCost: 'עלות יומית',
    today: 'היום (הערכה)',
    alerts: 'התראות',
    noAlerts: 'אין התראות פעילות',
    liveChart: 'צריכת חשמל בזמן אמת — 30 דקות אחרונות',
    reconnecting: 'מתחבר מחדש לזרם חי...',
    warning: 'אזהרה',
    critical: 'קריטי',
  },
  devices: {
    title: 'מכשירים',
    addBtn: 'הוסף מכשיר',
    emptyTitle: 'אין מכשירים עדיין. הוסף את המכשיר הראשון.',
    emptyAction: 'הוסף מכשיר',
    formTitle: 'מכשיר חדש',
    name: 'שם',
    nameRequired: 'שם הוא שדה חובה',
    type: 'סוג',
    power: 'הספק (וואט)',
    save: 'שמור',
    cancel: 'ביטול',
    loadError: 'שגיאה בטעינת המכשירים',
    createError: 'שגיאה ביצירת המכשיר',
    deleteError: 'שגיאה במחיקת המכשיר',
  },
  nav: {
    devices: 'מכשירים',
    settings: 'הגדרות',
    automations: 'אוטומציות',
    logout: 'התנתק',
    back: 'חזור',
  },
  settings: {
    title: 'הגדרות תעריף',
    tariffTitle: 'תעריף חח"י (₪/kWh)',
    peakRate: 'תעריף שיא',
    offPeakRate: 'תעריף רגיל',
    peakStart: 'תחילת שיא (שעה)',
    peakEnd: 'סיום שיא (שעה)',
    save: 'שמור',
    saved: 'נשמר בהצלחה',
  },
  automations: {
    title: 'אוטומציות',
    addBtn: 'הוסף כלל',
    empty: 'אין כללים פעילים',
    name: 'שם הכלל',
    condition: 'תנאי',
    conditionWatt: 'סף וואט',
    conditionTime: 'חלון זמן',
    device: 'מכשיר',
    allDevices: 'כל המכשירים',
    threshold: 'ערך (W)',
    operator: 'אופרטור',
    gt: 'גדול מ-',
    lt: 'קטן מ-',
    startHour: 'שעת התחלה',
    endHour: 'שעת סיום',
    action: 'פעולה',
    actionNotify: 'התראה',
    actionLog: 'לוג',
    message: 'הודעה',
    logLevel: 'רמת לוג',
    save: 'שמור',
    cancel: 'ביטול',
    deleteConfirm: 'למחוק כלל זה?',
  },
  ai: {
    title: 'עוזר AI',
    insightTitle: 'תובנת AI',
    insightEmpty: 'לחץ על רענון לקבלת ניתוח',
    stale: 'מידע ישן',
    refresh: 'רענן',
    chatPlaceholder: 'שאל שאלה על צריכת החשמל שלך...',
    send: 'שלח',
    thinking: 'חושב...',
  },
};

export const EN: Translations = {
  lang: 'en',
  dir: 'ltr',
  login: {
    subtitle: 'AI-powered home energy management',
    email: 'Email',
    password: 'Password',
    submit: 'Sign In',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    passwordRequired: 'Password is required',
    errorMsg: 'Invalid email or password',
    footer: 'SmartEnergy © 2026 — Secure & Private',
  },
  dashboard: {
    currentLoad: 'Current Load',
    dailyCost: 'Daily Cost',
    today: 'today (est.)',
    alerts: 'Alerts',
    noAlerts: 'No active alerts',
    liveChart: 'Live Energy (last 30 min)',
    reconnecting: 'Reconnecting to live feed...',
    warning: 'Warning',
    critical: 'Critical',
  },
  devices: {
    title: 'Devices',
    addBtn: 'Add Device',
    emptyTitle: 'No devices yet. Add your first device.',
    emptyAction: 'Add Device',
    formTitle: 'New Device',
    name: 'Name',
    nameRequired: 'Name is required',
    type: 'Type',
    power: 'Power (Watts)',
    save: 'Save',
    cancel: 'Cancel',
    loadError: 'Failed to load devices',
    createError: 'Failed to create device',
    deleteError: 'Failed to delete device',
  },
  nav: {
    devices: 'Devices',
    settings: 'Settings',
    automations: 'Automations',
    logout: 'Logout',
    back: 'Back',
  },
  settings: {
    title: 'Tariff Settings',
    tariffTitle: 'IEC Tariff (₪/kWh)',
    peakRate: 'Peak Rate',
    offPeakRate: 'Off-Peak Rate',
    peakStart: 'Peak Start (hour)',
    peakEnd: 'Peak End (hour)',
    save: 'Save',
    saved: 'Saved successfully',
  },
  automations: {
    title: 'Automations',
    addBtn: 'Add Rule',
    empty: 'No active rules',
    name: 'Rule Name',
    condition: 'Condition',
    conditionWatt: 'Watt Threshold',
    conditionTime: 'Time Window',
    device: 'Device',
    allDevices: 'All Devices',
    threshold: 'Value (W)',
    operator: 'Operator',
    gt: 'Greater than',
    lt: 'Less than',
    startHour: 'Start Hour',
    endHour: 'End Hour',
    action: 'Action',
    actionNotify: 'Notify',
    actionLog: 'Log',
    message: 'Message',
    logLevel: 'Log Level',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Delete this rule?',
  },
  ai: {
    title: 'AI Assistant',
    insightTitle: 'AI Insight',
    insightEmpty: 'Click refresh to get an analysis',
    stale: 'Stale data',
    refresh: 'Refresh',
    chatPlaceholder: 'Ask about your energy usage...',
    send: 'Send',
    thinking: 'Thinking...',
  },
};
