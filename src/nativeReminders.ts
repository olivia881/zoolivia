import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  Weekday,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";

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
  scheduleTexts: readonly string[];
}): Promise<void> {
  if (!isNativeApp()) return;
  await ensureAndroidChannel();

  await LocalNotifications.cancel({
    notifications: WEEKLY_IDS.map((id) => ({ id })),
  });

  if (!options.enabled) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  const notifications: LocalNotificationSchema[] = WEEKLY_IDS.map(
    (id, i) => ({
      id,
      title: "Rifiuti — promemoria",
      body: `${WEEKDAY_LABELS[i]}: ${options.scheduleTexts[i] ?? ""}`,
      channelId: CHANNEL_ID,
      schedule: {
        on: {
          weekday: JS_MONDAY_FIRST_TO_CAPACITOR[i],
          hour: options.hour,
          minute: options.minute,
        },
        repeats: true,
      },
    })
  );

  await LocalNotifications.schedule({ notifications });
}
