import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { displayValue } from "../../../shared/profileFields.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 36;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const SECTION_TITLE_H = 16;
const ROW_H = 13;
const LABEL_SIZE = 6.2;
const VALUE_SIZE = 7.4;
const SECTION_BG = rgb(0.84, 0.87, 0.91);
const BORDER = rgb(0.45, 0.48, 0.52);
const LABEL_COLOR = rgb(0.35, 0.38, 0.42);
const VALUE_COLOR = rgb(0.1, 0.1, 0.1);

function toWinAnsi(text) {
  return String(text ?? "")
    .replace(/\u2212/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"');
}

function drawSectionHeader(page, y, title, titleFont) {
  page.drawRectangle({
    x: MARGIN_X,
    y: y - SECTION_TITLE_H,
    width: CONTENT_WIDTH,
    height: SECTION_TITLE_H,
    color: SECTION_BG,
    borderWidth: 0.6,
    borderColor: BORDER,
  });
  page.drawText(toWinAnsi(title), {
    x: MARGIN_X + 5,
    y: y - SECTION_TITLE_H + 4.5,
    size: 7.8,
    font: titleFont,
    color: VALUE_COLOR,
  });
  return y - SECTION_TITLE_H;
}

function drawFieldCell(page, x, y, width, label, value, bodyFont, titleFont, { tall = false } = {}) {
  const h = tall ? ROW_H * 2 : ROW_H;
  page.drawRectangle({
    x,
    y: y - h,
    width,
    height: h,
    borderWidth: 0.5,
    borderColor: BORDER,
  });
  page.drawText(toWinAnsi(label), {
    x: x + 3,
    y: y - 7,
    size: LABEL_SIZE,
    font: bodyFont,
    color: LABEL_COLOR,
    maxWidth: width - 6,
  });
  const val = displayValue(value);
  page.drawText(toWinAnsi(val), {
    x: x + 3,
    y: y - (tall ? 18 : 11.5),
    size: VALUE_SIZE,
    font: titleFont,
    color: VALUE_COLOR,
    maxWidth: width - 6,
  });
}

function drawFieldRow(page, y, cells, bodyFont, titleFont) {
  let x = MARGIN_X;
  const totalWeight = cells.reduce((s, c) => s + (c.weight || 1), 0);
  let maxH = ROW_H;
  for (const cell of cells) {
    const w = (CONTENT_WIDTH * (cell.weight || 1)) / totalWeight;
    const tall = Boolean(cell.tall);
    if (tall) maxH = ROW_H * 2;
    drawFieldCell(page, x, y, w, cell.label, cell.value, bodyFont, titleFont, { tall });
    x += w;
  }
  return y - maxH;
}

function drawQuestionRow(page, y, question, answer, bodyFont, titleFont) {
  const qWidth = CONTENT_WIDTH * 0.78;
  const aWidth = CONTENT_WIDTH - qWidth;
  page.drawRectangle({ x: MARGIN_X, y: y - ROW_H * 2, width: qWidth, height: ROW_H * 2, borderWidth: 0.5, borderColor: BORDER });
  page.drawRectangle({ x: MARGIN_X + qWidth, y: y - ROW_H * 2, width: aWidth, height: ROW_H * 2, borderWidth: 0.5, borderColor: BORDER });
  page.drawText(toWinAnsi(question), {
    x: MARGIN_X + 3,
    y: y - 10,
    size: 6.8,
    font: bodyFont,
    color: VALUE_COLOR,
    maxWidth: qWidth - 6,
  });
  page.drawText(toWinAnsi(displayValue(answer)), {
    x: MARGIN_X + qWidth + 6,
    y: y - 14,
    size: 9,
    font: titleFont,
    color: VALUE_COLOR,
  });
  return y - ROW_H * 2;
}

function drawParagraphBlock(page, y, title, lines, bodyFont, titleFont, { newPage }) {
  let cursorY = y;
  if (cursorY < MARGIN_BOTTOM + 80) {
    const np = newPage();
    cursorY = np.y;
  }
  page.drawText(toWinAnsi(title), {
    x: MARGIN_X,
    y: cursorY,
    size: 8.5,
    font: titleFont,
    color: rgb(0.12, 0.2, 0.4),
  });
  cursorY -= 12;
  for (const line of lines) {
    if (cursorY < MARGIN_BOTTOM + 20) {
      const np = newPage();
      cursorY = np.y;
    }
    page.drawText(toWinAnsi(line), {
      x: MARGIN_X,
      y: cursorY,
      size: 7.6,
      font: bodyFont,
      color: VALUE_COLOR,
      maxWidth: CONTENT_WIDTH,
    });
    cursorY -= 10;
  }
  return cursorY - 6;
}

function drawSignatures(page, bodyFont) {
  const y = 72;
  page.drawText("Firma datore di lavoro", { x: MARGIN_X, y: y + 34, size: 7.5, font: bodyFont, color: VALUE_COLOR });
  page.drawText("Firma lavoratrice per ricevuta e accettazione", {
    x: MARGIN_X + 250,
    y: y + 34,
    size: 7.5,
    font: bodyFont,
    color: VALUE_COLOR,
  });
  page.drawRectangle({ x: MARGIN_X, y, width: 200, height: 28, borderWidth: 0.6, borderColor: BORDER });
  page.drawRectangle({ x: MARGIN_X + 250, y, width: 200, height: 28, borderWidth: 0.6, borderColor: BORDER });
}

/**
 * @param {object} data - output di buildDocumentData
 * @param {{ fileName: string }} meta
 */
export async function generateInpsStyleContractPdf(data, meta) {
  const pdfDoc = await PDFDocument.create();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = data.contractForm;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
    return { page, y };
  };

  const centerTitle = "CONTRATTO DI LAVORO DOMESTICO";
  const subTitle = "Lettera di assunzione – schema informativo (stile denuncia INPS)";
  const tw = titleFont.widthOfTextAtSize(centerTitle, 11);
  page.drawText(toWinAnsi(centerTitle), {
    x: (PAGE_WIDTH - tw) / 2,
    y,
    size: 11,
    font: titleFont,
    color: rgb(0.1, 0.18, 0.38),
  });
  y -= 13;
  const sw = bodyFont.widthOfTextAtSize(subTitle, 7);
  page.drawText(toWinAnsi(subTitle), {
    x: (PAGE_WIDTH - sw) / 2,
    y,
    size: 7,
    font: bodyFont,
    color: LABEL_COLOR,
  });
  y -= 16;

  // DATORE
  y = drawSectionHeader(page, y, "DATORE DI LAVORO / RAPPRESENTANTE LEGALE", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Cognome", value: form.employer.surname, weight: 1 },
    { label: "Nome", value: form.employer.firstName, weight: 1 },
    { label: "Codice fiscale", value: form.employer.cf, weight: 1 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Professione", value: form.employer.profession, weight: 1 },
    { label: "Cittadinanza", value: form.employer.citizenship, weight: 1 },
    { label: "Sesso", value: form.employer.gender, weight: 0.6 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Luogo di nascita", value: form.employer.birthPlace, weight: 1 },
    { label: "Prov. nascita", value: form.employer.birthProvince, weight: 0.5 },
    { label: "Data di nascita", value: form.employer.birthDate, weight: 0.8 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Indirizzo del datore di lavoro", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Indirizzo", value: form.employer.street, weight: 2 },
    { label: "Frazione", value: form.employer.fraction, weight: 1 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Comune", value: form.employer.city, weight: 1.2 },
    { label: "Provincia", value: form.employer.province, weight: 0.5 },
    { label: "CAP", value: form.employer.cap, weight: 0.6 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Estremi documento di identità (datore)", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Tipo documento", value: form.employer.idDocType, weight: 1 },
    { label: "Numero", value: form.employer.idDocNumber, weight: 1 },
    { label: "Scadenza", value: form.employer.idDocExpiry, weight: 0.8 },
  ], bodyFont, titleFont);
  y -= 8;

  if (y < 280) {
    ({ y } = newPage());
  }

  // LAVORATRICE
  y = drawSectionHeader(page, y, "LAVORATRICE", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Cognome", value: form.worker.surname, weight: 1 },
    { label: "Nome", value: form.worker.firstName, weight: 1 },
    { label: "Codice fiscale", value: form.worker.cf, weight: 1 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Cognome coniuge", value: form.worker.spouseSurname, weight: 1 },
    { label: "Professione", value: form.worker.profession, weight: 1 },
    { label: "Cittadinanza", value: form.worker.citizenship, weight: 1 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Luogo di nascita", value: form.worker.birthPlace, weight: 1 },
    { label: "Prov. nascita", value: form.worker.birthProvince, weight: 0.5 },
    { label: "Data di nascita", value: form.worker.birthDate, weight: 0.8 },
    { label: "Sesso", value: form.worker.gender, weight: 0.5 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Indirizzo della lavoratrice", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Indirizzo", value: form.worker.street, weight: 2 },
    { label: "Frazione", value: form.worker.fraction, weight: 1 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Comune", value: form.worker.city, weight: 1.2 },
    { label: "Provincia", value: form.worker.province, weight: 0.5 },
    { label: "CAP", value: form.worker.cap, weight: 0.6 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Estremi documento di identità (lavoratrice)", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Tipo documento", value: form.worker.idDocType, weight: 1 },
    { label: "Numero", value: form.worker.idDocNumber, weight: 1 },
    { label: "Scadenza", value: form.worker.idDocExpiry, weight: 0.8 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Estremi titolo di soggiorno (se applicabile)", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Tipo permesso", value: form.worker.permitType, weight: 1 },
    { label: "Data richiesta", value: form.worker.permitRequestDate, weight: 0.8 },
    { label: "Motivo", value: form.worker.permitReason, weight: 1.2 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Numero", value: form.worker.permitNumber, weight: 1 },
    { label: "Scadenza", value: form.worker.permitExpiry, weight: 0.8 },
    { label: "Questura", value: form.worker.permitPoliceHQ, weight: 1.2 },
  ], bodyFont, titleFont);
  y -= 6;

  if (y < 220) {
    ({ y } = newPage());
  }

  // CONTRATTO + QUESTIONARIO
  y = drawSectionHeader(page, y, "DATI CONTRATTUALI", titleFont);
  y = drawFieldRow(page, y, [
    { label: "Tipo contratto", value: form.contract.typeLabel, weight: 1 },
    { label: "Livello CCNL", value: form.contract.level, weight: 0.6 },
    { label: "In sostituzione di", value: form.contract.replacementOf, weight: 1.2 },
  ], bodyFont, titleFont);
  y = drawFieldRow(page, y, [
    { label: "Data assunzione", value: form.contract.startDate, weight: 1 },
    { label: "Data fine rapporto", value: form.contract.endDate, weight: 1 },
    { label: "Ore settimanali", value: form.contract.weeklyHours, weight: 0.7 },
    { label: "Retribuzione mensile lorda", value: form.contract.grossSalary, weight: 1.2 },
  ], bodyFont, titleFont);

  y = drawSectionHeader(page, y, "Questionario (come da denuncia INPS)", titleFont);
  for (const q of form.questionnaire) {
    if (y < MARGIN_BOTTOM + 50) {
      ({ y } = newPage());
    }
    y = drawQuestionRow(page, y, q.question, q.answer, bodyFont, titleFont);
  }
  y -= 8;

  if (y < 200) {
    ({ y } = newPage());
  }

  const ph = data.placeholders;
  y = drawParagraphBlock(
    page,
    y,
    "INQUADRAMENTO",
    [`Livello ${ph.level} (CCNL lavoro domestico): ${ph.levelInquadramento}`],
    bodyFont,
    titleFont,
    { newPage },
  );
  y = drawParagraphBlock(
    page,
    y,
    "TIPOLOGIA E ORARIO",
    [
      `Rapporto in regime ${ph.contractTypeLabel}.`,
      `${ph.weeklyHours} ore settimanali, con riposo domenicale e mezza giornata settimanale.`,
    ],
    bodyFont,
    titleFont,
    { newPage },
  );
  y = drawParagraphBlock(
    page,
    y,
    "MANSIONI",
    [ph.mansioniIntro, "", ph.mansioniList, "", "Attività escluse:", ph.esclusioniList],
    bodyFont,
    titleFont,
    { newPage },
  );
  y = drawParagraphBlock(
    page,
    y,
    "RETRIBUZIONE E ACCANTONAMENTI",
    [
      `Retribuzione mensile lorda: ${ph.grossSalary}.`,
      "Vitto e alloggio secondo quanto indicato nel questionario e nel tipo di contratto.",
      "TFR e tredicesima maturano mensilmente; liquidazione alla cessazione o nei termini di legge.",
      "Pagamento mensile; ricevuta del solo importo netto percepito.",
    ],
    bodyFont,
    titleFont,
    { newPage },
  );
  y = drawParagraphBlock(
    page,
    y,
    "RESIDENZA E CESSAZIONE",
    [
      "La residenza presso il datore non costituisce titolo di possesso dell'immobile.",
      "Alla cessazione del rapporto la lavoratrice lascia l'alloggio senza ritardi.",
    ],
    bodyFont,
    titleFont,
    { newPage },
  );

  drawSignatures(page, bodyFont);

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, fileName: meta.fileName };
}
