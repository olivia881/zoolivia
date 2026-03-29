import { Capacitor } from "@capacitor/core";

export type ReminderState = {
  enabled: boolean;
  voiceEnabled: boolean;
  hour: number;
  minute: number;
};
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { resolveDayNote, type AppSettings, type WeekdayIndex } from "./scheduleLogic";

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

/** Prossima occorrenza dell'orario locale hour:minute a partire da strictly dopo `from` (o uguale se includeEqual). */
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

export function buildTomorrowReminderCopy(
  fireAt: Date,
  schedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): { title: string; body: string; voiceText: string } {
  const tomorrow = addCalendarDays(fireAt, 1);
  const note = resolveDayNote(tomorrow, schedule, settings);
  const weekday = new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(
    tomorrow
  );
  const timeSpoken = formatHourMinuteSpoken(
    fireAt.getHours(),
    fireAt.getMinutes()
  );
  const title = "Promemoria rifiuti";
  const body = `Domani (${weekday}): ${note}`;
  const voiceText = `${timeSpoken} Ricorda: domani, ${weekday}, porta fuori: ${note}`;
  return { title, body, voiceText };
}

export function buildDailyReminderSlots(
  now: Date,
  hour: number,
  minute: number,
  schedule: Record<WeekdayIndex, string>,
  settings: AppSettings
): { id: number; at: Date; title: string; body: string; voiceText: string }[] {
  const out: { id: number; at: Date; title: string; body: string; voiceText: string }[] =
    [];
  let cursor = new Date(now);
  for (let i = 0; i < DAILY_REMINDER_COUNT; i++) {
    const at = nextDailyFire(cursor, hour, minute);
    const { title, body, voiceText } = buildTomorrowReminderCopy(
      at,
      schedule,
      settings
    );
    out.push({
      id: DAILY_REMINDER_BASE_ID + i,
      at,
      title,
      body,
      voiceText,
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
