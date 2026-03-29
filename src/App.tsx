import { useEffect, useRef, useState } from "react";
import { CalendarMonthView } from "./CalendarMonthView";
import {
  isNativeApp,
  requestNativeNotificationPermission,
  syncNativeWeeklyReminders,
} from "./nativeReminders";
import { loadSettings, saveSettings, type WeekdayIndex } from "./scheduleLogic";
import { SettingsView } from "./SettingsView";
import {
  buildTomorrowReminderCopy,
  type ReminderState,
  speakReminderText,
} from "./voiceReminder";

const STORAGE_KEY = "promemoria-rifiuti-schedule-v1";
const REMINDER_KEY = "promemoria-rifiuti-reminder-v1";

/** Modello tipo Bacoli: lun/mer/sab umido, mar carta, gio plastica; ven e dom da alternanza / testo */
const DEFAULT_SCHEDULE: Record<WeekdayIndex, string> = {
  0: "Umido / organico",
  1: "Carta",
  2: "Umido / organico",
  3: "Plastica e metalli (multimateriale)",
  4: "Vetro",
  5: "Umido / organico",
  6: "Nessun ritiro",
};

function loadSchedule(): Record<WeekdayIndex, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCHEDULE };
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out = { ...DEFAULT_SCHEDULE };
    for (let i = 0; i < 7; i++) {
      const v = parsed[String(i)];
      if (typeof v === "string") out[i as WeekdayIndex] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_SCHEDULE };
  }
}

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

  const [schedule, setSchedule] = useState<Record<WeekdayIndex, string>>(
    () => loadSchedule()
  );
  const [settings, setSettings] = useState(() => loadSettings());
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  }, [reminder]);

  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const reminderRef = useRef(reminder);
  reminderRef.current = reminder;

  useEffect(() => {
    if (isNative) {
      void syncNativeWeeklyReminders({
        enabled: reminder.enabled,
        voiceEnabled: reminder.voiceEnabled,
        hour: reminder.hour,
        minute: reminder.minute,
        baseSchedule: schedule,
        settings,
      });
    }
  }, [
    isNative,
    reminder.enabled,
    reminder.voiceEnabled,
    reminder.hour,
    reminder.minute,
    schedule,
    settings,
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
        const { title, body, voiceText } = buildTomorrowReminderCopy(
          fireAt,
          scheduleRef.current,
          settingsRef.current
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
        <CalendarMonthView
          year={calYear}
          month={calMonth}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
          onPrevYear={() => shiftYear(-1)}
          onNextYear={() => shiftYear(1)}
          schedule={schedule}
          settings={settings}
          today={now}
          onOpenSettings={() => setView("settings")}
        />
      ) : (
        <SettingsView
          settings={settings}
          setSettings={setSettings}
          schedule={schedule}
          setSchedule={setSchedule}
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
