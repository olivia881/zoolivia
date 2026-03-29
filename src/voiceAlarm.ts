import { registerPlugin } from "@capacitor/core";

export interface VoiceAlarmScheduleItem {
  when: number;
  voiceText: string;
}

export interface VoiceAlarmPlugin {
  scheduleAlarms(options: { alarms: VoiceAlarmScheduleItem[] }): Promise<void>;
  cancelAll(): Promise<void>;
}

export const VoiceAlarm = registerPlugin<VoiceAlarmPlugin>("VoiceAlarm");
