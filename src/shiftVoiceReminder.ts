import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import {
  hasDayEntryContent,
  toYmd,
  type DayServiceEntry,
} from "./dayLogModel";
import {
  resolveDayShift,
  shiftTimeLabels,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import { WEEKDAYS } from "./weekdays";

export type ReminderState = {
  enabled: boolean;
  voiceEnabled: boolean;
  hour: number;
  minute: number;
};

export const DAILY_REMINDER_BASE_ID = 300;
export const DAILY_REMINDER_COUNT = 90;

export const DAILY_REMINDER_IDS = Array.from(
  { length: DAILY_REMINDER_COUNT },
  (_, i) => DAILY_REMINDER_BASE_ID + i
);

function addCalendarDays(d: Date, days: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

function nextDailyFire(from: Date, hour: number, minute: number): Date {
  const t = new Date(from);
  t.setHours(hour, minute, 0, 0);
  if (t.getTime() <= from.getTime()) {
    t.setDate(t.getDate() + 1);
  }
  return t;
}

const HOUR_WORDS: Record<number, string> = {
  0: "zero",
  1: "l'una",
  2: "due",
  3: "tre",
  4: "quattro",
  5: "cinque",
  6: "sei",
  7: "sette",
  8: "otto",
  9: "nove",
  10: "dieci",
  11: "undici",
  12: "dodici",
  13: "tredici",
  14: "quattordici",
  15: "quindici",
  16: "sedici",
  17: "diciassette",
  18: "diciotto",
  19: "diciannove",
  20: "venti",
  21: "ventuno",
  22: "ventidue",
  23: "ventitré",
};

function formatHourMinuteSpoken(hour: number, minute: number): string {
  const h = HOUR_WORDS[hour] ?? String(hour);
  if (minute === 0) {
    return hour === 1 ? "È l'una in punto." : `Sono le ${h}.`;
  }
  const mPart =
    minute === 15
      ? "e un quarto"
      : minute === 30
        ? "e mezza"
        : minute === 45
          ? "meno un quarto"
          : `e ${minute} minuti`;
  return hour === 1 ? `È l'una ${mPart}.` : `Sono le ${h} ${mPart}.`;
}

function describeTomorrowShift(
  tomorrow: Date,
  settings: ShiftAppSettings,
  dayLog: DayServiceEntry | undefined
): { bodyLine: string; voiceText: string } {
  const weekdayLong = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
  }).format(tomorrow);

  if (dayLog && hasDayEntryContent(dayLog)) {
    const parts: string[] = [];
    if (dayLog.mattina.trim()) parts.push(`Mattina: ${dayLog.mattina.trim()}`);
    if (dayLog.pomeriggioRientro.trim())
      parts.push(`Pomeriggio: ${dayLog.pomeriggioRientro.trim()}`);
    if (dayLog.straordinarioOre.trim())
      parts.push(`Straordinario: ${dayLog.straordinarioOre.trim()} h`);
    const dow = tomorrow.getDay();
    const isWe = dow === 0 || dow === 6;
    const hasTurno =
      dayLog.mattina.trim() ||
      dayLog.pomeriggioRientro.trim() ||
      dayLog.straordinarioOre.trim();
    if (isWe && !hasTurno) {
      parts.push("Sabato o domenica: compila i turni se lavori");
    }
    if (dayLog.festivo) parts.push("Festivo");
    if (dayLog.congedoOrdinario) parts.push("C.O.");
    if (dayLog.congedoStraordMalattia) parts.push("C.S. malattia");
    if (dayLog.congedoStraordFamiglia) parts.push("C.S. famiglia");
    if (dayLog.pnl) parts.push("PNL");
    if (dayLog.congedoParentale) parts.push("C.P.");
    if (dayLog.buonoPasto) parts.push("Buono pasto");
    const line = parts.length ? parts.join(". ") : "Annotazioni del giorno.";
    return {
      bodyLine: line,
      voiceText: `Domani, ${weekdayLong}. ${line}`,
    };
  }

  const shift = resolveDayShift(tomorrow, settings);

  if (!shift) {
    return {
      bodyLine: "Non è un giorno lavorativo nel calendario turni.",
      voiceText: `Domani, ${weekdayLong}, non è un giorno lavorativo previsto.`,
    };
  }

  const { morning, afternoon } = shift.labels;
  const mLabel = WEEKDAYS[shift.morningWeekday];

  if (
    shift.afternoonWeekday !== null &&
    shift.afternoonWeekday === shift.morningWeekday
  ) {
    const line = `Mattina ${morning}, pomeriggio stesso giorno ${afternoon}.`;
    return {
      bodyLine: `${mLabel}: ${line}`,
      voiceText: `Domani, ${weekdayLong}, ${line}`,
    };
  }

  if (shift.afternoonWeekday !== null) {
    const aLabel = WEEKDAYS[shift.afternoonWeekday];
    const line = `Mattina ${morning}; rientro pomeridiano ${aLabel} ${afternoon}.`;
    return {
      bodyLine: `${mLabel}: ${line}`,
      voiceText: `Domani, ${weekdayLong}, ${line}`,
    };
  }

  const line = `Solo mattina ${morning} (nessun abbinamento pomeridiano).`;
  return {
    bodyLine: `${mLabel}: ${line}`,
    voiceText: `Domani, ${weekdayLong}, ${line}`,
  };
}

export function buildTomorrowShiftReminderCopy(
  fireAt: Date,
  settings: ShiftAppSettings,
  dayLogs: Record<string, DayServiceEntry>
): { title: string; body: string; voiceText: string } {
  const tomorrow = addCalendarDays(fireAt, 1);
  const timeSpoken = formatHourMinuteSpoken(
    fireAt.getHours(),
    fireAt.getMinutes()
  );
  const weekdayLong = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
  }).format(tomorrow);
  const ymd = toYmd(tomorrow);
  const { bodyLine, voiceText } = describeTomorrowShift(
    tomorrow,
    settings,
    dayLogs[ymd]
  );
  const title = "Turni di servizio";
  return {
    title,
    body: `Domani (${weekdayLong}): ${bodyLine}`,
    voiceText: `${timeSpoken} ${voiceText}`,
  };
}

export function buildDailyShiftReminderSlots(
  now: Date,
  hour: number,
  minute: number,
  settings: ShiftAppSettings,
  dayLogs: Record<string, DayServiceEntry>
): { id: number; at: Date; title: string; body: string; voiceText: string }[] {
  const out: {
    id: number;
    at: Date;
    title: string;
    body: string;
    voiceText: string;
  }[] = [];
  let cursor = new Date(now);
  for (let i = 0; i < DAILY_REMINDER_COUNT; i++) {
    const at = nextDailyFire(cursor, hour, minute);
    const copy = buildTomorrowShiftReminderCopy(at, settings, dayLogs);
    out.push({
      id: DAILY_REMINDER_BASE_ID + i,
      at,
      title: copy.title,
      body: copy.body,
      voiceText: copy.voiceText,
    });
    cursor = new Date(at.getTime() + 1);
  }
  return out;
}

export async function speakReminderText(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.speak({
        text,
        lang: "it-IT",
        rate: 0.95,
        pitch: 1,
        volume: 1,
      });
    } catch {
      /* ignore */
    }
    return;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }
}

/** Testo breve per cella calendario */
export function shiftCellSummary(date: Date, settings: ShiftAppSettings): string {
  const s = resolveDayShift(date, settings);
  if (!s) return "";
  const { morning } = shiftTimeLabels(settings.timeVariant);
  const mShort = WEEKDAYS[s.morningWeekday].slice(0, 3);
  if (s.afternoonWeekday === null) return `${mShort} ${morning}`;
  const aShort = WEEKDAYS[s.afternoonWeekday].slice(0, 3);
  if (s.afternoonWeekday === s.morningWeekday) {
    return `${mShort} → pomeriggio`;
  }
  return `${mShort} → ${aShort}`;
}
