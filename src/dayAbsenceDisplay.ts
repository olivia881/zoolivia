import type { DayServiceEntry } from "./dayLogModel";

/** Sabato o domenica (0=lun … 6=dom): per etichetta opzionale in griglia. */
export function isWeekendIndex(dayIndexFromMonday: number): boolean {
  return dayIndexFromMonday >= 5;
}

/**
 * Nasconde i campi turno (prime fasce + straord.) e mostra una sola riga di stato.
 * Sabato e domenica restano modificabili salvo assenze come in settimana.
 */
export function shouldHideShiftInputs(e: DayServiceEntry): boolean {
  return (
    e.festivo ||
    e.riposoSettimanale ||
    e.congedoOrdinario ||
    e.congedoStraordMalattia ||
    e.congedoStraordFamiglia ||
    e.pnl ||
    e.congedoParentale
  );
}

/**
 * Testo unico al posto dei turni (permessi + BP se presenti).
 */
export function mainStatusLine(e: DayServiceEntry): string {
  const parts: string[] = [];
  if (e.festivo) parts.push("Festivo");
  if (e.congedoOrdinario) parts.push("C.O.");
  if (e.congedoStraordMalattia) parts.push("C.S. malattia");
  if (e.congedoStraordFamiglia) parts.push("C.S. famiglia");
  if (e.pnl) parts.push("PNL");
  if (e.congedoParentale) parts.push("C.P.");
  if (e.riposoSettimanale) parts.push("RS");
  if (e.buonoPasto) parts.push("BP");
  return parts.join(" · ");
}

export type AbsenceFlagKey =
  | "festivo"
  | "riposoSettimanale"
  | "congedoOrdinario"
  | "congedoStraordMalattia"
  | "congedoStraordFamiglia"
  | "pnl"
  | "congedoParentale";

/** Se attivi uno di questi, si svuotano le fasce orarie (non il BP da solo). */
export function absenceFlagClearsShifts(key: string): boolean {
  return (
    key === "festivo" ||
    key === "riposoSettimanale" ||
    key === "congedoOrdinario" ||
    key === "congedoStraordMalattia" ||
    key === "congedoStraordFamiglia" ||
    key === "pnl" ||
    key === "congedoParentale"
  );
}
