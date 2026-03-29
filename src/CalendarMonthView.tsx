import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { resolveDayNote, type AppSettings, type WeekdayIndex } from "./scheduleLogic";
import { glyphsFromScheduleLine } from "./wasteIcons";
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

type Props = {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  schedule: Record<WeekdayIndex, string>;
  settings: AppSettings;
  today: Date;
  onOpenSettings: () => void;
};

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/** Lunedì = 0 … domenica = 6 per il primo giorno del mese */
function mondayOffsetFirstOfMonth(y: number, m: number): number {
  const d = new Date(y, m, 1);
  const js = d.getDay();
  const monFirst = js === 0 ? 6 : js - 1;
  return monFirst;
}

function WasteIcon({ g }: { g: { letter: string; shape: string; color: string } }) {
  const size = 18;
  const fs = 10;
  if (g.shape === "circle") {
    return (
      <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r="8" fill={g.color} />
        <text
          x="9"
          y="12"
          textAnchor="middle"
          fill="#fff"
          fontSize={fs}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {g.letter}
        </text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path d="M9 1 L17 9 L9 17 L1 9 Z" fill={g.color} />
      <text
        x="9"
        y="12"
        textAnchor="middle"
        fill="#fff"
        fontSize={fs}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {g.letter}
      </text>
    </svg>
  );
}

export function CalendarMonthView({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  schedule,
  settings,
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

  const detailNote = detailDate
    ? resolveDayNote(detailDate, schedule, settings)
    : "";
  const detailGlyphs = detailNote ? glyphsFromScheduleLine(detailNote) : [];

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
            Promemoria rifiuti
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
            {settings.municipality.trim()
              ? `Comune di ${settings.municipality.trim()}`
              : "Tocca l’ingranaggio per impostare il comune"}
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
          background: "linear-gradient(135deg, #b91c1c 0%, #1e40af 100%)",
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
          const line = resolveDayNote(date, schedule, settings);
          const glyphs = glyphsFromScheduleLine(line);

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
                gap: "2px",
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
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "2px",
                }}
              >
                {glyphs.map((g, i) => (
                  <WasteIcon key={`${g.letter}-${i}`} g={g} />
                ))}
              </div>
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
        Tocca un giorno per il dettaglio del ritiro. Le icone (U, C, M, V, I)
        dipendono dai testi nelle impostazioni.
      </p>

      {detailDate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-title"
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
                id="day-detail-title"
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
            {detailGlyphs.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "0.85rem",
                }}
              >
                {detailGlyphs.map((g, i) => (
                  <WasteIcon key={`d-${g.letter}-${i}`} g={g} />
                ))}
              </div>
            )}
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                lineHeight: 1.45,
                color: "var(--text)",
              }}
            >
              {detailNote || "Nessun ritiro indicato per questo giorno."}
            </p>
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
