import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONTRACT_TEMPLATE, CLAUSE_TEMPLATE } from "../templates/contractTemplate.js";
import { RECEIPT_TEMPLATE } from "../templates/receiptTemplate.js";
import { buildDocumentData } from "../models/entities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVE_ROOT = path.resolve(__dirname, "../../documenti");

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 44;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const PAGE_BORDER_INSET = 28;
const PAYSLIP_TABLE_ROW_HEIGHT = 15;
const PAYSLIP_TABLE_SPLIT_X = 258;
const PAYSLIP_TABLE_TEXT_SIZE = 8.2;
const PAYSLIP_SECTION_TITLE_HEIGHT = 14;
const PAYSLIP_TEXT_BASELINE_OFFSET = 10.2;
const PAYSLIP_SECTION_BG = rgb(0.84, 0.87, 0.91);
const PAYSLIP_TABLE_HEADER_BG = rgb(0.92, 0.93, 0.95);
const PAYSLIP_ALT_ROW_BG = rgb(0.975, 0.978, 0.985);
const PAYSLIP_TOTAL_ROW_BG = rgb(0.95, 0.955, 0.965);

const FILE_PREFIX_BY_TYPE = {
  contract: "Contratto",
  clause: "Clausola",
  payslip: "Busta",
  receipt: "Ricevuta",
};

const TITLE_BY_TYPE = {
  contract: "Contratto di Assunzione - Lavoro Domestico",
  clause: "Clausola Integrativa",
  payslip: "Busta Paga Mensile",
  receipt: "Ricevuta di Pagamento",
};

const TEMPLATE_BY_TYPE = {
  contract: CONTRACT_TEMPLATE,
  clause: CLAUSE_TEMPLATE,
  receipt: RECEIPT_TEMPLATE,
};

function safeName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
}

function renderTemplate(template, placeholders) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(placeholders[key] ?? ""));
}

function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("it-IT").format(date);
}

function wrapLine(line, font, fontSize, maxWidth) {
  if (!line.trim()) {
    return [""];
  }

  const words = line.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawPageFrame(page, { topInset = PAGE_BORDER_INSET, bottomInset = PAGE_BORDER_INSET, sideInset = PAGE_BORDER_INSET } = {}) {
  page.drawRectangle({
    x: sideInset,
    y: bottomInset,
    width: PAGE_WIDTH - sideInset * 2,
    height: PAGE_HEIGHT - topInset - bottomInset,
    borderWidth: 1,
    borderColor: rgb(0.5, 0.52, 0.56),
  });
}

function drawHeader(page, title, titleFont, bodyFont) {
  drawPageFrame(page, { topInset: 34, bottomInset: PAGE_BORDER_INSET, sideInset: PAGE_BORDER_INSET });

  const titleSize = 15;
  const subtitleSize = 8.5;
  const titleWidth = titleFont.widthOfTextAtSize(title, titleSize);
  const titleX = (PAGE_WIDTH - titleWidth) / 2;
  const y = PAGE_HEIGHT - MARGIN_TOP;

  page.drawText(title, {
    x: titleX,
    y,
    size: titleSize,
    font: titleFont,
    color: rgb(0.12, 0.2, 0.4),
  });

  page.drawText("Documento generato automaticamente", {
    x: MARGIN_X,
    y: y - 16,
    size: subtitleSize,
    font: bodyFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawLine({
    start: { x: MARGIN_X, y: y - 21 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: y - 21 },
    thickness: 0.8,
    color: rgb(0.62, 0.64, 0.68),
  });

  return y - 35;
}

function drawBodyLines(pdfDoc, title, bodyText) {
  const titleFontPromise = pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFontPromise = pdfDoc.embedFont(StandardFonts.Helvetica);

  return Promise.all([titleFontPromise, bodyFontPromise]).then(([titleFont, bodyFont]) => {
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = drawHeader(page, title, titleFont, bodyFont);

    const baseSize = 9.4;
    const headingSize = 10.8;
    const lineSpacing = 4;
    const lines = bodyText.split("\n");

    for (const rawLine of lines) {
      const isHeading = rawLine.startsWith("## ");
      const line = isHeading ? rawLine.replace("## ", "").toUpperCase() : rawLine;
      const font = isHeading ? titleFont : bodyFont;
      const fontSize = isHeading ? headingSize : baseSize;
      const wrapped = wrapLine(line, font, fontSize, CONTENT_WIDTH);
      const lineHeight = fontSize + lineSpacing;

      for (const segment of wrapped) {
        if (y < MARGIN_BOTTOM) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = drawHeader(page, title, titleFont, bodyFont);
        }

        page.drawText(segment, {
          x: MARGIN_X,
          y,
          size: fontSize,
          font,
          color: rgb(0.14, 0.14, 0.14),
        });
        y -= lineHeight;
      }

      y -= isHeading ? 2 : 1;
    }
  });
}

function getTemplate(documentType) {
  const template = TEMPLATE_BY_TYPE[documentType];
  if (!template) {
    throw new Error(`Tipo documento non supportato: ${documentType}`);
  }
  return template;
}

function buildBodyText(documentType, data) {
  const template = getTemplate(documentType);
  return renderTemplate(template, data.placeholders);
}

function drawCenteredText(page, text, y, font, size, color = rgb(0.14, 0.14, 0.14)) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (PAGE_WIDTH - width) / 2;
  page.drawText(text, { x, y, size, font, color });
}

function drawPayslipSectionTitle(page, y, title, titleFont) {
  const width = PAGE_WIDTH - MARGIN_X * 2;
  const height = PAYSLIP_SECTION_TITLE_HEIGHT;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - height,
    width,
    height,
    color: PAYSLIP_SECTION_BG,
    borderWidth: 0.7,
    borderColor: rgb(0.5, 0.52, 0.56),
  });
  page.drawText(title, {
    x: MARGIN_X + 6,
    y: y - 10.4,
    size: 9,
    font: titleFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  return y - height;
}

function drawPayslipTableHeader(page, y, bodyFont, rightHeader = "Importo") {
  const width = PAGE_WIDTH - MARGIN_X * 2;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - PAYSLIP_TABLE_ROW_HEIGHT,
    width,
    height: PAYSLIP_TABLE_ROW_HEIGHT,
    color: PAYSLIP_TABLE_HEADER_BG,
    borderWidth: 0.7,
    borderColor: rgb(0.5, 0.52, 0.56),
  });
  page.drawLine({
    start: { x: MARGIN_X + PAYSLIP_TABLE_SPLIT_X, y: y - PAYSLIP_TABLE_ROW_HEIGHT },
    end: { x: MARGIN_X + PAYSLIP_TABLE_SPLIT_X, y },
    thickness: 0.7,
    color: rgb(0.5, 0.52, 0.56),
  });
  page.drawText("Descrizione", {
    x: MARGIN_X + 6,
    y: y - PAYSLIP_TEXT_BASELINE_OFFSET,
    size: PAYSLIP_TABLE_TEXT_SIZE,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  page.drawText(rightHeader, {
    x: MARGIN_X + PAYSLIP_TABLE_SPLIT_X + 6,
    y: y - PAYSLIP_TEXT_BASELINE_OFFSET,
    size: PAYSLIP_TABLE_TEXT_SIZE,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  return y - PAYSLIP_TABLE_ROW_HEIGHT;
}

function drawPayslipTableRows(page, y, rows, bodyFont, titleFont, { rightAlign = true, rightLabel = "Importo" } = {}) {
  let cursorY = drawPayslipTableHeader(page, y, bodyFont, rightLabel);
  const width = PAGE_WIDTH - MARGIN_X * 2;
  const amountColumnWidth = width - PAYSLIP_TABLE_SPLIT_X;

  rows.forEach((row, index) => {
    const hasBackground = row.bold || index % 2 === 1;
    if (hasBackground) {
      page.drawRectangle({
        x: MARGIN_X,
        y: cursorY - PAYSLIP_TABLE_ROW_HEIGHT,
        width,
        height: PAYSLIP_TABLE_ROW_HEIGHT,
        color: row.bold ? PAYSLIP_TOTAL_ROW_BG : PAYSLIP_ALT_ROW_BG,
      });
    }

    page.drawRectangle({
      x: MARGIN_X,
      y: cursorY - PAYSLIP_TABLE_ROW_HEIGHT,
      width,
      height: PAYSLIP_TABLE_ROW_HEIGHT,
      borderWidth: 0.7,
      borderColor: rgb(0.5, 0.52, 0.56),
    });
    page.drawLine({
      start: { x: MARGIN_X + PAYSLIP_TABLE_SPLIT_X, y: cursorY - PAYSLIP_TABLE_ROW_HEIGHT },
      end: { x: MARGIN_X + PAYSLIP_TABLE_SPLIT_X, y: cursorY },
      thickness: 0.7,
      color: rgb(0.5, 0.52, 0.56),
    });

    const font = row.bold ? titleFont : bodyFont;
    page.drawText(row.label, {
      x: MARGIN_X + 6,
      y: cursorY - PAYSLIP_TEXT_BASELINE_OFFSET,
      size: PAYSLIP_TABLE_TEXT_SIZE,
      font,
      color: rgb(0.14, 0.14, 0.14),
      maxWidth: PAYSLIP_TABLE_SPLIT_X - 12,
    });

    const valueText = String(row.value);
    const valueWidth = font.widthOfTextAtSize(valueText, PAYSLIP_TABLE_TEXT_SIZE);
    const valueX = rightAlign
      ? MARGIN_X + PAYSLIP_TABLE_SPLIT_X + amountColumnWidth - valueWidth - 6
      : MARGIN_X + PAYSLIP_TABLE_SPLIT_X + 6;
    page.drawText(valueText, {
      x: valueX,
      y: cursorY - PAYSLIP_TEXT_BASELINE_OFFSET,
      size: PAYSLIP_TABLE_TEXT_SIZE,
      font,
      color: rgb(0.14, 0.14, 0.14),
      maxWidth: amountColumnWidth - 12,
    });

    cursorY -= PAYSLIP_TABLE_ROW_HEIGHT;
  });

  return cursorY;
}

async function generateProfessionalPayslipPdf(data, meta) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  drawPageFrame(page, { topInset: 42, bottomInset: 30, sideInset: 24 });

  let y = PAGE_HEIGHT - 78;
  drawCenteredText(page, `BUSTA PAGA - ${data.payroll.monthName.toUpperCase()} ${data.payroll.year}`, y, titleFont, 16.5, rgb(0.12, 0.2, 0.4));
  y -= 18;
  drawCenteredText(
    page,
    `Lavoratrice domestica - CCNL Lavoro Domestico - Livello ${data.employee.level} - ${data.employee.contractTypeLabel}`,
    y,
    bodyFont,
    8.3,
    rgb(0.35, 0.35, 0.35),
  );
  y -= 12;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 0.8,
    color: rgb(0.62, 0.64, 0.68),
  });
  y -= 10;

  y = drawPayslipSectionTitle(page, y, "DATI DEL RAPPORTO DI LAVORO", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [
      { label: "Datore di lavoro", value: data.employer.name },
      { label: "Codice fiscale datore", value: data.employer.taxCode },
      { label: "Indirizzo datore", value: data.employer.address },
      { label: "Lavoratrice", value: data.employee.name },
      { label: "Codice fiscale lavoratrice", value: data.employee.taxCode },
      { label: "Mese di riferimento", value: `${data.payroll.monthName} ${data.payroll.year}` },
      { label: "Data emissione cedolino", value: formatDate(new Date()) },
      { label: "Livello CCNL", value: data.employee.level },
      { label: "Ore settimanali", value: String(data.employee.weeklyHours) },
      { label: "Tipologia", value: data.employee.contractTypeLabel },
      {
        label: "Retribuzione oraria",
        value: data.employee.contractType === "non_convivente" ? data.placeholders.hourlyRate : "Non applicabile (stipendio CCNL fisso)",
      },
      { label: "Retribuzione mensile lorda", value: euro(data.payroll.grossSalary), bold: true },
    ],
    bodyFont,
    titleFont,
    { rightAlign: false, rightLabel: "Valore" },
  );
  y -= 7;

  y = drawPayslipSectionTitle(page, y, "SEZIONE 1 - RETRIBUZIONE", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [
      { label: "Paga base + indennita", value: euro(data.payroll.grossSalary) },
      { label: "Totale lordo", value: euro(data.payroll.grossSalary), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 6;

  y = drawPayslipSectionTitle(page, y, "SEZIONE 2 - TRATTENUTE E NETTO", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [
      { label: "Contributi INPS lavoratrice", value: euro(data.payroll.employeeContributions) },
      { label: "Totale trattenute", value: euro(data.payroll.employeeContributions) },
      { label: "Netto da corrispondere", value: euro(data.payroll.netSalary), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 6;

  y = drawPayslipSectionTitle(page, y, "SEZIONE 3 - ACCANTONAMENTI", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [
      { label: "TFR maturato", value: euro(data.payroll.tfr) },
      { label: "Quota tredicesima", value: euro(data.payroll.thirteenth) },
    ],
    bodyFont,
    titleFont,
  );
  y -= 9;

  y = drawPayslipSectionTitle(page, y, "SEZIONE 4 - CONTRIBUTI DATORE", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [
      { label: "Contributi INPS datore", value: euro(data.payroll.employerContributions) },
      { label: "Totale contributi datore", value: euro(data.payroll.employerContributions), bold: true },
    ],
    bodyFont,
    titleFont,
  );
  y -= 6;

  y = drawPayslipSectionTitle(page, y, "SEZIONE 5 - COSTO TOTALE DATORE", titleFont);
  y = drawPayslipTableRows(
    page,
    y,
    [{ label: "Totale costo datore", value: euro(data.payroll.totalCost), bold: true }],
    bodyFont,
    titleFont,
  );
  y -= 8;

  const noteHeight = 36;

  page.drawRectangle({
    x: MARGIN_X,
    y: y - noteHeight,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: noteHeight,
    color: rgb(0.97, 0.98, 0.99),
    borderWidth: 0.7,
    borderColor: rgb(0.7, 0.72, 0.75),
  });
  page.drawText("NOTA IN CALCE:", {
    x: MARGIN_X + 6,
    y: y - 12.8,
    size: 8.8,
    font: titleFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  page.drawText("TFR e tredicesima non sono corrisposti nel mese e restano accantonati.", {
    x: MARGIN_X + 6,
    y: y - 24.2,
    size: 8.0,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  page.drawText("La firma e valida esclusivamente per il netto mensile corrisposto.", {
    x: MARGIN_X + 6,
    y: y - 32.8,
    size: 8.0,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });

  // Abbassa ulteriormente la zona firme rispetto alla nota in calce.
  y -= noteHeight + 34;

  const signatureTitleY = y;
  const signatureBoxY = signatureTitleY - 28;
  const signatureBoxHeight = 22;
  const signatureBoxWidth = 182;

  page.drawText("Firma datore", {
    x: MARGIN_X,
    y: signatureTitleY,
    size: 8.4,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });
  page.drawText("Firma lavoratrice", {
    x: MARGIN_X + 250,
    y: signatureTitleY,
    size: 8.4,
    font: bodyFont,
    color: rgb(0.14, 0.14, 0.14),
  });

  page.drawRectangle({
    x: MARGIN_X,
    y: signatureBoxY,
    width: signatureBoxWidth,
    height: signatureBoxHeight,
    borderWidth: 0.7,
    borderColor: rgb(0.35, 0.35, 0.35),
  });
  page.drawRectangle({
    x: MARGIN_X + 250,
    y: signatureBoxY,
    width: signatureBoxWidth,
    height: signatureBoxHeight,
    borderWidth: 0.7,
    borderColor: rgb(0.35, 0.35, 0.35),
  });

  page.drawText("Documento personale ad uso privato - fac-simile", {
    x: MARGIN_X,
    y: 36,
    size: 7.4,
    font: bodyFont,
    color: rgb(0.45, 0.45, 0.45),
  });

  const pdfBytes = await pdfDoc.save();
  const yearDir = path.join(ARCHIVE_ROOT, meta.year);
  await mkdir(yearDir, { recursive: true });
  const absolutePath = path.join(yearDir, meta.fileName);
  await writeFile(absolutePath, pdfBytes);

  return {
    fileName: meta.fileName,
    absolutePath,
    relativePath: `/documenti/${meta.year}/${meta.fileName}`,
  };
}

function getDocumentMeta(documentType, data) {
  const title = TITLE_BY_TYPE[documentType];
  const prefix = FILE_PREFIX_BY_TYPE[documentType];
  const employeeName = data.placeholders.employeeName;
  const monthName = data.placeholders.monthName;
  const year = data.placeholders.year;

  return {
    title,
    prefix,
    year,
    fileName: `${prefix}_${monthName}_${year}_${safeName(employeeName)}.pdf`,
  };
}

export async function generatePDF(documentType, data) {
  const meta = getDocumentMeta(documentType, data);
  if (documentType === "payslip") {
    return generateProfessionalPayslipPdf(data, meta);
  }

  const bodyText = buildBodyText(documentType, data);
  const pdfDoc = await PDFDocument.create();
  await drawBodyLines(pdfDoc, meta.title, bodyText);

  const pdfBytes = await pdfDoc.save();
  const yearDir = path.join(ARCHIVE_ROOT, meta.year);
  await mkdir(yearDir, { recursive: true });

  const absolutePath = path.join(yearDir, meta.fileName);
  await writeFile(absolutePath, pdfBytes);

  return {
    fileName: meta.fileName,
    absolutePath,
    relativePath: `/documenti/${meta.year}/${meta.fileName}`,
  };
}

export async function generatePayslipPdf({ profile, input, calculation }) {
  const data = buildDocumentData({ profile, input, calculation });
  return generatePDF("payslip", data);
}
