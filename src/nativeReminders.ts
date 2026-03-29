import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import type { AppSettings, WeekdayIndex } from "./scheduleLogic";
import { VoiceAlarm } from "./voiceAlarm";
import {
  buildDailyReminderSlots,
  DAILY_REMINDER_IDS,
} from "./voiceReminder";

const CHANNEL_ID = "promemoria-rifiuti";

/** Vecchi ID (settimanali + slot alternanza) da annullare dopo aggiornamento app */
const LEGACY_NOTIFICATION_IDS = [
  ...Array.from({ length: 7 }, (_, i) => 100 + i),
  ...Array.from({ length: 90 }, (_, i) => 200 + i),
];

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
    description: "Promemoria vocale e testuale sulla raccolta rifiuti",
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

/**
 * Promemoria giornaliero: notifica con testo domani.
 * Su Android, se voiceEnabled, allarmi nativi (AlarmManager) + TTS anche a schermo spento.
 */
export async function syncNativeWeeklyReminders(options: {
  enabled: boolean;
  voiceEnabled: boolean;
  hour: number;
  minute: number;
  baseSchedule: Record<WeekdayIndex, string>;
  settings: AppSettings;
}): Promise<void> {
  if (!isNativeApp()) return;
  await ensureAndroidChannel();

  const allIds = [...LEGACY_NOTIFICATION_IDS, ...DAILY_REMINDER_IDS];
  await LocalNotifications.cancel({
    notifications: allIds.map((id) => ({ id })),
  });

  try {
    await VoiceAlarm.cancelAll();
  } catch {
    /* plugin assente su web build */
  }

  if (!options.enabled) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  const now = new Date();
  const slots = buildDailyReminderSlots(
    now,
    options.hour,
    options.minute,
    options.baseSchedule,
    options.settings
  );

  const isAndroid = Capacitor.getPlatform() === "android";

  const notifications: LocalNotificationSchema[] = slots.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    channelId: CHANNEL_ID,
    schedule: { at: s.at },
    ...(isAndroid
      ? {}
      : {
          extra: {
            voiceText: s.voiceText,
            voiceEnabled: options.voiceEnabled,
          },
        }),
  }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  if (isAndroid && options.voiceEnabled) {
    try {
      await VoiceAlarm.scheduleAlarms({
        alarms: slots.map((s) => ({
          when: s.at.getTime(),
          voiceText: s.voiceText,
        })),
      });
    } catch {
      /* fallback: solo notifica silenziosa */
    }
  }
}
