import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { DayEditorSheet } from "./DayEditorSheet";
import {
  dayEntryCellTags,
  emptyDayEntry,
  hasDayEntryContent,
  toYmd,
  type DayServiceEntry,
} from "./dayLogModel";
import { getDayLog } from "./dayLogStorage";
import { aggregateMonthTotals } from "./monthTotals";
import {
  resolveDayShift,
  shiftTimeLabels,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import { shiftCellSummary } from "./shiftVoiceReminder";

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
  shiftSettings: ShiftAppSettings;
  today: Date;
  onOpenSettings: () => void;
  dayLogs: Record<string, DayServiceEntry>;
  setDayLogs: Dispatch<SetStateAction<Record<string, DayServiceEntry>>>;
};

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function mondayOffsetFirstOfMonth(y: number, m: number): number {
  const d = new Date(y, m, 1);
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

function formatMonthRangeIt(y: number, m: number): string {
  const first = new Date(y, m, 1);
  const last = new Date(y, m, daysInMonth(y, m));
  const a = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(first);
  const b = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(last);
  return `${a} – ${b}`;
}

function cellLine(
  date: Date,
  settings: ShiftAppSettings,
  entry: DayServiceEntry
): string {
  const planned = shiftCellSummary(date, settings);
  const chunks: string[] = [];
  if (planned) chunks.push(planned);
  const tags = dayEntryCellTags(entry);
  if (tags.length) chunks.push(tags.join(" "));
  if (entry.mattina.trim()) {
    const t = entry.mattina.trim().replace(/\s+/g, " ");
    chunks.push(t.length > 16 ? `${t.slice(0, 16)}…` : t);
  } else if (entry.pomeriggioRientro.trim() && !planned) {
    const t = entry.pomeriggioRientro.trim();
    chunks.push(t.length > 16 ? `${t.slice(0, 16)}…` : t);
  }
  if (chunks.length === 0) return "";
  return chunks.join(" · ");
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
  dayLogs,
  setDayLogs,
}: Props) {
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [draftEntry, setDraftEntry] = useState<DayServiceEntry>(emptyDayEntry);
  const [totalsOpen, setTotalsOpen] = useState(true);

  useEffect(() => {
    if (!detailDate) return;
    setDraftEntry({ ...getDayLog(dayLogs, toYmd(detailDate)) });
  }, [detailDate, dayLogs]);

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
  const monthRange = formatMonthRangeIt(year, month);

  const detailTitle = detailDate
    ? new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(detailDate)
    : "";

  const totals = useMemo(
    () => aggregateMonthTotals(year, month, dayLogs),
    [year, month, dayLogs]
  );

  function persistAndClose() {
    if (!detailDate) {
      setDetailDate(null);
      return;
    }
    const ymd = toYmd(detailDate);
    setDayLogs((prev) => {
      const next = { ...prev };
      if (hasDayEntryContent(draftEntry)) {
        next[ymd] = { ...draftEntry };
      } else {
        delete next[ymd];
      }
      return next;
    });
    setDetailDate(null);
  }

  function clearDayFromStorage() {
    if (!detailDate) return;
    const ymd = toYmd(detailDate);
    setDayLogs((prev) => {
      const next = { ...prev };
      delete next[ymd];
      return next;
    });
    setDetailDate(null);
  }

  function applyPlannedToDraft() {
    if (!detailDate) return;
    const planned = resolveDayShift(detailDate, shiftSettings);
    if (!planned) return;
    const lab = shiftTimeLabels(shiftSettings.timeVariant);
    const norm = (s: string) =>
      s.replace(/\s/g, "").replace(/–/g, "-").replace(/—/g, "-");
    setDraftEntry((e) => ({
      ...e,
      mattina: norm(lab.morning),
      pomeriggioRientro:
        planned.afternoonWeekday !== null
          ? norm(lab.afternoon)
          : e.pomeriggioRientro,
    }));
  }

  const office1 = shiftSettings.officeLine1.trim();
  const office2 = shiftSettings.officeLine2.trim();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              fontSize: "clamp(1.05rem, 3.8vw, 1.35rem)",
              fontWeight: 700,
              margin: "0 0 0.15rem",
              letterSpacing: "-0.02em",
            }}
          >
            Servizio mensile
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>
            {monthRange}
          </p>
          {(office1 || office2) && (
            <p
              style={{
                margin: "0.35rem 0 0",
                fontSize: "0.78rem",
                color: "var(--text)",
                lineHeight: 1.35,
              }}
            >
              {office1 && <span style={{ display: "block" }}>{office1}</span>}
              {office2 && <span style={{ display: "block" }}>{office2}</span>}
            </p>
          )}
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
              fontSize: "clamp(0.8rem, 3.2vw, 0.95rem)",
              letterSpacing: "0.04em",
              minWidth: "9rem",
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
          gap: "3px",
          fontSize: "0.65rem",
          fontWeight: 600,
          color: "var(--muted)",
          marginBottom: "5px",
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
          gap: "4px",
        }}
      >
        {cells.map(({ date, key }) => {
          if (!date) {
            return <div key={key} style={{ minHeight: "5.1rem" }} />;
          }
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          const isSunday = date.getDay() === 0;
          const ymd = toYmd(date);
          const entry = getDayLog(dayLogs, ymd);
          const line = cellLine(date, shiftSettings, entry);
          const hasUser = hasDayEntryContent(entry);
          const planned = resolveDayShift(date, shiftSettings);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setDetailDate(date)}
              aria-label={`Modifica ${date.getDate()} ${MONTH_NAMES[month]} ${year}`}
              style={{
                minHeight: "5.1rem",
                border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "9px",
                padding: "3px 2px",
                background: isToday ? "var(--today)" : "var(--surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                gap: "2px",
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: isSunday ? "#dc2626" : "var(--text)",
                  textAlign: "center",
                }}
              >
                {date.getDate()}
              </span>
              <span
                style={{
                  fontSize: "0.58rem",
                  lineHeight: 1.2,
                  color: hasUser ? "var(--text)" : "var(--muted)",
                  fontWeight: hasUser ? 600 : 500,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                  wordBreak: "break-word",
                  padding: "0 1px",
                }}
              >
                {line ||
                  (planned
                    ? shiftCellSummary(date, shiftSettings)
                    : "—")}
              </span>
            </button>
          );
        })}
      </div>

      <section
        style={{
          marginTop: "1rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setTotalsOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 0.9rem",
            border: "none",
            background: "transparent",
            font: "inherit",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: "var(--text)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Conteggi del mese
          <span aria-hidden style={{ color: "var(--muted)" }}>
            {totalsOpen ? "▼" : "▶"}
          </span>
        </button>
        {totalsOpen && (
          <div
            style={{
              padding: "0 0.9rem 0.9rem",
              fontSize: "0.82rem",
              lineHeight: 1.5,
              color: "var(--muted)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <p style={{ margin: "0.65rem 0 0.5rem", fontSize: "0.75rem" }}>
              Le ore da turno si calcolano dagli intervalli scritti come{" "}
              <code style={{ fontSize: "0.7rem" }}>08:00-14:00</code>. Straordinario
              e servizi usano i campi «ore» (numero).
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "1.1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni annotati:</strong>{" "}
                {totals.giorniConAnnotazioni}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Ore da mattina + rientro:</strong>{" "}
                {totals.oreDaFasceMattinaPomeriggio} h
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Straordinario:</strong>{" "}
                {totals.oreStraordinario} h
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Servizio esterno:</strong>{" "}
                {totals.oreServizioEsterno} h
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Fuori sede:</strong>{" "}
                {totals.oreServizioFuoriSede} h
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni C.O.:</strong>{" "}
                {totals.giorniCongedoOrdinario}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni C.S. malattia:</strong>{" "}
                {totals.giorniCongedoStraordMalattia}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni C.S. famiglia:</strong>{" "}
                {totals.giorniCongedoStraordFamiglia}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni PNL:</strong>{" "}
                {totals.giorniPnl}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Giorni C.P.:</strong>{" "}
                {totals.giorniCongedoParentale}
              </li>
              <li>
                <strong style={{ color: "var(--text)" }}>Buoni pasto:</strong>{" "}
                {totals.buoniPasto}
              </li>
            </ul>
          </div>
        )}
      </section>

      <p
        style={{
          margin: "0.85rem 0 0",
          fontSize: "0.75rem",
          color: "var(--muted)",
          lineHeight: 1.4,
        }}
      >
        Tocca un giorno per compilare turni, permessi e note. Il turno a scalare è
        suggerito; puoi sovrascrivere liberamente i campi.
      </p>

      {detailDate && (
        <DayEditorSheet
          detailTitle={detailTitle}
          detailDate={detailDate}
          entry={draftEntry}
          setEntry={setDraftEntry}
          shiftSettings={shiftSettings}
          onClose={persistAndClose}
          onApplyPlanned={applyPlannedToDraft}
          onClearDay={clearDayFromStorage}
        />
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
