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
  /** Festivo (lun–ven: es. chiusura; sab/dom usano anche “Weekend”) */
  festivo: boolean;
  /** Riposo settimanale (RS) — default sab/dom se giorno non salvato */
  riposoSettimanale: boolean;
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
    festivo: false,
    riposoSettimanale: false,
    corsiFormazione: "",
    altroNote: "",
  };
}

/** Sabato o domenica (getDay JS: 0=dom, 6=sab). */
export function isWeekendJsDate(date: Date): boolean {
  const js = date.getDay();
  return js === 0 || js === 6;
}

/** Voce predefinita per sab/dom quando non c’è ancora nulla salvato per quel giorno. */
export function defaultEntryForWeekendIfUnset(date: Date): DayServiceEntry {
  if (!isWeekendJsDate(date)) return emptyDayEntry();
  return { ...emptyDayEntry(), riposoSettimanale: true };
}

/** Dati effettivi per calendario, PDF e conteggi: sab/dom senza riga salvata = RS predefinito. */
export function getEffectiveDayLog(
  map: Record<string, DayServiceEntry>,
  date: Date
): DayServiceEntry {
  const key = toYmd(date);
  const saved = map[key];
  if (saved) return saved;
  return defaultEntryForWeekendIfUnset(date);
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function parseYmdToDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day)
    return null;
  return d;
}

/** Base per merge in patch: sab/dom senza riga salvata = RS predefinito. */
export function baseDayLogForPatch(
  map: Record<string, DayServiceEntry>,
  ymd: string
): DayServiceEntry {
  const saved = map[ymd];
  if (saved) return { ...saved };
  const d = parseYmdToDate(ymd);
  if (d && isWeekendJsDate(d)) return defaultEntryForWeekendIfUnset(d);
  return { ...emptyDayEntry() };
}

function toMinutes(h: number, mi: number): number {
  return h * 60 + mi;
}

/** Segmento tra due orari (stesso giorno o oltre mezzanotte). */
function segmentHours(fromM: number, toM: number): number {
  let end = toM;
  if (end <= fromM) end += 24 * 60;
  return (end - fromM) / 60;
}

/**
 * Somma ore da testo libero:
 * - Più blocchi separati da spazio: `9:00-12:00 14:00-18:00`
 * - Catena con trattini: `7:00-13:00-13:30-16:30` (somma i segmenti consecutivi)
 * - Slash come separatore: `9.00/15.00` o `9:00/15:00`
 */
export function parseHoursFromTimeRanges(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  let total = 0;

  const slashRe =
    /(\d{1,2})\s*[.:]\s*(\d{2})\s*\/\s*(\d{1,2})\s*[.:]\s*(\d{2})/g;
  let sm: RegExpExecArray | null;
  while ((sm = slashRe.exec(t)) !== null) {
    const h1 = Number(sm[1]);
    const mi1 = Number(sm[2]);
    const h2 = Number(sm[3]);
    const mi2 = Number(sm[4]);
    if (
      [h1, mi1, h2, mi2].some(
        (n) => !Number.isFinite(n) || n < 0 || mi1 > 59 || mi2 > 59
      )
    )
      continue;
    total += segmentHours(toMinutes(h1, mi1), toMinutes(h2, mi2));
  }

  const tNoSlash = t.replace(
    /(\d{1,2})\s*[.:]\s*(\d{2})\s*\/\s*(\d{1,2})\s*[.:]\s*(\d{2})/g,
    ""
  );

  const parts = tNoSlash.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    const times = [...part.matchAll(/(\d{1,2})\s*[.:]\s*(\d{2})/g)];
    if (times.length < 2) continue;
    const mins = times.map((m) => {
      const h = Number(m[1]);
      const mi = Number(m[2]);
      if (!Number.isFinite(h) || mi > 59 || mi < 0) return -1;
      return toMinutes(h, mi);
    });
    if (mins.some((x) => x < 0)) continue;
    for (let i = 0; i < mins.length - 1; i++) {
      total += segmentHours(mins[i], mins[i + 1]);
    }
  }

  return Math.round(total * 100) / 100;
}

export function parseDecimalHours(s: string): number {
  const x = s.replace(",", ".").trim();
  if (!x) return 0;
  const n = Number.parseFloat(x);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

function hasTextOrServiceFields(e: DayServiceEntry): boolean {
  if (e.mattina.trim()) return true;
  if (e.pomeriggioRientro.trim()) return true;
  if (e.straordinarioOre.trim()) return true;
  if (e.servizioEsterno.trim() || e.servizioEsternoOre.trim()) return true;
  if (e.servizioFuoriSede.trim() || e.servizioFuoriSedeOre.trim()) return true;
  if (e.corsiFormazione.trim()) return true;
  if (e.altroNote.trim()) return true;
  return false;
}

/**
 * `forDate`: se è sab/dom e l’utente ha tolto il RS senza altri dati, resta “contenuto” da salvare.
 */
export function hasDayEntryContent(
  e: DayServiceEntry,
  forDate?: Date
): boolean {
  if (hasTextOrServiceFields(e)) return true;
  if (e.buonoPasto) return true;
  if (
    e.festivo ||
    e.riposoSettimanale ||
    e.congedoOrdinario ||
    e.congedoStraordMalattia ||
    e.congedoStraordFamiglia ||
    e.pnl ||
    e.congedoParentale
  )
    return true;
  if (
    forDate &&
    isWeekendJsDate(forDate) &&
    !e.riposoSettimanale &&
    !e.festivo &&
    !e.congedoOrdinario &&
    !e.congedoStraordMalattia &&
    !e.congedoStraordFamiglia &&
    !e.pnl &&
    !e.congedoParentale &&
    !e.buonoPasto
  ) {
    return true;
  }
  return false;
}

/** Etichette compatte per la cella del calendario */
export function dayEntryCellTags(e: DayServiceEntry): string[] {
  const tags: string[] = [];
  if (e.festivo) tags.push("Fest.");
  if (e.congedoOrdinario) tags.push("C.O.");
  if (e.congedoStraordMalattia) tags.push("C.S. mal.");
  if (e.congedoStraordFamiglia) tags.push("C.S. fam.");
  if (e.pnl) tags.push("PNL");
  if (e.congedoParentale) tags.push("C.P.");
  if (e.riposoSettimanale) tags.push("RS");
  if (e.buonoPasto) tags.push("BP");
  return tags;
}
