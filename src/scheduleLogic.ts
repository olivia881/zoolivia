import { mondayFirstIndex, type WeekdayIndex } from "./weekdays";

export type { WeekdayIndex };

const SETTINGS_KEY = "promemoria-rifiuti-settings-v3";
const SETTINGS_KEY_LEGACY = "promemoria-rifiuti-settings-v2";

export type AlternateWeekConfig = {
  enabled: boolean;
  weekday: WeekdayIndex;
  referenceDate: string;
  weekAText: string;
  weekBText: string;
};

export type AppSettings = {
  municipality: string;
  /** Più regole: es. un venerdì alternato + un altro giorno alternato */
  alternates: AlternateWeekConfig[];
};

export const emptyAlternate = (): AlternateWeekConfig => ({
  enabled: false,
  weekday: 4,
  referenceDate: "",
  weekAText: "Vetro",
  weekBText: "Indifferenziata",
});

export const DEFAULT_ALTERNATES: AlternateWeekConfig[] = [
  {
    enabled: false,
    weekday: 4,
    referenceDate: "",
    weekAText: "Vetro",
    weekBText: "Indifferenziata",
  },
];

function clampWeekday(n: unknown): WeekdayIndex {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0 || x > 6) return 4;
  return x as WeekdayIndex;
}

function migrateLegacy(raw: string): AppSettings | null {
  try {
    const p = JSON.parse(raw) as {
      municipality?: string;
      alternate?: Partial<AlternateWeekConfig>;
    };
    const alt = p.alternate;
    if (!alt) return null;
    const one: AlternateWeekConfig = {
      enabled: Boolean(alt.enabled),
      weekday: clampWeekday(alt.weekday),
      referenceDate:
        typeof alt.referenceDate === "string" ? alt.referenceDate : "",
      weekAText:
        typeof alt.weekAText === "string" ? alt.weekAText : "Vetro",
      weekBText:
        typeof alt.weekBText === "string" ? alt.weekBText : "Indifferenziata",
    };
    return {
      municipality: typeof p.municipality === "string" ? p.municipality : "",
      alternates: [one],
    };
  } catch {
    return null;
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(SETTINGS_KEY_LEGACY);
      if (legacy) {
        const m = migrateLegacy(legacy);
        if (m) {
          saveSettings(m);
          return m;
        }
      }
      return { municipality: "", alternates: [...DEFAULT_ALTERNATES] };
    }
    const p = JSON.parse(raw) as Partial<AppSettings>;
    const alts = Array.isArray(p.alternates) ? p.alternates : [];
    const normalized: AlternateWeekConfig[] =
      alts.length === 0
        ? [...DEFAULT_ALTERNATES]
        : alts.map((alt) => ({
            enabled: Boolean(alt.enabled),
            weekday: clampWeekday(alt.weekday),
            referenceDate:
              typeof alt.referenceDate === "string" ? alt.referenceDate : "",
            weekAText:
              typeof alt.weekAText === "string"
                ? alt.weekAText
                : "Vetro",
            weekBText:
              typeof alt.weekBText === "string"
                ? alt.weekBText
                : "Indifferenziata",
          }));
    return {
      municipality: typeof p.municipality === "string" ? p.municipality : "",
      alternates: normalized,
    };
  } catch {
    return { municipality: "", alternates: [...DEFAULT_ALTERNATES] };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

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

function alternateForDate(
  date: Date,
  settings: AppSettings
): AlternateWeekConfig | null {
  const idx = mondayFirstIndex(date);
  for (const a of settings.alternates) {
    if (!a.enabled || !a.referenceDate.trim()) continue;
    if (a.weekday !== idx) continue;
    const anchor = parseLocalYmd(a.referenceDate);
    if (!anchor || mondayFirstIndex(anchor) !== a.weekday) continue;
    return a;
  }
  return null;
}

export function resolveDayNote(
  date: Date,
  baseSchedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): string {
  const idx = mondayFirstIndex(date);
  const alt = alternateForDate(date, settings);
  if (alt) {
    const p = alternateParity(date, alt.referenceDate, alt.weekday);
    return p === 0 ? alt.weekAText : alt.weekBText;
  }
  return baseSchedule[idx];
}

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
const ALT_NOTIF_PER_RULE = 26;
const MAX_ALT_RULES = 8;

export function buildAllAlternateOneShotSlots(
  now: Date,
  hour: number,
  minute: number,
  baseSchedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): { id: number; at: Date; body: string }[] {
  const out: { id: number; at: Date; body: string }[] = [];
  let slotIndex = 0;

  for (let r = 0; r < settings.alternates.length && r < MAX_ALT_RULES; r++) {
    const a = settings.alternates[r];
    if (!a.enabled || !a.referenceDate.trim()) continue;
    const anchor = parseLocalYmd(a.referenceDate);
    if (!anchor || mondayFirstIndex(anchor) !== a.weekday) continue;

    let cursor = new Date(now);
    for (let i = 0; i < ALT_NOTIF_PER_RULE; i++) {
      const at = nextWeeklyAt(a.weekday, hour, minute, cursor);
      const dayOnly = new Date(at.getFullYear(), at.getMonth(), at.getDate());
      const body = resolveDayNote(dayOnly, baseSchedule, settings);
      out.push({
        id: ALT_NOTIF_BASE_ID + slotIndex,
        at,
        body,
      });
      slotIndex += 1;
      if (slotIndex >= 90) return out;
      cursor = new Date(at.getTime() + 1);
    }
  }

  return out;
}

export function alternateWeekdaySet(settings: AppSettings): Set<WeekdayIndex> {
  const s = new Set<WeekdayIndex>();
  for (const a of settings.alternates) {
    if (!a.enabled || !a.referenceDate.trim()) continue;
    const d = parseLocalYmd(a.referenceDate);
    if (!d || mondayFirstIndex(d) !== a.weekday) continue;
    s.add(a.weekday);
  }
  return s;
}

export const ALT_NOTIFICATION_IDS = Array.from({ length: 90 }, (_, i) => ALT_NOTIF_BASE_ID + i);
