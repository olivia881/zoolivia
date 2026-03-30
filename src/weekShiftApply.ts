import {
  emptyDayEntry,
  toYmd,
  type DayServiceEntry,
} from "./dayLogModel";
import {
  afternoonReturnWeekday,
  CYCLE_PAIR_LABELS,
  resolveDayShift,
  shiftTimeLabels,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";
import type { WeekdayIndex } from "./weekdays";

function normBand(s: string): string {
  return s.replace(/\s/g, "").replace(/–/g, "-").replace(/—/g, "-");
}

/**
 * Per ogni lun–ven della settimana del `weekMonday`: mattina = fascia impostata;
 * pomeriggio = fascia se in quel giorno cade un rientro (stesso giorno o incrociato).
 */
export function applyScalingShiftToWeek(
  weekMonday: Date,
  settings: ShiftAppSettings,
  existing: Record<string, DayServiceEntry>
): Record<string, DayServiceEntry> {
  const labels = shiftTimeLabels(settings.timeVariant);
  const m = normBand(labels.morning);
  const p = normBand(labels.afternoon);
  const next = { ...existing };

  const mon = new Date(
    weekMonday.getFullYear(),
    weekMonday.getMonth(),
    weekMonday.getDate()
  );

  for (let i = 0; i < 5; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const ymd = toYmd(d);
    const prev = next[ymd] ?? emptyDayEntry();
    const info = resolveDayShift(d, settings);

    if (!info) continue;

    const wdD = info.morningWeekday;
    const wk = info.weekInCycle;

    let pomeriggio = "";
    for (let wdE = 0 as WeekdayIndex; wdE <= 4; wdE++) {
      const dest = afternoonReturnWeekday(wk, wdE);
      if (dest !== null && dest === wdD) {
        pomeriggio = p;
        break;
      }
    }

    next[ymd] = {
      ...prev,
      mattina: m,
      pomeriggioRientro: pomeriggio,
    };
  }

  return next;
}

export function weekCycleSummary(
  weekMonday: Date,
  settings: ShiftAppSettings
): string {
  const d = new Date(
    weekMonday.getFullYear(),
    weekMonday.getMonth(),
    weekMonday.getDate()
  );
  const info = resolveDayShift(d, settings);
  if (!info) return "";
  return `Ciclo ${info.weekInCycle + 1}/5: ${CYCLE_PAIR_LABELS[info.weekInCycle]}`;
}
