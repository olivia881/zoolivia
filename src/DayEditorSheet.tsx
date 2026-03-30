import { type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { absenceFlagClearsShifts } from "./dayAbsenceDisplay";
import type { DayServiceEntry } from "./dayLogModel";
import { WEEKDAYS } from "./weekdays";
import {
  CYCLE_PAIR_LABELS,
  resolveDayShift,
  shiftTimeLabels,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";

type Props = {
  detailTitle: string;
  detailDate: Date;
  entry: DayServiceEntry;
  setEntry: Dispatch<SetStateAction<DayServiceEntry>>;
  shiftSettings: ShiftAppSettings;
  onClose: () => void;
  onApplyPlanned: () => void;
  onClearDay: () => void;
};

const labelStyle: CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  marginBottom: "0.3rem",
  display: "block",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.6rem",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  font: "inherit",
  fontSize: "0.9rem",
};

const hintStyle: CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--muted)",
  marginTop: "0.25rem",
};

export function DayEditorSheet({
  detailTitle,
  detailDate,
  entry,
  setEntry,
  shiftSettings,
  onClose,
  onApplyPlanned,
  onClearDay,
}: Props) {
  const planned = resolveDayShift(detailDate, shiftSettings);
  const labels = shiftTimeLabels(shiftSettings.timeVariant);

  function rowCheckbox(
    checked: boolean,
    onChange: (v: boolean) => void,
    text: string
  ) {
    return (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {text}
      </label>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-editor-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "1rem",
        background: "rgb(0 0 0 / 0.45)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "26rem",
          maxHeight: "90dvh",
          overflow: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "1rem 1.05rem",
          marginBottom: "env(safe-area-inset-bottom, 0)",
          boxShadow: "0 8px 32px rgb(0 0 0 / 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.65rem",
            marginBottom: "0.75rem",
          }}
        >
          <h2
            id="day-editor-title"
            style={{
              margin: 0,
              fontSize: "1.02rem",
              fontWeight: 700,
              lineHeight: 1.3,
              textTransform: "capitalize",
            }}
          >
            {detailTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              color: "var(--text)",
            }}
          >
            ×
          </button>
        </div>

        {planned ? (
          <div
            style={{
              background: "var(--accent-soft)",
              borderRadius: "12px",
              padding: "0.65rem 0.75rem",
              marginBottom: "0.85rem",
              fontSize: "0.82rem",
              lineHeight: 1.4,
            }}
          >
            <strong>Turno a scalare ({CYCLE_PAIR_LABELS[planned.weekInCycle]}, sett.{" "}
            {planned.weekInCycle + 1}/5):</strong> prima fascia{" "}
            {labels.morning}
            {planned.afternoonWeekday === null
              ? "."
              : planned.afternoonWeekday === planned.morningWeekday
                ? `; seconda fascia stesso giorno ${labels.afternoon}.`
                : `; seconda fascia ${WEEKDAYS[planned.afternoonWeekday]} ${labels.afternoon}.`}
            <div style={{ marginTop: "0.45rem" }}>
              <button
                type="button"
                onClick={onApplyPlanned}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                Inserisci fasce previste nei campi
              </button>
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: "0 0 0.85rem",
              fontSize: "0.85rem",
              color: "var(--muted)",
            }}
          >
            Riposo (fine settimana). Puoi comunque annotare corsi o permessi.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Mattina</label>
            <input
              type="text"
              inputMode="text"
              placeholder="es. 08:00-14:00"
              value={entry.mattina}
              onChange={(e) =>
                setEntry((x) => ({ ...x, mattina: e.target.value }))
              }
              style={inputStyle}
            />
            <p style={hintStyle}>Orari nel formato 08:00-14:00 (anche più intervalli).</p>
          </div>
          <div>
            <label style={labelStyle}>Rientro / pomeriggio</label>
            <input
              type="text"
              placeholder="es. 14:30-17:30"
              value={entry.pomeriggioRientro}
              onChange={(e) =>
                setEntry((x) => ({ ...x, pomeriggioRientro: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Straordinario (ore)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="es. 2 oppure 2,5"
              value={entry.straordinarioOre}
              onChange={(e) =>
                setEntry((x) => ({ ...x, straordinarioOre: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Servizio esterno — descrizione</label>
            <input
              type="text"
              placeholder="es. aggiornamento, attività…"
              value={entry.servizioEsterno}
              onChange={(e) =>
                setEntry((x) => ({ ...x, servizioEsterno: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Servizio esterno — ore</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="ore"
              value={entry.servizioEsternoOre}
              onChange={(e) =>
                setEntry((x) => ({ ...x, servizioEsternoOre: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Servizio fuori sede — descrizione</label>
            <input
              type="text"
              placeholder="luogo / attività"
              value={entry.servizioFuoriSede}
              onChange={(e) =>
                setEntry((x) => ({ ...x, servizioFuoriSede: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Servizio fuori sede — ore</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="ore"
              value={entry.servizioFuoriSedeOre}
              onChange={(e) =>
                setEntry((x) => ({ ...x, servizioFuoriSedeOre: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Corsi / formazione / aggiornamento</label>
            <textarea
              rows={2}
              placeholder="es. 1° corso ABL, AGG c/o…"
              value={entry.corsiFormazione}
              onChange={(e) =>
                setEntry((x) => ({ ...x, corsiFormazione: e.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical", minHeight: "2.5rem" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Altre note</label>
            <textarea
              rows={2}
              value={entry.altroNote}
              onChange={(e) =>
                setEntry((x) => ({ ...x, altroNote: e.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical", minHeight: "2.5rem" }}
            />
          </div>

          <fieldset
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "0.65rem 0.75rem",
              margin: 0,
            }}
          >
            <legend style={{ fontSize: "0.78rem", fontWeight: 600, padding: "0 0.35rem" }}>
              Festivi / assenze / pasti
            </legend>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              {rowCheckbox(
                entry.festivo,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, festivo: v };
                    if (v && absenceFlagClearsShifts("festivo")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "Festivo (lun–ven)"
              )}
              {rowCheckbox(
                entry.congedoOrdinario,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, congedoOrdinario: v };
                    if (v && absenceFlagClearsShifts("congedoOrdinario")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "Congedo ordinario (C.O.)"
              )}
              {rowCheckbox(
                entry.congedoStraordMalattia,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, congedoStraordMalattia: v };
                    if (v && absenceFlagClearsShifts("congedoStraordMalattia")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "Congedo straordinario — malattia"
              )}
              {rowCheckbox(
                entry.congedoStraordFamiglia,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, congedoStraordFamiglia: v };
                    if (v && absenceFlagClearsShifts("congedoStraordFamiglia")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "Congedo straordinario — motivi familiari"
              )}
              {rowCheckbox(
                entry.pnl,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, pnl: v };
                    if (v && absenceFlagClearsShifts("pnl")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "PNL"
              )}
              {rowCheckbox(
                entry.congedoParentale,
                (v) =>
                  setEntry((x) => {
                    const next = { ...x, congedoParentale: v };
                    if (v && absenceFlagClearsShifts("congedoParentale")) {
                      next.mattina = "";
                      next.pomeriggioRientro = "";
                      next.straordinarioOre = "";
                    }
                    return next;
                  }),
                "Congedo parentale (C.P.)"
              )}
              {rowCheckbox(
                entry.buonoPasto,
                (v) => setEntry((x) => ({ ...x, buonoPasto: v })),
                "Buono pasto"
              )}
            </div>
          </fieldset>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "12px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              font: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Salva e chiudi
          </button>
          <button
            type="button"
            onClick={() => {
              onClearDay();
            }}
            style={{
              width: "100%",
              padding: "0.55rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              font: "inherit",
              fontSize: "0.88rem",
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            Svuota questo giorno
          </button>
        </div>
      </div>
    </div>
  );
}
