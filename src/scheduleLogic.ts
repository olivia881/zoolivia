import { mondayFirstIndex, type WeekdayIndex } from "./weekdays";

export type { WeekdayIndex };

const SETTINGS_KEY = "promemoria-rifiuti-settings-v2";

export type AlternateWeekConfig = {
  enabled: boolean;
  /** Giorno del ritiro a settimane alternate (lunedì = 0 … domenica = 6) */
  weekday: WeekdayIndex;
  /**
   * Una data (YYYY-MM-DD) che cade quel giorno e che consideri "settimana A"
   * (es. un venerdì in cui passano vetro + indifferenziata).
   */
  referenceDate: string;
  weekAText: string;
  weekBText: string;
};

export type AppSettings = {
  municipality: string;
  alternate: AlternateWeekConfig;
};

export const DEFAULT_ALTERNATE: AlternateWeekConfig = {
  enabled: false,
  weekday: 4,
  referenceDate: "",
  weekAText: "Vetro e indifferenziata",
  weekBText: "Nessun ritiro vetro / indifferenziata (settimana alterna)",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { municipality: "", alternate: { ...DEFAULT_ALTERNATE } };
    }
    const p = JSON.parse(raw) as Partial<AppSettings>;
    const alt = (p.alternate ?? {}) as Partial<AlternateWeekConfig>;
    return {
      municipality: typeof p.municipality === "string" ? p.municipality : "",
      alternate: {
        enabled: Boolean(alt.enabled),
        weekday: clampWeekday(alt.weekday),
        referenceDate:
          typeof alt.referenceDate === "string" ? alt.referenceDate : "",
        weekAText:
          typeof alt.weekAText === "string"
            ? alt.weekAText
            : DEFAULT_ALTERNATE.weekAText,
        weekBText:
          typeof alt.weekBText === "string"
            ? alt.weekBText
            : DEFAULT_ALTERNATE.weekBText,
      },
    };
  } catch {
    return { municipality: "", alternate: { ...DEFAULT_ALTERNATE } };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function clampWeekday(n: unknown): WeekdayIndex {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0 || x > 6) return DEFAULT_ALTERNATE.weekday;
  return x as WeekdayIndex;
}

/** Mezzanotte locale */
export function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Parsing YYYY-MM-DD come data locale */
export function parseLocalYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day)
    return null;
  return d;
}

/**
 * 0 = stessa "settimana A" dell'ancora, 1 = settimana B.
 * L'ancora deve essere un giorno D0; per ogni data D sullo stesso weekday della config,
 * si conta il numero di settimane tra D0 e D.
 */
export function alternateParity(
  date: Date,
  anchorYmd: string,
  expectedWeekday: WeekdayIndex
): 0 | 1 {
  const anchor = parseLocalYmd(anchorYmd);
  if (!anchor) return 0;
  if (mondayFirstIndex(anchor) !== expectedWeekday) return 0;
  if (mondayFirstIndex(date) !== expectedWeekday) return 0;
  const diffDays = Math.round(
    (startOfLocalDay(date) - startOfLocalDay(anchor)) / 86400000
  );
  const weeks = Math.floor(diffDays / 7);
  return ((weeks % 2) + 2) % 2 as 0 | 1;
}

export function resolveDayNote(
  date: Date,
  baseSchedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): string {
  const idx = mondayFirstIndex(date);
  let line = baseSchedule[idx];

  const { alternate } = settings;
  if (
    alternate.enabled &&
    alternate.referenceDate.trim() &&
    idx === alternate.weekday
  ) {
    const p = alternateParity(date, alternate.referenceDate, alternate.weekday);
    line = p === 0 ? alternate.weekAText : alternate.weekBText;
  }

  return line;
}

/** Prossima occorrenza del giorno `dow` alle ore `hour:minute` strettamente dopo `from`. */
export function nextWeeklyAt(
  dow: WeekdayIndex,
  hour: number,
  minute: number,
  from: Date
): Date {
  const at = new Date(from);
  const idx = mondayFirstIndex(at);
  const add = (dow - idx + 7) % 7;
  at.setDate(at.getDate() + add);
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= from.getTime()) {
    at.setDate(at.getDate() + 7);
  }
  return at;
}

const ALT_NOTIF_BASE_ID = 200;
const ALT_NOTIF_COUNT = 26;

export function buildAlternateOneShotSlots(
  now: Date,
  hour: number,
  minute: number,
  baseSchedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): { id: number; at: Date; body: string }[] {
  const { alternate } = settings;
  if (!alternate.enabled || !alternate.referenceDate.trim()) return [];

  const anchor = parseLocalYmd(alternate.referenceDate);
  if (!anchor || mondayFirstIndex(anchor) !== alternate.weekday) return [];

  const out: { id: number; at: Date; body: string }[] = [];
  let cursor = new Date(now);
  for (let i = 0; i < ALT_NOTIF_COUNT; i++) {
    const at = nextWeeklyAt(alternate.weekday, hour, minute, cursor);
    const dayOnly = new Date(at.getFullYear(), at.getMonth(), at.getDate());
    const body = resolveDayNote(dayOnly, baseSchedule, settings);
    out.push({ id: ALT_NOTIF_BASE_ID + i, at, body });
    cursor = new Date(at.getTime() + 1);
  }
  return out;
}

export const ALT_NOTIFICATION_IDS = Array.from(
  { length: ALT_NOTIF_COUNT },
  (_, i) => ALT_NOTIF_BASE_ID + i
);
