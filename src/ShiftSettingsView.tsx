import { type CSSProperties, type Dispatch, type SetStateAction } from "react";
import {
  defaultAnchorMondayYmd,
  parseLocalYmd,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import { mondayFirstIndex } from "./weekdays";
import type { ReminderState } from "./shiftVoiceReminder";

type Props = {
  shiftSettings: ShiftAppSettings;
  setShiftSettings: Dispatch<SetStateAction<ShiftAppSettings>>;
  reminder: ReminderState;
  setReminder: Dispatch<SetStateAction<ReminderState>>;
  isNative: boolean;
  notifSupportedWeb: boolean;
  onReminderToggle: (on: boolean) => void;
  onBack: () => void;
};

export function ShiftSettingsView({
  shiftSettings,
  setShiftSettings,
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

  const anchorParsed = parseLocalYmd(shiftSettings.anchorMondayYmd);
  const anchorIsMonday =
    anchorParsed !== null && mondayFirstIndex(anchorParsed) === 0;

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
          Intestazione (come servizio settimanale)
        </h2>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Compare sotto il titolo nel calendario mensile (es. ufficio e area).
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Riga 1 — Ufficio</span>
          <input
            type="text"
            placeholder="es. Ufficio: Indagini elettroniche"
            value={shiftSettings.officeLine1}
            onChange={(e) =>
              setShiftSettings((s) => ({ ...s, officeLine1: e.target.value }))
            }
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Riga 2 — Reparto / area</span>
          <textarea
            rows={2}
            placeholder="es. Regionale di Polizia Scientifica — III Area"
            value={shiftSettings.officeLine2}
            onChange={(e) =>
              setShiftSettings((s) => ({ ...s, officeLine2: e.target.value }))
            }
            style={{ ...inputStyle, resize: "vertical", minHeight: "2.75rem" }}
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
          Orari
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Scegli la fascia: mattina e rientro pomeridiano sono sempre abbinati.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            <input
              type="radio"
              name="timeVariant"
              checked={shiftSettings.timeVariant === "early"}
              onChange={() =>
                setShiftSettings((s) => ({ ...s, timeVariant: "early" }))
              }
            />
            <span>
              <strong>8:00 – 14:00</strong> e rientro{" "}
              <strong>14:30 – 17:30</strong>
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            <input
              type="radio"
              name="timeVariant"
              checked={shiftSettings.timeVariant === "late"}
              onChange={() =>
                setShiftSettings((s) => ({ ...s, timeVariant: "late" }))
              }
            />
            <span>
              <strong>9:00 – 15:00</strong> e rientro{" "}
              <strong>15:30 – 18:30</strong>
            </span>
          </label>
        </div>
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
          Inizio ciclo (lunedì)
        </h2>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.88rem", color: "var(--muted)" }}>
          Il turno «a scalare» si ripete ogni <strong>5 settimane</strong>. Imposta il{" "}
          <strong>lunedì</strong> in cui per te inizia la <strong>settimana 1</strong> del
          ciclo (quella con abbinamenti Lun↔Mer e Mar↔Gio). Se il calendario non coincide
          con l’ufficio, cambia solo questa data.
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            Lunedì di riferimento
          </span>
          <input
            type="date"
            value={shiftSettings.anchorMondayYmd}
            onChange={(e) =>
              setShiftSettings((s) => ({
                ...s,
                anchorMondayYmd: e.target.value,
              }))
            }
            style={inputStyle}
          />
        </label>
        {shiftSettings.anchorMondayYmd && !anchorIsMonday && (
          <p
            style={{
              margin: "0.65rem 0 0",
              fontSize: "0.85rem",
              color: "#b45309",
            }}
          >
            La data scelta non è un lunedì: il ciclo potrebbe risultare sfasato.
            Usa un lunedì o premi «Allinea al lunedì di questa settimana».
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            setShiftSettings((s) => ({
              ...s,
              anchorMondayYmd: defaultAnchorMondayYmd(),
            }))
          }
          style={{
            marginTop: "0.75rem",
            width: "100%",
            padding: "0.55rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            cursor: "pointer",
            font: "inherit",
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          Allinea al lunedì di questa settimana
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
          All’orario scelto: notifica con il riepilogo del turno per{" "}
          <strong>domani</strong> (lun–ven). Con la voce attiva, il messaggio viene letto
          quando l’app è aperta o in background recente (su Android con app chiusa da
          tempo spesso resta solo la notifica).
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
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            cursor: "pointer",
            fontSize: "0.95rem",
            marginTop: "0.75rem",
          }}
        >
          <input
            type="checkbox"
            checked={reminder.voiceEnabled}
            onChange={(e) =>
              setReminder((r) => ({ ...r, voiceEnabled: e.target.checked }))
            }
          />
          Leggi il messaggio ad alta voce (sintesi vocale)
        </label>
        {!isNative &&
          notifSupportedWeb &&
          Notification.permission === "denied" && (
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#b45309" }}>
              Notifiche bloccate: abilitale dalle impostazioni del browser.
            </p>
          )}
      </section>

      <footer style={{ marginTop: "2rem", fontSize: "0.8rem", color: "var(--muted)" }}>
        Dati salvati sul dispositivo (localStorage).
      </footer>
    </div>
  );
}
