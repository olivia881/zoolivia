import {
  hasDayEntryContent,
  parseDecimalHours,
  parseHoursFromTimeRanges,
  type DayServiceEntry,
} from "./dayLogModel";

export type MonthTotals = {
  giorniConAnnotazioni: number;
  oreDaFasceMattinaPomeriggio: number;
  oreStraordinario: number;
  oreServizioEsterno: number;
  oreServizioFuoriSede: number;
  giorniCongedoOrdinario: number;
  giorniCongedoStraordMalattia: number;
  giorniCongedoStraordFamiglia: number;
  giorniPnl: number;
  giorniCongedoParentale: number;
  giorniFestivi: number;
  buoniPasto: number;
};

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function ymd(y: number, mo: number, day: number): string {
  return `${y}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function aggregateMonthTotals(
  year: number,
  month: number,
  logs: Record<string, DayServiceEntry>
): MonthTotals {
  const dim = daysInMonth(year, month);
  const t: MonthTotals = {
    giorniConAnnotazioni: 0,
    oreDaFasceMattinaPomeriggio: 0,
    oreStraordinario: 0,
    oreServizioEsterno: 0,
    oreServizioFuoriSede: 0,
    giorniCongedoOrdinario: 0,
    giorniCongedoStraordMalattia: 0,
    giorniCongedoStraordFamiglia: 0,
    giorniPnl: 0,
    giorniCongedoParentale: 0,
    giorniFestivi: 0,
    buoniPasto: 0,
  };

  for (let d = 1; d <= dim; d++) {
    const key = ymd(year, month, d);
    const e = logs[key];
    if (!e) continue;

    /* Contatori flag sempre, anche se il giorno ha solo una spunta salvata */
    if (e.buonoPasto) t.buoniPasto += 1;
    if (e.festivo) t.giorniFestivi += 1;
    if (e.congedoOrdinario) t.giorniCongedoOrdinario += 1;
    if (e.congedoStraordMalattia) t.giorniCongedoStraordMalattia += 1;
    if (e.congedoStraordFamiglia) t.giorniCongedoStraordFamiglia += 1;
    if (e.pnl) t.giorniPnl += 1;
    if (e.congedoParentale) t.giorniCongedoParentale += 1;

    if (!hasDayEntryContent(e)) continue;

    t.giorniConAnnotazioni += 1;
    const noTurno =
      e.festivo ||
      e.congedoOrdinario ||
      e.congedoStraordMalattia ||
      e.congedoStraordFamiglia ||
      e.pnl ||
      e.congedoParentale;
    if (!noTurno) {
      t.oreDaFasceMattinaPomeriggio +=
        parseHoursFromTimeRanges(e.mattina) +
        parseHoursFromTimeRanges(e.pomeriggioRientro);
      t.oreStraordinario += parseDecimalHours(e.straordinarioOre);
    }
    t.oreServizioEsterno += parseDecimalHours(e.servizioEsternoOre);
    t.oreServizioFuoriSede += parseDecimalHours(e.servizioFuoriSedeOre);
  }

  t.oreDaFasceMattinaPomeriggio =
    Math.round(t.oreDaFasceMattinaPomeriggio * 100) / 100;
  t.oreStraordinario = Math.round(t.oreStraordinario * 100) / 100;
  t.oreServizioEsterno = Math.round(t.oreServizioEsterno * 100) / 100;
  t.oreServizioFuoriSede = Math.round(t.oreServizioFuoriSede * 100) / 100;

  return t;
}
