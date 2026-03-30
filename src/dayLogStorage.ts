import {
  emptyDayEntry,
  type DayServiceEntry,
} from "./dayLogModel";

const STORAGE_KEY = "turni-servizio-daylogs-v1";

function normalizeEntry(raw: unknown): DayServiceEntry {
  const e = emptyDayEntry();
  if (!raw || typeof raw !== "object") return e;
  const p = raw as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === "string" ? p[k] as string : "");
  const bool = (k: string) => Boolean(p[k]);
  return {
    mattina: str("mattina"),
    pomeriggioRientro: str("pomeriggioRientro"),
    straordinarioOre: str("straordinarioOre"),
    servizioEsterno: str("servizioEsterno"),
    servizioEsternoOre: str("servizioEsternoOre"),
    servizioFuoriSede: str("servizioFuoriSede"),
    servizioFuoriSedeOre: str("servizioFuoriSedeOre"),
    congedoOrdinario: bool("congedoOrdinario"),
    congedoStraordMalattia: bool("congedoStraordMalattia"),
    congedoStraordFamiglia: bool("congedoStraordFamiglia"),
    pnl: bool("pnl"),
    congedoParentale: bool("congedoParentale"),
    buonoPasto: bool("buonoPasto"),
    festivo: bool("festivo"),
    corsiFormazione: str("corsiFormazione"),
    altroNote: str("altroNote"),
  };
}

export function loadDayLogs(): Record<string, DayServiceEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (!p || typeof p !== "object") return {};
    const out: Record<string, DayServiceEntry> = {};
    for (const [k, v] of Object.entries(p)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
        out[k] = normalizeEntry(v);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveDayLogs(map: Record<string, DayServiceEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getDayLog(
  map: Record<string, DayServiceEntry>,
  ymd: string
): DayServiceEntry {
  return map[ymd] ?? emptyDayEntry();
}
