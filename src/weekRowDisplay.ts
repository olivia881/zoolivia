import { shouldHideShiftInputs, mainStatusLine } from "./dayAbsenceDisplay";
import type { DayServiceEntry } from "./dayLogModel";
import {
  formatTimeRangeForCalendar,
  plannedShiftCalendarText,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";

/**
 * Testo “turno” per riga settimanale / PDF: allineato alla vista mensile
 * (tag + orari; senza turno teorico se Fest./C.O./…).
 */
export function effectiveWeekTurnText(
  date: Date,
  settings: ShiftAppSettings,
  entry: DayServiceEntry
): string {
  const m = entry.mattina.trim();
  const p = entry.pomeriggioRientro.trim();

  if (shouldHideShiftInputs(entry)) {
    const status = mainStatusLine(entry);
    const lines: string[] = [];
    if (m) lines.push(formatTimeRangeForCalendar(m));
    if (p) lines.push(formatTimeRangeForCalendar(p));
    const timeBlock = lines.filter(Boolean).join(" · ");
    const parts = [status, timeBlock].filter(Boolean);
    return parts.join(" — ") || "—";
  }

  if (m || p) {
    const lines: string[] = [];
    if (m) lines.push(formatTimeRangeForCalendar(m));
    if (p) lines.push(formatTimeRangeForCalendar(p));
    return lines.filter(Boolean).join(" · ");
  }

  return plannedShiftCalendarText(date, settings) || "—";
}

/** Seconda colonna: straord., fuori sede, corsi, note, servizi esterni. */
export function weekDetailExtraText(entry: DayServiceEntry): string {
  const parts: string[] = [];
  if (entry.straordinarioOre.trim())
    parts.push(`Straord.: ${entry.straordinarioOre.trim()} h`);
  if (entry.servizioEsterno.trim() || entry.servizioEsternoOre.trim()) {
    const se = [entry.servizioEsterno.trim(), entry.servizioEsternoOre.trim()]
      .filter(Boolean)
      .join(" ");
    parts.push(`Esterno: ${se}`);
  }
  if (entry.servizioFuoriSede.trim() || entry.servizioFuoriSedeOre.trim()) {
    const sf = [entry.servizioFuoriSede.trim(), entry.servizioFuoriSedeOre.trim()]
      .filter(Boolean)
      .join(" ");
    parts.push(`Fuori sede: ${sf}`);
  }
  if (entry.corsiFormazione.trim())
    parts.push(`Corsi: ${entry.corsiFormazione.trim()}`);
  if (entry.altroNote.trim()) parts.push(`Note: ${entry.altroNote.trim()}`);
  return parts.join("\n") || "—";
}
