import { mondayFirstIndex, type WeekdayIndex } from "./weekdays";

export type { WeekdayIndex };

/**
 * Fasce per turno a scalare e pulsante «Applica».
 * `split7` = 7–13 e 13:30–16:30; `13to19` … `15to21` = un solo blocco (stesso su incrocio).
 */
export type ShiftTimeVariant =
  | "early"
  | "late"
  | "split7"
  | "13to19"
  | "14to20"
  | "15to21";

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

const ALLOWED_VARIANTS: ShiftTimeVariant[] = [
  "early",
  "late",
  "split7",
  "13to19",
  "14to20",
  "15to21",
];

export function parseTimeVariant(v: unknown): ShiftTimeVariant {
  return ALLOWED_VARIANTS.includes(v as ShiftTimeVariant)
    ? (v as ShiftTimeVariant)
    : "early";
}

function migrateFromV1(raw: string): ShiftAppSettings | null {
  try {
    const p = JSON.parse(raw) as Partial<ShiftAppSettings>;
    const timeVariant = parseTimeVariant(p.timeVariant);
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
    const timeVariant = parseTimeVariant(p.timeVariant);
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

/** Una sola coppia incrociata per settimana (5 settimane, poi si ripete). */
export const CYCLE_PAIR_LABELS = [
  "Lun↔Mer",
  "Mar↔Gio",
  "Mer↔Ven",
  "Lun↔Gio",
  "Mar↔Ven",
] as const;

/**
 * Indice 0..4 nel ciclo a scalare (settimana = una coppia).
 */
export function weekIndexInCycle(date: Date, anchorMondayYmd: string): number {
  const anchor = parseLocalYmd(anchorMondayYmd);
  if (!anchor) return 0;
  if (mondayFirstIndex(anchor) !== 0) return 0;
  const w = weeksBetweenMonday(date, anchor);
  return ((w % 5) + 5) % 5;
}

/**
 * Per ogni settimana del ciclo: un solo incrocio (mattina su un giorno, seconda fascia sull’altro).
 */
const AFTERNOON_PAIR: Record<
  number,
  Partial<Record<WeekdayIndex, WeekdayIndex>>
> = {
  0: { 0: 2, 2: 0 },
  1: { 1: 3, 3: 1 },
  2: { 2: 4, 4: 2 },
  3: { 0: 3, 3: 0 },
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
  switch (variant) {
    case "late":
      return { morning: "9:00 – 15:00", afternoon: "15:30 – 18:30" };
    case "split7":
      return { morning: "7:00 – 13:00", afternoon: "13:30 – 16:30" };
    case "13to19":
      return { morning: "13:00 – 19:00", afternoon: "13:00 – 19:00" };
    case "14to20":
      return { morning: "14:00 – 20:00", afternoon: "14:00 – 20:00" };
    case "15to21":
      return { morning: "15:00 – 21:00", afternoon: "15:00 – 21:00" };
    case "early":
    default:
      return { morning: "8:00 – 14:00", afternoon: "14:30 – 17:30" };
  }
}

/** Es. 9:00-15:00 → 9.00/15.00 (anche più intervalli nella stringa). */
export function formatTimeRangeForCalendar(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t.replace(
    /(\d{1,2})\s*[.:]\s*(\d{2})\s*-\s*(\d{1,2})\s*[.:]\s*(\d{2})/g,
    "$1.$2/$3.$4"
  );
}

export type DayShiftInfo = {
  isWorkday: boolean;
  morningWeekday: WeekdayIndex;
  weekInCycle: number;
  afternoonWeekday: WeekdayIndex | null;
  labels: { morning: string; afternoon: string };
};

/** Per compilazione manuale / scheda: stessa logica di applyScalingShiftToWeek. */
export function plannedBandsForDayFields(
  planned: DayShiftInfo,
  variant: ShiftTimeVariant
): { mattina: string; pomeriggioRientro: string } {
  const lab = shiftTimeLabels(variant);
  const norm = (s: string) =>
    s.replace(/\s/g, "").replace(/–/g, "-").replace(/—/g, "-");
  const m = norm(lab.morning);
  const p = norm(lab.afternoon);
  const wk = planned.weekInCycle;
  const wd = planned.morningWeekday;
  let hasSecond = false;
  for (let wdE = 0 as WeekdayIndex; wdE <= 4; wdE++) {
    if (afternoonReturnWeekday(wk, wdE) === wd) {
      hasSecond = true;
      break;
    }
  }
  if (!hasSecond) return { mattina: m, pomeriggioRientro: "" };
  return { mattina: m, pomeriggioRientro: m === p ? "" : p };
}

export function plannedShiftCalendarText(
  date: Date,
  settings: ShiftAppSettings
): string {
  const info = resolveDayShift(date, settings);
  if (!info) return "";
  const { mattina, pomeriggioRientro } = plannedBandsForDayFields(
    info,
    settings.timeVariant
  );
  const line1 = formatTimeRangeForCalendar(mattina);
  const line2 = formatTimeRangeForCalendar(pomeriggioRientro);
  if (!line2 || line2 === line1) return line1;
  return `${line1}\n${line2}`;
}

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
