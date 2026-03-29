import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
import { speakReminderText } from "./voiceReminder";

/**
 * iOS: TTS quando la notifica arriva con l’app aperta (Android usa allarmi nativi).
 */
export function registerNotificationVoiceListener(): void {
  if (Capacitor.getPlatform() !== "ios") return;
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
