import { mondayFirstIndex, type WeekdayIndex } from "./weekdays";

export type { WeekdayIndex };

/** Fascia oraria: anticipata 8–14 / 14:30–17:30 o tardiva 9–15 / 15:30–18:30 */
export type ShiftTimeVariant = "early" | "late";

export type ShiftAppSettings = {
  timeVariant: ShiftTimeVariant;
  /** Lunedì di riferimento per l’inizio del ciclo a 5 settimane (YYYY-MM-DD, deve essere un lunedì) */
  anchorMondayYmd: string;
  /** Intestazione tipo servizio settimanale (es. ufficio / area) */
  officeLine1: string;
  officeLine2: string;
};

const SETTINGS_KEY = "turni-servizio-settings-v2";

const SETTINGS_KEY_LEGACY = "turni-servizio-settings-v1";

export const DEFAULT_SHIFT_SETTINGS: ShiftAppSettings = {
  timeVariant: "early",
  anchorMondayYmd: "",
  officeLine1: "",
  officeLine2: "",
};

function migrateFromV1(raw: string): ShiftAppSettings | null {
  try {
    const p = JSON.parse(raw) as Partial<ShiftAppSettings>;
    const timeVariant =
      p.timeVariant === "late" || p.timeVariant === "early"
        ? p.timeVariant
        : "early";
    let anchorMondayYmd =
      typeof p.anchorMondayYmd === "string" ? p.anchorMondayYmd : "";
    if (!anchorMondayYmd.trim()) anchorMondayYmd = defaultAnchorMondayYmd();
    return {
      timeVariant,
      anchorMondayYmd,
      officeLine1: "",
      officeLine2: "",
    };
  } catch {
    return null;
  }
}

export function loadShiftSettings(): ShiftAppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(SETTINGS_KEY_LEGACY);
      if (legacy) {
        const m = migrateFromV1(legacy);
        if (m) {
          saveShiftSettings(m);
          return m;
        }
      }
      const s = {
        ...DEFAULT_SHIFT_SETTINGS,
        anchorMondayYmd: defaultAnchorMondayYmd(),
      };
      saveShiftSettings(s);
      return s;
    }
    const p = JSON.parse(raw) as Partial<ShiftAppSettings>;
    const timeVariant =
      p.timeVariant === "late" || p.timeVariant === "early"
        ? p.timeVariant
        : "early";
    let anchorMondayYmd =
      typeof p.anchorMondayYmd === "string" ? p.anchorMondayYmd : "";
    if (!anchorMondayYmd.trim()) {
      anchorMondayYmd = defaultAnchorMondayYmd();
    }
    return {
      timeVariant,
      anchorMondayYmd,
      officeLine1:
        typeof p.officeLine1 === "string" ? p.officeLine1 : "",
      officeLine2:
        typeof p.officeLine2 === "string" ? p.officeLine2 : "",
    };
  } catch {
    return {
      ...DEFAULT_SHIFT_SETTINGS,
      anchorMondayYmd: defaultAnchorMondayYmd(),
    };
  }
}

export function saveShiftSettings(s: ShiftAppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
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

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Lunedì della settimana ISO (lun–dom) che contiene `date` */
export function mondayOfWeekContaining(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mi = mondayFirstIndex(d);
  d.setDate(d.getDate() - mi);
  return d;
}

function weeksBetweenMonday(a: Date, b: Date): number {
  const da = startOfLocalDay(mondayOfWeekContaining(a));
  const db = startOfLocalDay(mondayOfWeekContaining(b));
  return Math.round((da - db) / 86400000 / 7);
}

/**
 * Indice 0..4 nel ciclo a scalare:
 * sett.0: lun↔mer, mar↔gio; sett.1: mer↔ven; sett.2: lun↔gio; sett.3: mar↔ven; poi si ripete.
 */
export function weekIndexInCycle(date: Date, anchorMondayYmd: string): number {
  const anchor = parseLocalYmd(anchorMondayYmd);
  if (!anchor) return 0;
  if (mondayFirstIndex(anchor) !== 0) return 0;
  const w = weeksBetweenMonday(date, anchor);
  return ((w % 5) + 5) % 5;
}

/**
 * Per il giorno lavorativo `weekday` (lun=0…ven=4), giorno del rientro pomeridiano in quella settimana di ciclo.
 */
const AFTERNOON_PAIR: Record<
  number,
  Partial<Record<WeekdayIndex, WeekdayIndex>>
> = {
  /** Lun↔Mer, Mar↔Gio */
  0: { 0: 2, 2: 0, 1: 3, 3: 1 },
  /** Mer↔Ven */
  1: { 2: 4, 4: 2 },
  /** Lun↔Gio */
  2: { 0: 3, 3: 0 },
  /** Mar↔Ven */
  3: { 1: 4, 4: 1 },
  /** Quinta settimana: Mar↔Ven (come da ciclo a 5) */
  4: { 1: 4, 4: 1 },
};

export function afternoonReturnWeekday(
  weekInCycle: number,
  morningWeekday: WeekdayIndex
): WeekdayIndex | null {
  if (morningWeekday > 4) return null;
  const map = AFTERNOON_PAIR[weekInCycle];
  if (!map) return null;
  const v = map[morningWeekday];
  return v !== undefined ? v : null;
}

export function shiftTimeLabels(variant: ShiftTimeVariant): {
  morning: string;
  afternoon: string;
} {
  if (variant === "late") {
    return { morning: "9:00 – 15:00", afternoon: "15:30 – 18:30" };
  }
  return { morning: "8:00 – 14:00", afternoon: "14:30 – 17:30" };
}

export type DayShiftInfo = {
  isWorkday: boolean;
  morningWeekday: WeekdayIndex;
  weekInCycle: number;
  afternoonWeekday: WeekdayIndex | null;
  labels: { morning: string; afternoon: string };
};

export function resolveDayShift(
  date: Date,
  settings: ShiftAppSettings
): DayShiftInfo | null {
  const wd = mondayFirstIndex(date);
  if (wd > 4) return null;
  const anchor = settings.anchorMondayYmd.trim();
  if (!anchor) return null;
  const weekInCycle = weekIndexInCycle(date, anchor);
  const afternoon = afternoonReturnWeekday(weekInCycle, wd);
  const labels = shiftTimeLabels(settings.timeVariant);
  return {
    isWorkday: true,
    morningWeekday: wd,
    weekInCycle,
    afternoonWeekday: afternoon,
    labels,
  };
}

export function defaultAnchorMondayYmd(): string {
  return toYmd(mondayOfWeekContaining(new Date()));
}
