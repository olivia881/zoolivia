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
  absenceFlagClearsShifts,
  mainStatusLine,
  shouldHideShiftInputs,
} from "./dayAbsenceDisplay";
import {
  emptyDayEntry,
  hasDayEntryContent,
  toYmd,
  type DayServiceEntry,
} from "./dayLogModel";
import { getDayLog } from "./dayLogStorage";
import { aggregateMonthTotals } from "./monthTotals";
import {
  mondayOfWeekContaining,
  resolveDayShift,
  shiftTimeLabels,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import {
  applyScalingShiftToWeek,
  weekCycleSummary,
} from "./weekShiftApply";

const SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

type Props = {
  weekAnchor: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onShowMonth: () => void;
  shiftSettings: ShiftAppSettings;
  today: Date;
  onOpenSettings: () => void;
  dayLogs: Record<string, DayServiceEntry>;
  setDayLogs: Dispatch<SetStateAction<Record<string, DayServiceEntry>>>;
};

const inp: CSSProperties = {
  width: "100%",
  padding: "0.35rem 0.4rem",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  font: "inherit",
  fontSize: "0.78rem",
};

function startOfMondayWeek(d: Date): Date {
  const m = mondayOfWeekContaining(d);
  return new Date(m.getFullYear(), m.getMonth(), m.getDate());
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function formatWeekRangeIt(monday: Date): string {
  const sun = addDays(monday, 6);
  const f = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  });
  return `${f.format(monday)} – ${f.format(sun)} ${sun.getFullYear()}`;
}

export function ShiftWeekGridView({
  weekAnchor,
  onPrevWeek,
  onNextWeek,
  onShowMonth,
  shiftSettings,
  today,
  onOpenSettings,
  dayLogs,
  setDayLogs,
}: Props) {
  const monday = useMemo(
    () => startOfMondayWeek(weekAnchor),
    [weekAnchor]
  );

  const weekDays = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) out.push(addDays(monday, i));
    return out;
  }, [monday]);

  const [editorDate, setEditorDate] = useState<Date | null>(null);
  const [draftEntry, setDraftEntry] = useState<DayServiceEntry>(emptyDayEntry);

  useEffect(() => {
    if (!editorDate) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setEditorDate(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [editorDate]);

  function openEditor(d: Date) {
    setEditorDate(d);
    setDraftEntry({ ...getDayLog(dayLogs, toYmd(d)) });
  }

  function patchDay(ymd: string, patch: Partial<DayServiceEntry>) {
    setDayLogs((prev) => {
      let cur = { ...(prev[ymd] ?? emptyDayEntry()), ...patch };
      const turnedOnAbsence = Object.keys(patch).some(
        (k) =>
          absenceFlagClearsShifts(k) && Boolean(patch[k as keyof DayServiceEntry])
      );
      if (turnedOnAbsence) {
        cur = {
          ...cur,
          mattina: "",
          pomeriggioRientro: "",
          straordinarioOre: "",
        };
      }
      const next = { ...prev };
      if (hasDayEntryContent(cur)) next[ymd] = cur;
      else delete next[ymd];
      return next;
    });
  }

  function persistEditor() {
    if (!editorDate) return;
    const ymd = toYmd(editorDate);
    setDayLogs((prev) => {
      const next = { ...prev };
      if (hasDayEntryContent(draftEntry)) next[ymd] = { ...draftEntry };
      else delete next[ymd];
      return next;
    });
    setEditorDate(null);
  }

  function clearEditorDay() {
    if (!editorDate) return;
    const ymd = toYmd(editorDate);
    setDayLogs((prev) => {
      const next = { ...prev };
      delete next[ymd];
      return next;
    });
    setEditorDate(null);
  }

  const monthTotals = useMemo(() => {
    const y = monday.getFullYear();
    const m = monday.getMonth();
    return aggregateMonthTotals(y, m, dayLogs);
  }, [monday, dayLogs]);

  const cycleHint = weekCycleSummary(monday, shiftSettings);
  const office1 = shiftSettings.officeLine1.trim();
  const office2 = shiftSettings.officeLine2.trim();

  const editorTitle = editorDate
    ? new Intl.DateTimeFormat("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(editorDate)
    : "";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "clamp(1rem, 3.5vw, 1.25rem)",
              fontWeight: 700,
              margin: "0 0 0.2rem",
              color: "var(--text)",
            }}
          >
            Turni di servizio
          </h1>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
            Vista settimanale — dettagli per giorno
          </p>
          {(office1 || office2) && (
            <p
              style={{
                margin: "0.35rem 0 0",
                fontSize: "0.72rem",
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
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            fontSize: "1.25rem",
            color: "var(--text)",
          }}
        >
          ⚙
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          marginBottom: "0.65rem",
        }}
      >
        <button
          type="button"
          onClick={onShowMonth}
          style={{
            flex: 1,
            padding: "0.45rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface-muted)",
            color: "var(--text)",
            font: "inherit",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Calendario mese
        </button>
        <span
          style={{
            flex: 1,
            padding: "0.45rem",
            borderRadius: "10px",
            border: "1px solid var(--accent)",
            background: "var(--accent-soft)",
            color: "var(--text)",
            fontSize: "0.82rem",
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Settimana
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.35rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onPrevWeek}
          style={navBtn}
          aria-label="Settimana precedente"
        >
          ‹
        </button>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.88rem",
            textAlign: "center",
            flex: 1,
            minWidth: "10rem",
            color: "var(--text)",
          }}
        >
          {formatWeekRangeIt(monday)}
        </span>
        <button
          type="button"
          onClick={onNextWeek}
          style={navBtn}
          aria-label="Settimana successiva"
        >
          ›
        </button>
      </div>

      {cycleHint && (
        <p
          style={{
            margin: "0 0 0.5rem",
            fontSize: "0.76rem",
            color: "var(--muted)",
            lineHeight: 1.35,
          }}
        >
          {cycleHint}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setDayLogs((prev) =>
            applyScalingShiftToWeek(monday, shiftSettings, prev)
          );
        }}
        style={{
          width: "100%",
          marginBottom: "0.75rem",
          padding: "0.65rem 0.75rem",
          borderRadius: "12px",
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          font: "inherit",
          fontWeight: 700,
          fontSize: "0.88rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgb(0 0 0 / 0.15)",
        }}
      >
        Applica turno a scalare a questa settimana
      </button>
      <p
        style={{
          margin: "-0.45rem 0 0.75rem",
          fontSize: "0.7rem",
          color: "var(--muted)",
          lineHeight: 1.35,
        }}
      >
        Una <strong>coppia di giorni</strong> per settimana (es. lun–mer): prima fascia sul primo
        giorno, seconda sull’altro. Sab/dom invariati. Modificabile a mano.
      </p>

      <div
        style={{
          overflowX: "auto",
          marginBottom: "0.75rem",
          paddingBottom: "0.35rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            minWidth: "calc(7 * 148px + 6 * 0.5rem)",
          }}
        >
          {weekDays.map((date, idx) => {
            const ymd = toYmd(date);
            const e = getDayLog(dayLogs, ymd);
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();
            const hideTurno = shouldHideShiftInputs(e, idx);
            const statusLine = mainStatusLine(e, idx);

            return (
              <div
                key={ymd}
                style={{
                  flex: "0 0 148px",
                  width: 148,
                  background: "var(--surface)",
                  border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "12px",
                  padding: "0.5rem 0.45rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: idx === 6 ? "#f87171" : "var(--text)",
                    }}
                  >
                    {SHORT[idx]} {date.getDate()}/{date.getMonth() + 1}
                  </div>
                </div>

                {hideTurno ? (
                  <div
                    style={{
                      minHeight: "4.5rem",
                      padding: "0.5rem 0.35rem",
                      borderRadius: "8px",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {statusLine || "—"}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={e.mattina}
                      onChange={(ev) =>
                        patchDay(ymd, { mattina: ev.target.value })
                      }
                      placeholder="9:00–15:00"
                      style={inp}
                      aria-label={`Prima fascia ${SHORT[idx]}`}
                    />
                    <input
                      type="text"
                      value={e.pomeriggioRientro}
                      onChange={(ev) =>
                        patchDay(ymd, { pomeriggioRientro: ev.target.value })
                      }
                      placeholder="15:30–18:30"
                      style={inp}
                      aria-label={`Seconda fascia ${SHORT[idx]}`}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={e.straordinarioOre}
                      onChange={(ev) =>
                        patchDay(ymd, { straordinarioOre: ev.target.value })
                      }
                      placeholder="Straord. h"
                      style={inp}
                    />
                  </>
                )}
                <div>
                  <textarea
                    value={e.servizioFuoriSede}
                    onChange={(ev) =>
                      patchDay(ymd, { servizioFuoriSede: ev.target.value })
                    }
                    rows={2}
                    placeholder="Fuori sede"
                    style={{ ...inp, resize: "vertical", minHeight: "2.2rem" }}
                  />
                </div>
                <textarea
                  value={e.altroNote}
                  onChange={(ev) =>
                    patchDay(ymd, { altroNote: ev.target.value })
                  }
                  rows={2}
                  placeholder="Note"
                  style={{ ...inp, resize: "vertical", minHeight: "2.2rem" }}
                />

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.2rem",
                    fontSize: "0.62rem",
                  }}
                >
                  {[
                    ["Fest.", e.festivo, "festivo"],
                    ["C.O.", e.congedoOrdinario, "congedoOrdinario"],
                    ["C.S.m", e.congedoStraordMalattia, "congedoStraordMalattia"],
                    ["C.S.f", e.congedoStraordFamiglia, "congedoStraordFamiglia"],
                    ["PNL", e.pnl, "pnl"],
                    ["C.P.", e.congedoParentale, "congedoParentale"],
                    ["BP", e.buonoPasto, "buonoPasto"],
                  ].map(([lab, on, key]) => (
                    <label
                      key={key as string}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.15rem",
                        cursor: "pointer",
                        color: "var(--text)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={on as boolean}
                        onChange={(ev) => {
                          const v = ev.target.checked;
                          const patch: Partial<DayServiceEntry> = {};
                          if (key === "festivo") patch.festivo = v;
                          else if (key === "congedoOrdinario")
                            patch.congedoOrdinario = v;
                          else if (key === "congedoStraordMalattia")
                            patch.congedoStraordMalattia = v;
                          else if (key === "congedoStraordFamiglia")
                            patch.congedoStraordFamiglia = v;
                          else if (key === "pnl") patch.pnl = v;
                          else if (key === "congedoParentale")
                            patch.congedoParentale = v;
                          else if (key === "buonoPasto") patch.buonoPasto = v;
                          patchDay(ymd, patch);
                        }}
                      />
                      {lab}
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => openEditor(date)}
                  style={{
                    marginTop: "auto",
                    padding: "0.35rem",
                    borderRadius: "8px",
                    border: "1px dashed var(--border)",
                    background: "transparent",
                    color: "var(--muted)",
                    font: "inherit",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  Scheda completa…
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "0.75rem 0.85rem",
          fontSize: "0.78rem",
          color: "var(--muted)",
        }}
      >
        <strong style={{ color: "var(--text)" }}>
          Conteggi del mese ({monday.toLocaleString("it-IT", { month: "long" })})
        </strong>
        <ul
          style={{
            margin: "0.45rem 0 0",
            paddingLeft: "1rem",
            lineHeight: 1.45,
          }}
        >
          <li>Ore mattina+rientro: {monthTotals.oreDaFasceMattinaPomeriggio} h</li>
          <li>Straord.: {monthTotals.oreStraordinario} h · Fuori sede: {monthTotals.oreServizioFuoriSede} h</li>
          <li>
            Buoni pasto: {monthTotals.buoniPasto} · Festivi (flag):{" "}
            {monthTotals.giorniFestivi} · Giorni annotati:{" "}
            {monthTotals.giorniConAnnotazioni}
          </li>
        </ul>
      </section>

      {editorDate && (
        <DayEditorSheet
          detailTitle={editorTitle}
          detailDate={editorDate}
          entry={draftEntry}
          setEntry={setDraftEntry}
          shiftSettings={shiftSettings}
          onClose={persistEditor}
          onApplyPlanned={() => {
            const planned = resolveDayShift(editorDate, shiftSettings);
            if (!planned) return;
            const lab = shiftTimeLabels(shiftSettings.timeVariant);
            const norm = (s: string) =>
              s.replace(/\s/g, "").replace(/–/g, "-").replace(/—/g, "-");
            setDraftEntry((x) => ({
              ...x,
              mattina: norm(lab.morning),
              pomeriggioRientro:
                planned.afternoonWeekday !== null
                  ? norm(lab.afternoon)
                  : x.pomeriggioRientro,
            }));
          }}
          onClearDay={clearEditorDay}
        />
      )}
    </div>
  );
}

const navBtn: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "1.2rem",
  cursor: "pointer",
  lineHeight: 1,
};
