import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  Weekday,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import {
  ALT_NOTIFICATION_IDS,
  buildAlternateOneShotSlots,
  type AppSettings,
  resolveDayNote,
  type WeekdayIndex,
} from "./scheduleLogic";
import { mondayFirstIndex } from "./weekdays";

const CHANNEL_ID = "promemoria-rifiuti";
/** ID fissi per lunedì–domenica (Android: int a 32 bit). */
const WEEKLY_IDS = [100, 101, 102, 103, 104, 105, 106] as const;

const WEEKDAY_LABELS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
] as const;

const JS_MONDAY_FIRST_TO_CAPACITOR: Weekday[] = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
  Weekday.Sunday,
];

function sampleDateForWeekday(weekday: WeekdayIndex): Date {
  const d = new Date();
  const idx = mondayFirstIndex(d);
  const add = (weekday - idx + 7) % 7;
  d.setDate(d.getDate() + add);
  d.setHours(12, 0, 0, 0);
  return d;
}

function alternateWeeklyHandled(settings: AppSettings): boolean {
  const a = settings.alternate;
  if (!a.enabled || !a.referenceDate.trim()) return false;
  const anchor = a.referenceDate;
  return /^(\d{4})-(\d{2})-(\d{2})$/.test(anchor.trim());
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

let channelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  if (channelReady) return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Promemoria rifiuti",
    description: "Promemoria giornaliero sulla raccolta rifiuti",
    importance: 4,
    vibration: true,
  });
  channelReady = true;
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  await ensureAndroidChannel();
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === "granted";
}

export async function syncNativeWeeklyReminders(options: {
  enabled: boolean;
  hour: number;
  minute: number;
  baseSchedule: Record<WeekdayIndex, string>;
  settings: AppSettings;
}): Promise<void> {
  if (!isNativeApp()) return;
  await ensureAndroidChannel();

  const toCancel = [
    ...WEEKLY_IDS.map((id) => ({ id })),
    ...ALT_NOTIFICATION_IDS.map((id) => ({ id })),
  ];
  await LocalNotifications.cancel({ notifications: toCancel });

  if (!options.enabled) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  const now = new Date();
  const useAlternateSlots =
    alternateWeeklyHandled(options.settings) &&
    options.settings.alternate.enabled;

  const notifications: LocalNotificationSchema[] = [];

  for (let i = 0; i < 7; i++) {
    const idx = i as WeekdayIndex;
    if (useAlternateSlots && idx === options.settings.alternate.weekday) {
      continue;
    }
    const sample = sampleDateForWeekday(idx);
    const body = resolveDayNote(sample, options.baseSchedule, options.settings);
    notifications.push({
      id: WEEKLY_IDS[i],
      title: "Rifiuti — promemoria",
      body: `${WEEKDAY_LABELS[i]}: ${body}`,
      channelId: CHANNEL_ID,
      schedule: {
        on: {
          weekday: JS_MONDAY_FIRST_TO_CAPACITOR[i],
          hour: options.hour,
          minute: options.minute,
        },
        repeats: true,
      },
    });
  }

  if (useAlternateSlots) {
    const slots = buildAlternateOneShotSlots(
      now,
      options.hour,
      options.minute,
      options.baseSchedule,
      options.settings
    );
    for (const s of slots) {
      notifications.push({
        id: s.id,
        title: "Rifiuti — promemoria",
        body: `${WEEKDAY_LABELS[options.settings.alternate.weekday]}: ${s.body}`,
        channelId: CHANNEL_ID,
        schedule: { at: s.at },
      });
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
