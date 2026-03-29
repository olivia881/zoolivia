/** Annotazioni giornaliere (repertorio servizio / polizia scientifica). */

export type DayServiceEntry = {
  mattina: string;
  pomeriggioRientro: string;
  straordinarioOre: string;
  servizioEsterno: string;
  servizioEsternoOre: string;
  servizioFuoriSede: string;
  servizioFuoriSedeOre: string;
  congedoOrdinario: boolean;
  congedoStraordMalattia: boolean;
  congedoStraordFamiglia: boolean;
  pnl: boolean;
  congedoParentale: boolean;
  buonoPasto: boolean;
  corsiFormazione: string;
  altroNote: string;
};

export function emptyDayEntry(): DayServiceEntry {
  return {
    mattina: "",
    pomeriggioRientro: "",
    straordinarioOre: "",
    servizioEsterno: "",
    servizioEsternoOre: "",
    servizioFuoriSede: "",
    servizioFuoriSedeOre: "",
    congedoOrdinario: false,
    congedoStraordMalattia: false,
    congedoStraordFamiglia: false,
    pnl: false,
    congedoParentale: false,
    buonoPasto: false,
    corsiFormazione: "",
    altroNote: "",
  };
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Somma ore da stringhe tipo "08:00-14:00" o "8.00-14.00" (più intervalli nella stessa stringa). */
export function parseHoursFromTimeRanges(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  let total = 0;
  const re = /(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const h1 = Number(m[1]);
    const mi1 = Number(m[2]);
    const h2 = Number(m[3]);
    const mi2 = Number(m[4]);
    if (
      [h1, mi1, h2, mi2].some((n) => !Number.isFinite(n) || n < 0 || mi1 > 59 || mi2 > 59)
    )
      continue;
    const start = h1 * 60 + mi1;
    let end = h2 * 60 + mi2;
    if (end <= start) end += 24 * 60;
    total += (end - start) / 60;
  }
  return Math.round(total * 100) / 100;
}

export function parseDecimalHours(s: string): number {
  const x = s.replace(",", ".").trim();
  if (!x) return 0;
  const n = Number.parseFloat(x);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

export function hasDayEntryContent(e: DayServiceEntry): boolean {
  if (e.mattina.trim()) return true;
  if (e.pomeriggioRientro.trim()) return true;
  if (e.straordinarioOre.trim()) return true;
  if (e.servizioEsterno.trim() || e.servizioEsternoOre.trim()) return true;
  if (e.servizioFuoriSede.trim() || e.servizioFuoriSedeOre.trim()) return true;
  if (e.corsiFormazione.trim()) return true;
  if (e.altroNote.trim()) return true;
  if (e.buonoPasto) return true;
  if (
    e.congedoOrdinario ||
    e.congedoStraordMalattia ||
    e.congedoStraordFamiglia ||
    e.pnl ||
    e.congedoParentale
  )
    return true;
  return false;
}

/** Etichette compatte per la cella del calendario */
export function dayEntryCellTags(e: DayServiceEntry): string[] {
  const tags: string[] = [];
  if (e.congedoOrdinario) tags.push("C.O.");
  if (e.congedoStraordMalattia) tags.push("C.S. mal.");
  if (e.congedoStraordFamiglia) tags.push("C.S. fam.");
  if (e.pnl) tags.push("PNL");
  if (e.congedoParentale) tags.push("C.P.");
  if (e.buonoPasto) tags.push("BP");
  return tags;
}
