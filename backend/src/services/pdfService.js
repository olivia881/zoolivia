import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVE_ROOT = path.resolve(__dirname, "../../buste");

function euro(value) {
  return `EUR ${Number(value).toFixed(2)}`;
}

function safeName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
}

export async function generatePayslipPdf({ profile, input, calculation }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 60;
  page.drawText("Busta Paga - Lavoro Domestico", {
    x: 50,
    y,
    size: 20,
    font: titleFont,
    color: rgb(0.11, 0.2, 0.45),
  });

  y -= 40;
  const rows = [
    `Datore: ${profile.employerName} - CF ${profile.employerCf}`,
    `Indirizzo datore: ${profile.employerAddress}`,
    `Lavoratrice: ${profile.workerName} - CF ${profile.workerCf}`,
    `Mese/Anno: ${MONTH_NAMES[input.month - 1]} ${input.year}`,
    `Contratto: ${input.contractType === "convivente" ? "Convivente" : "Non convivente"} - Livello ${input.level}`,
    `Ore settimanali: ${input.weeklyHours}`,
    input.contractType === "non_convivente" ? `Paga oraria: ${euro(input.hourlyRate)}` : "Paga oraria: n/a (stipendio fisso CCNL)",
    "",
    "Riepilogo economico",
    `Lordo: ${euro(calculation.gross)}`,
    `Contributi lavoratrice: ${euro(calculation.employeeContributions)}`,
    `Contributi datore: ${euro(calculation.employerContributions)}`,
    `Netto: ${euro(calculation.net)}`,
    `TFR: ${euro(calculation.tfr)}`,
    `Tredicesima mensile: ${euro(calculation.thirteenth)}`,
    `Costo totale datore: ${euro(calculation.totalCost)}`,
  ];

  for (const row of rows) {
    page.drawText(row, {
      x: 50,
      y,
      size: 12,
      font: row === "Riepilogo economico" ? titleFont : bodyFont,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 100,
      lineHeight: 16,
    });
    y -= row === "" ? 8 : 22;
  }

  const pdfBytes = await pdfDoc.save();
  const yearDir = path.join(ARCHIVE_ROOT, String(input.year));
  await mkdir(yearDir, { recursive: true });

  const fileName = `Busta_${MONTH_NAMES[input.month - 1]}_${input.year}_${safeName(profile.workerName)}.pdf`;
  const absolutePath = path.join(yearDir, fileName);
  await writeFile(absolutePath, pdfBytes);

  return {
    fileName,
    absolutePath,
    relativePath: `/buste/${input.year}/${fileName}`,
  };
}
