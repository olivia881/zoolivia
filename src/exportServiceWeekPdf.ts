import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DayServiceEntry } from "./dayLogModel";
import { getDayLog } from "./dayLogStorage";
import type { ShiftAppSettings } from "./shiftScheduleLogic";
import { weekCycleSummary } from "./weekShiftApply";
import {
  effectiveWeekTurnText,
  weekDetailExtraText,
} from "./weekRowDisplay";

const WEEKDAY_LONG = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

function formatDateIt(d: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Genera PDF del servizio settimanale (7 giorni) con griglia e rettifiche.
 * Su mobile apre il download / condivisione del file.
 */
export function exportServiceWeekPdf(
  weekDays: Date[],
  dayLogs: Record<string, DayServiceEntry>,
  settings: ShiftAppSettings
): void {
  const monday = weekDays[0];
  const sun = weekDays[6];
  const rangeLabel = `${formatDateIt(monday)} – ${formatDateIt(sun)}`;
  const cycle = weekCycleSummary(monday, settings);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Servizio settimanale", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periodo: ${rangeLabel}`, 14, y);
  y += 5;
  if (cycle) {
    doc.text(cycle, 14, y);
    y += 5;
  }
  const o1 = settings.officeLine1.trim();
  const o2 = settings.officeLine2.trim();
  if (o1) {
    doc.text(o1, 14, y);
    y += 5;
  }
  if (o2) {
    const lines = doc.splitTextToSize(o2, pageW - 28);
    doc.text(lines, 14, y);
    y += 4 + lines.length * 4.5;
  }
  y += 4;

  const head = [["Giorno", "Data", "Turno / stato", "Dettagli e rettifiche"]];
  const body: string[][] = [];

  for (let i = 0; i < weekDays.length; i++) {
    const d = weekDays[i];
    const ymd = toYmd(d);
    const entry = getDayLog(dayLogs, ymd);
    const turno = effectiveWeekTurnText(d, settings, entry);
    const dettagli = weekDetailExtraText(entry);
    body.push([
      WEEKDAY_LONG[i],
      formatDateIt(d),
      turno.replace(/\n/g, " "),
      dettagli,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2, valign: "top" },
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 26 },
      2: { cellWidth: 52 },
      3: { cellWidth: "auto" as unknown as number },
    },
    margin: { left: 14, right: 14 },
  });

  const fn = `servizio-settimanale-${toYmd(monday)}.pdf`;
  doc.save(fn);
}
