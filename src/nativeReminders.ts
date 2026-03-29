import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import type { DayServiceEntry } from "./dayLogModel";
import type { ShiftAppSettings } from "./shiftScheduleLogic";
import {
  buildDailyShiftReminderSlots,
  DAILY_REMINDER_IDS,
} from "./shiftVoiceReminder";

const CHANNEL_ID = "turni-servizio";

/** Max notifiche per chiamata schedule (Android può fallire con array troppo grandi). */
const SCHEDULE_CHUNK = 12;

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
    name: "Turni di servizio",
    description: "Promemoria sui turni di servizio",
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

async function scheduleNotificationsChunked(
  list: LocalNotificationSchema[]
): Promise<void> {
  for (let i = 0; i < list.length; i += SCHEDULE_CHUNK) {
    const chunk = list.slice(i, i + SCHEDULE_CHUNK);
    await LocalNotifications.schedule({ notifications: chunk });
  }
}

/**
 * Un promemoria al giorno: notifica con testo per il giorno dopo.
 * La voce (se attiva) parte dall'evento localNotificationReceived quando l'app è in esecuzione.
 */
export async function syncNativeShiftReminders(options: {
  enabled: boolean;
  voiceEnabled: boolean;
  hour: number;
  minute: number;
  shiftSettings: ShiftAppSettings;
  dayLogs: Record<string, DayServiceEntry>;
}): Promise<void> {
  if (!isNativeApp()) return;
  await ensureAndroidChannel();

  const allIds = [...LEGACY_NOTIFICATION_IDS, ...DAILY_REMINDER_IDS];
  await LocalNotifications.cancel({
    notifications: allIds.map((id) => ({ id })),
  });

  if (!options.enabled) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  const now = new Date();
  const slots = buildDailyShiftReminderSlots(
    now,
    options.hour,
    options.minute,
    options.shiftSettings,
    options.dayLogs
  );

  const notifications: LocalNotificationSchema[] = slots.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    channelId: CHANNEL_ID,
    schedule: { at: s.at },
    extra: {
      voiceText: s.voiceText,
      voiceEnabled: options.voiceEnabled,
    },
  }));

  if (notifications.length > 0) {
    await scheduleNotificationsChunked(notifications);
  }
}
