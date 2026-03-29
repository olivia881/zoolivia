export const WEEKDAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
] as const;

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function mondayFirstIndex(date: Date): WeekdayIndex {
  const js = date.getDay();
  return (js === 0 ? 6 : js - 1) as WeekdayIndex;
}
