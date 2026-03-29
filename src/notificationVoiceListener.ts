import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
import { speakReminderText } from "./shiftVoiceReminder";

/** Legge il messaggio quando la notifica arriva e l'app è in esecuzione (foreground / processo attivo). */
export function registerNotificationVoiceListener(): void {
  if (!Capacitor.isNativePlatform()) return;
  void LocalNotifications.addListener(
    "localNotificationReceived",
    (n: LocalNotificationSchema) => {
      const ex = n.extra as
        | { voiceEnabled?: boolean; voiceText?: string }
        | undefined;
      if (!ex?.voiceEnabled || !ex.voiceText) return;
      void speakReminderText(ex.voiceText);
    }
  );
}
