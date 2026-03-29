import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  isNativeApp,
  requestNativeNotificationPermission,
  syncNativeWeeklyReminders,
} from "./nativeReminders";
import {
  loadSettings,
  resolveDayNote,
  saveSettings,
  type AppSettings,
  type WeekdayIndex,
} from "./scheduleLogic";
import { WEEKDAYS } from "./weekdays";

const STORAGE_KEY = "promemoria-rifiuti-schedule-v1";
const REMINDER_KEY = "promemoria-rifiuti-reminder-v1";

const DEFAULT_SCHEDULE: Record<WeekdayIndex, string> = {
  0: "Umido / organico",
  1: "Indifferenziata",
  2: "Plastica e metalli",
  3: "Carta",
  4: "Vetro",
  5: "Controllo calendario comunale",
  6: "Nessun ritiro (verifica)",
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

function loadReminder(): { enabled: boolean; hour: number; minute: number } {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (!raw) return { enabled: false, hour: 7, minute: 30 };
    const p = JSON.parse(raw) as {
      enabled?: boolean;
      hour?: number;
      minute?: number;
    };
    return {
      enabled: Boolean(p.enabled),
      hour: Number.isFinite(p.hour) ? Math.min(23, Math.max(0, p.hour!)) : 7,
      minute: Number.isFinite(p.minute)
        ? Math.min(59, Math.max(0, p.minute!))
        : 30,
    };
  } catch {
    return { enabled: false, hour: 7, minute: 30 };
  }
}

function formatTodayLong(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export default function App() {
  const [isNative] = useState(() => isNativeApp());
  const [schedule, setSchedule] = useState<Record<WeekdayIndex, string>>(
    () => loadSchedule()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
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

  const todayNote = useMemo(
    () => resolveDayNote(now, schedule, settings),
    [now, schedule, settings]
  );

  const orderedDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, k) => {
      const d = addDays(now, k);
      const idx = d.getDay();
      const mondayFirst = (idx === 0 ? 6 : idx - 1) as WeekdayIndex;
      return {
        date: d,
        idx: mondayFirst,
        label: WEEKDAYS[mondayFirst],
        isToday: k === 0,
        note: resolveDayNote(d, schedule, settings),
      };
    });
  }, [now, schedule, settings]);

  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (isNative) {
      void syncNativeWeeklyReminders({
        enabled: reminder.enabled,
        hour: reminder.hour,
        minute: reminder.minute,
        baseSchedule: schedule,
        settings,
      });
    }
  }, [isNative, reminder.enabled, reminder.hour, reminder.minute, schedule, settings]);

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
        const d = new Date();
        const idx = (d.getDay() === 0 ? 6 : d.getDay() - 1) as WeekdayIndex;
        const note = resolveDayNote(
          d,
          scheduleRef.current,
          settingsRef.current
        );
        try {
          new Notification("Rifiuti di oggi", {
            body: `${WEEKDAYS[idx]}: ${note}`,
            lang: "it",
          });
        } catch {
          /* ignore */
        }
        arm();
      }, delay);
    }

    arm();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isNative, reminder.enabled, reminder.hour, reminder.minute, notifSupportedWeb]);

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

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.65rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    font: "inherit",
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        padding: "1.25rem clamp(1rem, 4vw, 2rem)",
        maxWidth: "42rem",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "clamp(1.35rem, 4vw, 1.75rem)",
            fontWeight: 700,
            margin: "0 0 0.35rem",
            letterSpacing: "-0.02em",
          }}
        >
          Promemoria rifiuti
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
          {settings.municipality.trim()
            ? `Comune di ${settings.municipality.trim()}`
            : "Imposta comune e calendario qui sotto."}
        </p>
      </header>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.1rem 1.15rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            margin: "0 0 0.75rem",
            fontWeight: 600,
          }}
        >
          Comune
        </h2>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Nome comune</span>
          <input
            type="text"
            placeholder="es. Bacoli"
            value={settings.municipality}
            onChange={(e) =>
              setSettings((s) => ({ ...s, municipality: e.target.value }))
            }
            style={inputStyle}
          />
        </label>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.1rem 1.15rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            margin: "0 0 0.5rem",
            fontWeight: 600,
          }}
        >
          Ritiro a settimane alterne
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Esempio Bacoli: venerdì, una settimana vetro + indifferenziata, la
          successiva no. Scegli il giorno, una data di riferimento in cui vale la
          <strong> settimana A</strong>, e i testi per settimana A e B.
        </p>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            cursor: "pointer",
            fontSize: "0.95rem",
            marginBottom: "0.85rem",
          }}
        >
          <input
            type="checkbox"
            checked={settings.alternate.enabled}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                alternate: { ...s.alternate, enabled: e.target.checked },
              }))
            }
          />
          Attiva per questo giorno della settimana
        </label>
        {settings.alternate.enabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Giorno del ritiro alternato</span>
              <select
                value={settings.alternate.weekday}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    alternate: {
                      ...s.alternate,
                      weekday: Number(e.target.value) as WeekdayIndex,
                    },
                  }))
                }
                style={inputStyle}
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Data di riferimento (settimana A)
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                Un giorno che cade di {WEEKDAYS[settings.alternate.weekday]} e in cui
                passano i rifiuti indicati sotto in «settimana A».
              </span>
              <input
                type="date"
                value={settings.alternate.referenceDate}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    alternate: {
                      ...s.alternate,
                      referenceDate: e.target.value,
                    },
                  }))
                }
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Settimana A (es. vetro + indifferenziata)</span>
              <textarea
                value={settings.alternate.weekAText}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    alternate: { ...s.alternate, weekAText: e.target.value },
                  }))
                }
                rows={2}
                style={{ ...inputStyle, resize: "vertical", minHeight: "2.75rem" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Settimana B (es. nessun ritiro)</span>
              <textarea
                value={settings.alternate.weekBText}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    alternate: { ...s.alternate, weekBText: e.target.value },
                  }))
                }
                rows={2}
                style={{ ...inputStyle, resize: "vertical", minHeight: "2.75rem" }}
              />
            </label>
          </div>
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.1rem 1.15rem",
          marginBottom: "1.25rem",
          boxShadow: "0 1px 2px rgb(0 0 0 / 0.04)",
        }}
      >
        <p
          style={{
            margin: "0 0 0.5rem",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
          }}
        >
          Oggi
        </p>
        <p style={{ margin: "0 0 0.65rem", fontSize: "0.95rem" }}>
          {formatTodayLong(now)}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.15rem",
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {todayNote}
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            margin: "0 0 0.75rem",
            fontWeight: 600,
          }}
        >
          Prossimi giorni
        </h2>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {orderedDays.map(({ date: d, label, isToday, note }) => (
            <li
              key={d.toDateString()}
              style={{
                background: isToday ? "var(--today)" : "var(--surface)",
                border: `1px solid ${isToday ? "var(--today-border)" : "var(--border)"}`,
                borderRadius: "10px",
                padding: "0.65rem 0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                {label}
                {isToday ? " · oggi" : ""}
              </span>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                {note}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.1rem 1.15rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            margin: "0 0 0.85rem",
            fontWeight: 600,
          }}
        >
          {isNative ? "Promemoria (Android)" : "Promemoria (browser)"}
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          {isNative
            ? "Ogni giorno alla stessa ora ricevi un promemoria. Per il giorno a settimane alternate le notifiche sono programmate per circa 6 mesi; riapri l’app dopo un aggiornamento del calendario per rinnovarle."
            : "Ricevi una notifica una volta al giorno all’orario scelto (solo se la scheda è aperta o il browser lo consente)."}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={(e) => {
                void handleReminderToggle(e.target.checked);
              }}
            />
            Attiva promemoria
          </label>
          <span style={{ color: "var(--muted)" }}>alle</span>
          <input
            type="time"
            value={`${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              setReminder((r) => ({
                ...r,
                hour: Number.isFinite(h) ? h : r.hour,
                minute: Number.isFinite(m) ? m : r.minute,
              }));
            }}
            style={{
              padding: "0.35rem 0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
          />
        </div>
        {!isNative &&
          notifSupportedWeb &&
          Notification.permission === "denied" && (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#b45309" }}>
            Le notifiche sono bloccate per questo sito: abilitale dalle
            impostazioni del browser.
          </p>
        )}
      </section>

      <section>
        <h2
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--muted)",
            margin: "0 0 0.85rem",
            fontWeight: 600,
          }}
        >
          Calendario settimanale (giorni fissi)
        </h2>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Usato per i giorni senza alternanza e come base per gli altri. Il giorno
          che hai impostato come «alternato» usa qui il testo solo nei giorni in
          cui non applichi l’alternanza (es. se disattivi l’opzione).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {WEEKDAYS.map((day, i) => {
            const idx = i as WeekdayIndex;
            return (
              <label
                key={day}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{day}</span>
                <textarea
                  value={schedule[idx]}
                  onChange={(e) =>
                    setSchedule((s) => ({ ...s, [idx]: e.target.value }))
                  }
                  rows={2}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "2.75rem",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    font: "inherit",
                    lineHeight: 1.4,
                  }}
                />
              </label>
            );
          })}
        </div>
      </section>

      <footer style={{ marginTop: "2rem", fontSize: "0.8rem", color: "var(--muted)" }}>
        Dati salvati solo sul tuo dispositivo (localStorage).
      </footer>
    </div>
  );
}
