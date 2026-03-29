import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "promemoria-rifiuti-schedule-v1";
const REMINDER_KEY = "promemoria-rifiuti-reminder-v1";

const WEEKDAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
] as const;

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function mondayFirstIndex(date: Date): WeekdayIndex {
  const js = date.getDay();
  return (js === 0 ? 6 : js - 1) as WeekdayIndex;
}

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

export default function App() {
  const [schedule, setSchedule] = useState<Record<WeekdayIndex, string>>(
    () => loadSchedule()
  );
  const [reminder, setReminder] = useState(loadReminder);
  const [now, setNow] = useState(() => new Date());
  const [notifSupported] = useState(
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
    localStorage.setItem(REMINDER_KEY, JSON.stringify(reminder));
  }, [reminder]);

  const todayIdx = mondayFirstIndex(now);
  const todayNote = schedule[todayIdx];

  const orderedDays = useMemo(() => {
    const start = todayIdx;
    return Array.from({ length: 7 }, (_, k) => {
      const idx = ((start + k) % 7) as WeekdayIndex;
      return { idx, label: WEEKDAYS[idx], isToday: k === 0 };
    });
  }, [todayIdx]);

  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  useEffect(() => {
    if (!reminder.enabled || !notifSupported) return;
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
        const idx = mondayFirstIndex(d);
        const note = scheduleRef.current[idx];
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
  }, [reminder.enabled, reminder.hour, reminder.minute, notifSupported]);

  async function enableNotifications() {
    if (!notifSupported) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    setReminder((r) => ({ ...r, enabled: true }));
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
          Personalizza i giorni qui sotto in base al calendario del tuo comune.
        </p>
      </header>

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
          {orderedDays.map(({ idx, label, isToday }) => (
            <li
              key={idx}
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
                {schedule[idx]}
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
          Promemoria (browser)
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          Ricevi una notifica una volta al giorno all’orario scelto (solo se la
          scheda è aperta o il browser lo consente).
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
                const on = e.target.checked;
                if (on && notifSupported && Notification.permission === "default") {
                  void enableNotifications();
                  return;
                }
                if (on && notifSupported && Notification.permission === "denied") {
                  return;
                }
                setReminder((r) => ({ ...r, enabled: on }));
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
        {notifSupported && Notification.permission === "denied" && (
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
          Calendario settimanale
        </h2>
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
