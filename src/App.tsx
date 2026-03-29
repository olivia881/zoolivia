import { useEffect, useRef, useState } from "react";
import type { DayServiceEntry } from "./dayLogModel";
import { loadDayLogs, saveDayLogs } from "./dayLogStorage";
import { ShiftCalendarMonthView } from "./ShiftCalendarMonthView";
import {
  isNativeApp,
  requestNativeNotificationPermission,
  syncNativeShiftReminders,
} from "./nativeReminders";
import {
  loadShiftSettings,
  saveShiftSettings,
} from "./shiftScheduleLogic";
import { ShiftSettingsView } from "./ShiftSettingsView";
import {
  buildTomorrowShiftReminderCopy,
  type ReminderState,
  speakReminderText,
} from "./shiftVoiceReminder";

const REMINDER_KEY = "turni-servizio-reminder-v1";

function loadReminder(): ReminderState {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (!raw)
      return { enabled: false, voiceEnabled: true, hour: 20, minute: 0 };
    const p = JSON.parse(raw) as {
      enabled?: boolean;
      voiceEnabled?: boolean;
      hour?: number;
      minute?: number;
    };
    return {
      enabled: Boolean(p.enabled),
      voiceEnabled: p.voiceEnabled !== false,
      hour: Number.isFinite(p.hour) ? Math.min(23, Math.max(0, p.hour!)) : 20,
      minute: Number.isFinite(p.minute)
        ? Math.min(59, Math.max(0, p.minute!))
        : 0,
    };
  } catch {
    return { enabled: false, voiceEnabled: true, hour: 20, minute: 0 };
  }
}

export default function App() {
  const [isNative] = useState(() => isNativeApp());
  const [view, setView] = useState<"calendar" | "settings">("calendar");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const [shiftSettings, setShiftSettings] = useState(() => loadShiftSettings());
  const [dayLogs, setDayLogs] = useState<Record<string, DayServiceEntry>>(
    () => loadDayLogs()
  );
  const [reminder, setReminder] = useState(loadReminder);
  const [now, setNow] = useState(() => new Date());
  const [notifSupportedWeb] = useState(
    () => typeof Notification !== "undefined"
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    saveShiftSettings(shiftSettings);
  }, [shiftSettings]);

  useEffect(() => {
    saveDayLogs(dayLogs);
  }, [dayLogs]);

  useEffect(() => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  }, [reminder]);

  const shiftSettingsRef = useRef(shiftSettings);
  shiftSettingsRef.current = shiftSettings;
  const dayLogsRef = useRef(dayLogs);
  dayLogsRef.current = dayLogs;
  const reminderRef = useRef(reminder);
  reminderRef.current = reminder;

  useEffect(() => {
    if (isNative) {
      void syncNativeShiftReminders({
        enabled: reminder.enabled,
        voiceEnabled: reminder.voiceEnabled,
        hour: reminder.hour,
        minute: reminder.minute,
        shiftSettings,
        dayLogs,
      });
    }
  }, [
    isNative,
    reminder.enabled,
    reminder.voiceEnabled,
    reminder.hour,
    reminder.minute,
    shiftSettings,
    dayLogs,
  ]);

  useEffect(() => {
    if (isNative) return;
    if (!reminder.enabled || !notifSupportedWeb) return;
    if (Notification.permission !== "granted") return;

    let timeoutId: number;
    let cancelled = false;

    function msUntilNextFire(from: Date): number {
      const target = new Date(from);
      target.setHours(reminder.hour, reminder.minute, 0, 0);
      if (target <= from) target.setDate(target.getDate() + 1);
      return target.getTime() - from.getTime();
    }

    function arm() {
      const delay = msUntilNextFire(new Date());
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const fireAt = new Date();
        const { title, body, voiceText } = buildTomorrowShiftReminderCopy(
          fireAt,
          shiftSettingsRef.current,
          dayLogsRef.current
        );
        try {
          new Notification(title, { body, lang: "it" });
        } catch {
          /* ignore */
        }
        if (reminderRef.current.voiceEnabled) {
          void speakReminderText(voiceText);
        }
        arm();
      }, delay);
    }

    arm();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    isNative,
    reminder.enabled,
    reminder.hour,
    reminder.minute,
    reminder.voiceEnabled,
    notifSupportedWeb,
    dayLogs,
  ]);

  async function enableWebNotifications() {
    if (!notifSupportedWeb) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    setReminder((r) => ({ ...r, enabled: true }));
  }

  async function handleReminderToggle(wantOn: boolean) {
    if (!wantOn) {
      setReminder((r) => ({ ...r, enabled: false }));
      return;
    }
    if (isNative) {
      const ok = await requestNativeNotificationPermission();
      if (ok) setReminder((r) => ({ ...r, enabled: true }));
      return;
    }
    if (notifSupportedWeb && Notification.permission === "default") {
      await enableWebNotifications();
      return;
    }
    if (notifSupportedWeb && Notification.permission === "denied") return;
    setReminder((r) => ({ ...r, enabled: true }));
  }

  function shiftMonth(delta: number) {
    setCalMonth((m) => {
      let next = m + delta;
      let y = calYear;
      while (next < 0) {
        next += 12;
        y -= 1;
      }
      while (next > 11) {
        next -= 12;
        y += 1;
      }
      setCalYear(y);
      return next;
    });
  }

  function shiftYear(delta: number) {
    setCalYear((y) => y + delta);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        padding: "1.25rem clamp(1rem, 4vw, 2rem)",
        maxWidth: "42rem",
        margin: "0 auto",
      }}
    >
      {view === "calendar" ? (
        <ShiftCalendarMonthView
          year={calYear}
          month={calMonth}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onPrevYear={() => shiftYear(-1)}
          onNextYear={() => shiftYear(1)}
          shiftSettings={shiftSettings}
          today={now}
          onOpenSettings={() => setView("settings")}
          dayLogs={dayLogs}
          setDayLogs={setDayLogs}
        />
      ) : (
        <ShiftSettingsView
          shiftSettings={shiftSettings}
          setShiftSettings={setShiftSettings}
          reminder={reminder}
          setReminder={setReminder}
          isNative={isNative}
          notifSupportedWeb={notifSupportedWeb}
          onReminderToggle={(on) => {
            void handleReminderToggle(on);
          }}
          onBack={() => setView("calendar")}
        />
      )}
    </div>
  );
}
