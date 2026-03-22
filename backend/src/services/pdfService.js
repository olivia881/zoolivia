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
const MARGIN_X = 36;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 36;
const TABLE_ROW_HEIGHT = 18;
const TABLE_SPLIT_X = 255;
const TABLE_TEXT_SIZE = 8.6;
const PAGE_BORDER_INSET = 24;
const SECTION_BG = rgb(0.84, 0.87, 0.91);
const TABLE_HEADER_BG = rgb(0.92, 0.93, 0.95);
const ALT_ROW_BG = rgb(0.975, 0.978, 0.985);
const TOTAL_ROW_BG = rgb(0.95, 0.955, 0.965);
const BORDER_COLOR = rgb(0.5, 0.52, 0.56);
const TEXT_COLOR = rgb(0.14, 0.14, 0.14);

function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}

function safeName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("it-IT").format(date);
}

function drawCenteredText(page, text, y, font, size, color = TEXT_COLOR) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - textWidth) / 2;
  page.drawText(text, { x, y, size, font, color });
}

function drawPageFrame(page) {
  page.drawRectangle({
    x: PAGE_BORDER_INSET,
    y: PAGE_BORDER_INSET,
    width: page.getWidth() - PAGE_BORDER_INSET * 2,
    height: page.getHeight() - PAGE_BORDER_INSET * 2,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  });
}

function drawHorizontalRule(page, y) {
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: page.getWidth() - MARGIN_X, y },
    thickness: 0.8,
    color: BORDER_COLOR,
  });
}

function drawSectionTitle(page, y, title, titleFont) {
  const width = page.getWidth() - MARGIN_X * 2;
  const height = 16;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - height,
    width,
    height,
    color: SECTION_BG,
    borderWidth: 0.7,
    borderColor: BORDER_COLOR,
  });
  page.drawText(title, {
    x: MARGIN_X + 6,
    y: y - 11.5,
    size: 9,
    font: titleFont,
    color: TEXT_COLOR,
  });
  return y - height;
}

function drawTableHeader(page, y, bodyFont, rightHeader = "Importo") {
  const width = page.getWidth() - MARGIN_X * 2;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - TABLE_ROW_HEIGHT,
    width,
    height: TABLE_ROW_HEIGHT,
    color: TABLE_HEADER_BG,
    borderWidth: 0.7,
    borderColor: BORDER_COLOR,
  });
  page.drawLine({
    start: { x: MARGIN_X + TABLE_SPLIT_X, y: y - TABLE_ROW_HEIGHT },
    end: { x: MARGIN_X + TABLE_SPLIT_X, y },
    thickness: 0.7,
    color: BORDER_COLOR,
  });

  page.drawText("Descrizione", {
    x: MARGIN_X + 6,
    y: y - 12.2,
    size: TABLE_TEXT_SIZE,
    font: bodyFont,
    color: TEXT_COLOR,
  });
  page.drawText(rightHeader, {
    x: MARGIN_X + TABLE_SPLIT_X + 6,
    y: y - 12.2,
    size: TABLE_TEXT_SIZE,
    font: bodyFont,
    color: TEXT_COLOR,
  });
  return y - TABLE_ROW_HEIGHT;
}

function drawTableRows(page, y, rows, bodyFont, titleFont, { rightAlign = true, rightLabel = "Importo" } = {}) {
  let cursorY = drawTableHeader(page, y, bodyFont, rightLabel);
  const width = page.getWidth() - MARGIN_X * 2;
  const amountColumnWidth = width - TABLE_SPLIT_X;

  rows.forEach((row, index) => {
    const hasBackground = row.bold || index % 2 === 1;
    if (hasBackground) {
      page.drawRectangle({
        x: MARGIN_X,
        y: cursorY - TABLE_ROW_HEIGHT,
        width,
        height: TABLE_ROW_HEIGHT,
        color: row.bold ? TOTAL_ROW_BG : ALT_ROW_BG,
      });
    }

    page.drawRectangle({
      x: MARGIN_X,
      y: cursorY - TABLE_ROW_HEIGHT,
      width,
      height: TABLE_ROW_HEIGHT,
      borderWidth: 0.7,
      borderColor: BORDER_COLOR,
    });
    page.drawLine({
      start: { x: MARGIN_X + TABLE_SPLIT_X, y: cursorY - TABLE_ROW_HEIGHT },
      end: { x: MARGIN_X + TABLE_SPLIT_X, y: cursorY },
      thickness: 0.7,
      color: BORDER_COLOR,
    });

    const font = row.bold ? titleFont : bodyFont;
    page.drawText(row.label, {
      x: MARGIN_X + 6,
      y: cursorY - 12.2,
      size: TABLE_TEXT_SIZE,
      font,
      color: TEXT_COLOR,
      maxWidth: TABLE_SPLIT_X - 12,
    });

    const amountText = String(row.value);
    const amountWidth = font.widthOfTextAtSize(amountText, TABLE_TEXT_SIZE);
    const amountX = rightAlign
      ? MARGIN_X + TABLE_SPLIT_X + amountColumnWidth - amountWidth - 6
      : MARGIN_X + TABLE_SPLIT_X + 6;

    page.drawText(amountText, {
      x: amountX,
      y: cursorY - 12.2,
      size: TABLE_TEXT_SIZE,
      font,
      color: TEXT_COLOR,
      maxWidth: amountColumnWidth - 12,
    });

    cursorY -= TABLE_ROW_HEIGHT;
  });

  return cursorY;
}

export async function generatePayslipPdf({ profile, input, calculation }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const contractLabel = input.contractType === "convivente" ? "Convivente" : "Non convivente";
  const monthName = MONTH_NAMES[input.month - 1];
  const issueDate = formatDate(new Date());

  drawPageFrame(page);
  let y = height - MARGIN_TOP;
  drawCenteredText(page, `BUSTA PAGA - ${monthName.toUpperCase()} ${input.year}`, y, titleFont, 16.5);
  y -= 18;
  drawCenteredText(
    page,
    `Lavoratrice domestica - CCNL Lavoro Domestico - Livello ${input.level} - ${contractLabel}`,
    y,
    bodyFont,
    8.3,
    rgb(0.35, 0.35, 0.35),
  );
  y -= 12;
  drawHorizontalRule(page, y);
  y -= 12;

  y = drawSectionTitle(page, y, "DATI DEL RAPPORTO DI LAVORO", titleFont);
  y = drawTableRows(
    page,
    y,
    [
      { label: "Datore di lavoro", value: profile.employerName },
      { label: "Codice fiscale datore", value: profile.employerCf },
      { label: "Indirizzo datore", value: profile.employerAddress },
      { label: "Lavoratrice", value: profile.workerName },
      { label: "Codice fiscale lavoratrice", value: profile.workerCf },
      { label: "Mese di riferimento", value: `${monthName} ${input.year}` },
      { label: "Data emissione cedolino", value: issueDate },
      { label: "Livello CCNL", value: input.level },
      { label: "Ore settimanali", value: String(input.weeklyHours) },
      { label: "Tipologia", value: contractLabel },
      {
        label: "Retribuzione oraria",
        value: input.contractType === "non_convivente" ? euro(input.hourlyRate) : "Non applicabile (stipendio CCNL fisso)",
      },
      { label: "Retribuzione mensile lorda", value: euro(calculation.gross), bold: true },
    ],
    bodyFont,
    titleFont,
    { rightAlign: false, rightLabel: "Valore" },
  );
  y -= 11;

  y = drawSectionTitle(page, y, "SEZIONE 1 - RETRIBUZIONE", titleFont);
  y = drawTableRows(
    page,
    y,
    [
      { label: "Paga base + indennita", value: euro(calculation.gross) },
      { label: "Totale lordo", value: euro(calculation.gross), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 9;

  y = drawSectionTitle(page, y, "SEZIONE 2 - TRATTENUTE E NETTO", titleFont);
  y = drawTableRows(
    page,
    y,
    [
      { label: "Contributi INPS lavoratrice", value: euro(calculation.employeeContributions) },
      { label: "Totale trattenute", value: euro(calculation.employeeContributions) },
      { label: "Netto da corrispondere", value: euro(calculation.net), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 9;

  y = drawSectionTitle(page, y, "SEZIONE 3 - ACCANTONAMENTI", titleFont);
  y = drawTableRows(
    page,
    y,
    [
      { label: "TFR maturato", value: euro(calculation.tfr) },
      { label: "Quota tredicesima", value: euro(calculation.thirteenth) },
    ],
    bodyFont,
    titleFont,
  );
  y -= 9;

  y = drawSectionTitle(page, y, "SEZIONE 4 - CONTRIBUTI DATORE", titleFont);
  y = drawTableRows(
    page,
    y,
    [
      { label: "Contributi INPS datore", value: euro(calculation.employerContributions) },
      { label: "Totale contributi datore", value: euro(calculation.employerContributions), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 9;

  y = drawSectionTitle(page, y, "SEZIONE 5 - COSTO TOTALE DATORE", titleFont);
  y = drawTableRows(
    page,
    y,
    [{ label: "Totale costo datore", value: euro(calculation.totalCost), bold: true }],
    bodyFont,
    titleFont,
  );
  y -= 22;

  if (y < MARGIN_BOTTOM + 30) {
    y = MARGIN_BOTTOM + 30;
  }

  drawHorizontalRule(page, y + 10);
  page.drawText("Firma datore ____________________________", {
    x: MARGIN_X,
    y,
    size: 8.5,
    font: bodyFont,
    color: TEXT_COLOR,
  });
  page.drawText("Firma lavoratrice _______________________", {
    x: MARGIN_X + 250,
    y,
    size: 8.5,
    font: bodyFont,
    color: TEXT_COLOR,
  });
  page.drawText("Documento personale ad uso privato - fac-simile", {
    x: MARGIN_X,
    y: MARGIN_BOTTOM - 8,
    size: 7.5,
    font: bodyFont,
    color: rgb(0.45, 0.45, 0.45),
  });

  const pdfBytes = await pdfDoc.save();
  const yearDir = path.join(ARCHIVE_ROOT, String(input.year));
  await mkdir(yearDir, { recursive: true });

  const fileName = `Busta_${monthName}_${input.year}_${safeName(profile.workerName)}.pdf`;
  const absolutePath = path.join(yearDir, fileName);
  await writeFile(absolutePath, pdfBytes);

  return {
    fileName,
    absolutePath,
    relativePath: `/buste/${input.year}/${fileName}`,
  };
}
