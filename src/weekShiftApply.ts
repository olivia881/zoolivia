import {
  emptyDayEntry,
  toYmd,
  type DayServiceEntry,
} from "./dayLogModel";
import {
  CYCLE_PAIR_LABELS,
  plannedBandsForDayFields,
  resolveDayShift,
  type ShiftAppSettings,
} from "./shiftScheduleLogic";

/**
 * Per ogni lun–ven della settimana del `weekMonday`: mattina = fascia impostata;
 * pomeriggio = fascia se in quel giorno cade un rientro (stesso giorno o incrociato).
 */
export function applyScalingShiftToWeek(
  weekMonday: Date,
  settings: ShiftAppSettings,
  existing: Record<string, DayServiceEntry>
): Record<string, DayServiceEntry> {
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

    const bands = plannedBandsForDayFields(info, settings.timeVariant);
    next[ymd] = {
      ...prev,
      mattina: bands.mattina,
      pomeriggioRientro: bands.pomeriggioRientro,
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
