import type { DayServiceEntry } from "./dayLogModel";

/** Sabato o domenica: niente turni standard nella griglia. */
export function isWeekendIndex(dayIndexFromMonday: number): boolean {
  return dayIndexFromMonday >= 5;
}

/**
 * Nasconde i campi turno (prime fasce + straord.) e mostra una sola riga di stato.
 */
export function shouldHideShiftInputs(
  e: DayServiceEntry,
  dayIndexFromMonday: number
): boolean {
  if (isWeekendIndex(dayIndexFromMonday)) return true;
  return (
    e.festivo ||
    e.congedoOrdinario ||
    e.congedoStraordMalattia ||
    e.congedoStraordFamiglia ||
    e.pnl ||
    e.congedoParentale
  );
}

/**
 * Testo unico al posto dei turni (weekend + permessi + BP se presenti).
 */
export function mainStatusLine(
  e: DayServiceEntry,
  dayIndexFromMonday: number
): string {
  const parts: string[] = [];
  if (isWeekendIndex(dayIndexFromMonday)) parts.push("Weekend");
  if (e.festivo) parts.push("Festivo");
  if (e.congedoOrdinario) parts.push("C.O.");
  if (e.congedoStraordMalattia) parts.push("C.S. malattia");
  if (e.congedoStraordFamiglia) parts.push("C.S. famiglia");
  if (e.pnl) parts.push("PNL");
  if (e.congedoParentale) parts.push("C.P.");
  if (e.buonoPasto) parts.push("BP");
  return parts.join(" · ");
}

export type AbsenceFlagKey =
  | "festivo"
  | "congedoOrdinario"
  | "congedoStraordMalattia"
  | "congedoStraordFamiglia"
  | "pnl"
  | "congedoParentale";

/** Se attivi uno di questi, si svuotano le fasce orarie (non il BP da solo). */
export function absenceFlagClearsShifts(key: string): boolean {
  return (
    key === "festivo" ||
    key === "congedoOrdinario" ||
    key === "congedoStraordMalattia" ||
    key === "congedoStraordFamiglia" ||
    key === "pnl" ||
    key === "congedoParentale"
  );
}
