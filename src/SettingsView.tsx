import { type CSSProperties, type Dispatch, type SetStateAction } from "react";
import {
  emptyAlternate,
  type AlternateWeekConfig,
  type AppSettings,
  type WeekdayIndex,
} from "./scheduleLogic";
import { WEEKDAYS } from "./weekdays";

type Props = {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  schedule: Record<WeekdayIndex, string>;
  setSchedule: Dispatch<SetStateAction<Record<WeekdayIndex, string>>>;
  reminder: { enabled: boolean; hour: number; minute: number };
  setReminder: Dispatch<
    SetStateAction<{ enabled: boolean; hour: number; minute: number }>
  >;
  isNative: boolean;
  notifSupportedWeb: boolean;
  onReminderToggle: (on: boolean) => void;
  onBack: () => void;
};

export function SettingsView({
  settings,
  setSettings,
  schedule,
  setSchedule,
  reminder,
  setReminder,
  isNative,
  notifSupportedWeb,
  onReminderToggle,
  onBack,
}: Props) {
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

  function updateAlternate(index: number, patch: Partial<AlternateWeekConfig>) {
    setSettings((s) => {
      const alternates = [...s.alternates];
      alternates[index] = { ...alternates[index], ...patch };
      return { ...s, alternates };
    });
  }

  function addAlternateRule() {
    setSettings((s) => ({
      ...s,
      alternates: [...s.alternates, emptyAlternate()],
    }));
  }

  function removeAlternateRule(index: number) {
    setSettings((s) => {
      if (s.alternates.length <= 1) return s;
      const alternates = s.alternates.filter((_, i) => i !== index);
      return { ...s, alternates };
    });
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "0.45rem 0.75rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            font: "inherit",
            color: "var(--text)",
          }}
        >
          ← Calendario
        </button>
        <h1
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            margin: 0,
            flex: 1,
          }}
        >
          Impostazioni
        </h1>
      </div>

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
          Ritiri a settimane alternate
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Puoi aggiungere <strong>più di una regola</strong> (es. un venerdì con V/I
          alternati e un altro giorno con due turni diversi). Ogni regola ha il suo
          giorno, la data di riferimento per la <strong>settimana A</strong> e i
          testi A/B (usa «Vetro» e «Indifferenziata» per le icone nel calendario).
        </p>

        {settings.alternates.map((alt, index) => (
          <div
            key={index}
            style={{
              borderTop: index > 0 ? "1px solid var(--border)" : "none",
              paddingTop: index > 0 ? "1rem" : 0,
              marginTop: index > 0 ? "1rem" : 0,
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                marginBottom: "0.65rem",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Regola {index + 1}
              </span>
              {settings.alternates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAlternateRule(index)}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    cursor: "pointer",
                    color: "var(--muted)",
                  }}
                >
                  Rimuovi
                </button>
              )}
            </div>
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
                checked={alt.enabled}
                onChange={(e) =>
                  updateAlternate(index, { enabled: e.target.checked })
                }
              />
              Attiva questa alternanza
            </label>
            {alt.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Giorno</span>
                  <select
                    value={alt.weekday}
                    onChange={(e) =>
                      updateAlternate(index, {
                        weekday: Number(e.target.value) as WeekdayIndex,
                      })
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
                    Un {WEEKDAYS[alt.weekday]} in cui vale il testo «settimana A».
                  </span>
                  <input
                    type="date"
                    value={alt.referenceDate}
                    onChange={(e) =>
                      updateAlternate(index, { referenceDate: e.target.value })
                    }
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Settimana A</span>
                  <textarea
                    value={alt.weekAText}
                    onChange={(e) =>
                      updateAlternate(index, { weekAText: e.target.value })
                    }
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", minHeight: "2.75rem" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Settimana B</span>
                  <textarea
                    value={alt.weekBText}
                    onChange={(e) =>
                      updateAlternate(index, { weekBText: e.target.value })
                    }
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", minHeight: "2.75rem" }}
                  />
                </label>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addAlternateRule}
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.55rem",
            borderRadius: "10px",
            border: "1px dashed var(--border)",
            background: "var(--bg)",
            cursor: "pointer",
            font: "inherit",
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          + Aggiungi un’altra alternanza (altro giorno)
        </button>
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
            margin: "0 0 0.85rem",
            fontWeight: 600,
          }}
        >
          {isNative ? "Promemoria (Android)" : "Promemoria (browser)"}
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          {isNative
            ? "Per i giorni con alternanza le notifiche sono programmate per mesi; riapri l’app dopo aver cambiato il calendario."
            : "La notifica web dipende dal browser."}
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
              onChange={(e) => onReminderToggle(e.target.checked)}
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
              Notifiche bloccate: abilitale dalle impostazioni del browser.
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
          Giorni fissi (settimana tipo)
        </h2>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Per i giorni <strong>senza</strong> regola di alternanza attiva qui sopra. Usa
          parole come umido, carta, plastica, vetro, indifferenziata per le icone nel
          calendario.
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
        Dati salvati sul dispositivo (localStorage).
      </footer>
    </div>
  );
}
