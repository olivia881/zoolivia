import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONTRACT_TEMPLATE, CLAUSE_TEMPLATE } from "../templates/contractTemplate.js";
import { PAYSLIP_TEMPLATE } from "../templates/payslipTemplate.js";
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
  payslip: PAYSLIP_TEMPLATE,
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

function drawPageFrame(page) {
  page.drawRectangle({
    x: PAGE_BORDER_INSET,
    y: PAGE_BORDER_INSET,
    width: PAGE_WIDTH - PAGE_BORDER_INSET * 2,
    height: PAGE_HEIGHT - PAGE_BORDER_INSET * 2,
    borderWidth: 1,
    borderColor: rgb(0.5, 0.52, 0.56),
  });
}

function drawHeader(page, title, titleFont, bodyFont) {
  drawPageFrame(page);

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
  const template = getTemplate(documentType);
  const bodyText = renderTemplate(template, data.placeholders);
  const pdfDoc = await PDFDocument.create();
  const meta = getDocumentMeta(documentType, data);

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
