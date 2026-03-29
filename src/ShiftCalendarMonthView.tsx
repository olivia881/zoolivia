import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  resolveDayShift,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import { shiftCellSummary } from "./shiftVoiceReminder";
import { WEEKDAYS } from "./weekdays";

const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const CYCLE_LABELS = [
  "Lun↔Mer · Mar↔Gio",
  "Mer↔Ven",
  "Lun↔Gio",
  "Mar↔Ven",
  "Mar↔Ven",
];

type Props = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  shiftSettings: ShiftAppSettings;
  today: Date;
  onOpenSettings: () => void;
};

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function mondayOffsetFirstOfMonth(y: number, m: number): number {
  const d = new Date(y, m, 1);
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

export function ShiftCalendarMonthView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  shiftSettings,
  today,
  onOpenSettings,
}: Props) {
  const [detailDate, setDetailDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!detailDate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailDate(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detailDate]);

  const cells = useMemo(() => {
    const dim = daysInMonth(year, month);
    const pad = mondayOffsetFirstOfMonth(year, month);
    const list: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < pad; i++) {
      list.push({ date: null, key: `e-${i}` });
    }
    for (let d = 1; d <= dim; d++) {
      const date = new Date(year, month, d);
      list.push({ date, key: `${year}-${month}-${d}` });
    }
    while (list.length % 7 !== 0) {
      list.push({ date: null, key: `t-${list.length}` });
    }
    return list;
  }, [year, month]);

  const title = `${MONTH_NAMES[month].toUpperCase()} ${year}`;

  const detailTitle = detailDate
    ? new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(detailDate)
    : "";

  const detailShift = detailDate
    ? resolveDayShift(detailDate, shiftSettings)
    : null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(1.1rem, 4vw, 1.45rem)",
              fontWeight: 700,
              margin: "0 0 0.2rem",
              letterSpacing: "-0.02em",
            }}
          >
            Turni di servizio
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
            Ciclo a scalare (5 settimane) · lun–ven
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Impostazioni"
          style={{
            flexShrink: 0,
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            fontSize: "1.35rem",
            lineHeight: 1,
            color: "var(--text)",
          }}
        >
          ⚙
        </button>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #1e3a8a 100%)",
          borderRadius: "12px",
          padding: "0.65rem 0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onPrevYear}
            aria-label="Anno precedente"
            style={navBtnStyle}
          >
            ≪
          </button>
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mese precedente"
            style={navBtnStyle}
          >
            ‹
          </button>
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(0.85rem, 3.5vw, 1rem)",
              letterSpacing: "0.04em",
              minWidth: "10rem",
              textAlign: "center",
            }}
          >
            {title}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Mese successivo"
            style={navBtnStyle}
          >
            ›
          </button>
          <button
            type="button"
            onClick={onNextYear}
            aria-label="Anno successivo"
            style={navBtnStyle}
          >
            ≫
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--muted)",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        {WEEKDAY_SHORT.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "5px",
        }}
      >
        {cells.map(({ date, key }) => {
          if (!date) {
            return <div key={key} style={{ minHeight: "4.5rem" }} />;
          }
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          const isSunday = date.getDay() === 0;
          const shift = resolveDayShift(date, shiftSettings);
          const summary = shiftCellSummary(date, shiftSettings);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setDetailDate(date)}
              aria-label={`Dettaglio ${date.getDate()} ${MONTH_NAMES[month]} ${year}`}
              style={{
                minHeight: "4.5rem",
                border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "10px",
                padding: "4px 3px",
                background: isToday ? "var(--today)" : "var(--surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "3px",
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: isSunday ? "#dc2626" : "var(--text)",
                }}
              >
                {date.getDate()}
              </span>
              {shift ? (
                <span
                  style={{
                    fontSize: "0.62rem",
                    lineHeight: 1.25,
                    color: "var(--muted)",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {summary}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--muted)",
                    opacity: 0.6,
                  }}
                >
                  —
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p
        style={{
          margin: "1rem 0 0",
          fontSize: "0.78rem",
          color: "var(--muted)",
          lineHeight: 1.4,
        }}
      >
        Tocca un giorno per mattina, rientro pomeridiano e fascia oraria. In
        impostazioni puoi allineare il ciclo al tuo lunedì di partenza.
      </p>

      {detailDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-detail-title"
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
          onClick={() => setDetailDate(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "24rem",
              maxHeight: "85dvh",
              overflow: "auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.15rem 1.2rem",
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
                gap: "0.75rem",
                marginBottom: "0.85rem",
              }}
            >
              <h2
                id="shift-detail-title"
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  textTransform: "capitalize",
                }}
              >
                {detailTitle}
              </h2>
              <button
                type="button"
                onClick={() => setDetailDate(null)}
                aria-label="Chiudi"
                style={{
                  flexShrink: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  color: "var(--text)",
                }}
              >
                ×
              </button>
            </div>
            {!detailShift ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  lineHeight: 1.45,
                  color: "var(--muted)",
                }}
              >
                Riposo (sabato o domenica).
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                  lineHeight: 1.45,
                }}
              >
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                  Settimana nel ciclo:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {detailShift.weekInCycle + 1} di 5
                  </strong>{" "}
                  ({CYCLE_LABELS[detailShift.weekInCycle]})
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Mattina ({WEEKDAYS[detailShift.morningWeekday]}):</strong>{" "}
                  {detailShift.labels.morning}
                </p>
                {detailShift.afternoonWeekday === null ? (
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    Nessun rientro pomeridiano abbinato per questo giorno in
                    questa settimana di ciclo.
                  </p>
                ) : detailShift.afternoonWeekday ===
                  detailShift.morningWeekday ? (
                  <p style={{ margin: 0 }}>
                    <strong>Pomeriggio (stesso giorno):</strong>{" "}
                    {detailShift.labels.afternoon}
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    <strong>
                      Rientro pomeridiano (
                      {WEEKDAYS[detailShift.afternoonWeekday]}):
                    </strong>{" "}
                    {detailShift.labels.afternoon}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setDetailDate(null)}
              style={{
                marginTop: "1.1rem",
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
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid rgb(255 255 255 / 0.35)",
  background: "rgb(0 0 0 / 0.15)",
  color: "#fff",
  fontSize: "1.1rem",
  cursor: "pointer",
  lineHeight: 1,
};
