import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { displayValue } from "../../../shared/profileFields.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 40;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const SECTION_TITLE_H = 18;
const CELL_PAD_X = 5;
const LABEL_SIZE = 7;
const VALUE_SIZE = 8.5;
const BODY_SIZE = 8;
const LINE_GAP = 3.5;
const SECTION_GAP = 6;
const MIN_CELL_H = 28;
const LABEL_BASELINE = 10;
const VALUE_BASELINE = 22;

const SECTION_BG = rgb(0.84, 0.87, 0.91);
const BORDER = rgb(0.5, 0.53, 0.58);
const LABEL_COLOR = rgb(0.38, 0.4, 0.45);
const VALUE_COLOR = rgb(0.08, 0.08, 0.08);
const HEADING_COLOR = rgb(0.1, 0.18, 0.36);

function toWinAnsi(text) {
  return String(text ?? "")
    .replace(/\u2212/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"');
}

function wrapLine(line, font, fontSize, maxWidth) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed) return [""];
  const words = trimmed.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapText(text, font, fontSize, maxWidth) {
  return String(text ?? "")
    .split("\n")
    .flatMap((line) => wrapLine(line, font, fontSize, maxWidth));
}

function measureWrappedHeight(lines, fontSize) {
  if (!lines.length) return fontSize + LINE_GAP;
  return lines.length * (fontSize + LINE_GAP);
}

function createContext(pdfDoc, titleFont, bodyFont) {
  const state = {
    pdfDoc,
    titleFont,
    bodyFont,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN_TOP,
  };

  function newPage() {
    state.page = state.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    state.y = PAGE_HEIGHT - MARGIN_TOP;
    return state.y;
  }

  function ensureSpace(needed) {
    if (state.y - needed < MARGIN_BOTTOM) {
      newPage();
    }
  }

  function drawTextLines(lines, { x = MARGIN_X, size = BODY_SIZE, font = bodyFont, color = VALUE_COLOR, maxWidth = CONTENT_WIDTH, lineHeight } = {}) {
    const lh = lineHeight ?? size + LINE_GAP;
    for (const line of lines) {
      ensureSpace(lh + 2);
      const wrapped = wrapLine(line, font, size, maxWidth);
      for (const segment of wrapped) {
        ensureSpace(lh + 2);
        state.page.drawText(toWinAnsi(segment), {
          x,
          y: state.y,
          size,
          font,
          color,
          maxWidth,
        });
        state.y -= lh;
      }
    }
  }

  return { state, newPage, ensureSpace, drawTextLines };
}

function drawSectionHeader(ctx, title) {
  const { state } = ctx;
  ctx.ensureSpace(SECTION_TITLE_H + 2);
  const top = state.y;
  state.page.drawRectangle({
    x: MARGIN_X,
    y: top - SECTION_TITLE_H,
    width: CONTENT_WIDTH,
    height: SECTION_TITLE_H,
    color: SECTION_BG,
    borderWidth: 0.6,
    borderColor: BORDER,
  });
  state.page.drawText(toWinAnsi(title), {
    x: MARGIN_X + CELL_PAD_X,
    y: top - SECTION_TITLE_H + 5,
    size: 8,
    font: state.titleFont,
    color: VALUE_COLOR,
  });
  state.y = top - SECTION_TITLE_H;
}

function measureCellHeight(label, value, width, bodyFont, titleFont) {
  const innerW = width - CELL_PAD_X * 2;
  const valueLines = wrapText(displayValue(value), titleFont, VALUE_SIZE, innerW);
  const labelLines = wrapLine(label, bodyFont, LABEL_SIZE, innerW);
  const labelH = measureWrappedHeight(labelLines, LABEL_SIZE);
  const valueH = measureWrappedHeight(valueLines, VALUE_SIZE);
  return Math.max(MIN_CELL_H, LABEL_BASELINE + labelH + 4 + valueH + 6);
}

function drawFieldCell(ctx, x, topY, width, rowH, label, value) {
  const { state } = ctx;
  const innerW = width - CELL_PAD_X * 2;
  const valueLines = wrapText(displayValue(value), state.titleFont, VALUE_SIZE, innerW);
  const labelLines = wrapLine(label, state.bodyFont, LABEL_SIZE, innerW);
  const bottomY = topY - rowH;

  state.page.drawRectangle({
    x,
    y: bottomY,
    width,
    height: rowH,
    borderWidth: 0.55,
    borderColor: BORDER,
  });

  let labelY = topY - LABEL_BASELINE;
  for (const line of labelLines) {
    state.page.drawText(toWinAnsi(line), {
      x: x + CELL_PAD_X,
      y: labelY,
      size: LABEL_SIZE,
      font: state.bodyFont,
      color: LABEL_COLOR,
      maxWidth: innerW,
    });
    labelY -= LABEL_SIZE + LINE_GAP;
  }

  let valueBaseline = bottomY + 8;
  for (const line of valueLines) {
    state.page.drawText(toWinAnsi(line), {
      x: x + CELL_PAD_X,
      y: valueBaseline,
      size: VALUE_SIZE,
      font: state.titleFont,
      color: VALUE_COLOR,
      maxWidth: innerW,
    });
    valueBaseline += VALUE_SIZE + LINE_GAP;
  }
}

function drawFieldRow(ctx, cells) {
  const { state } = ctx;
  const totalWeight = cells.reduce((s, c) => s + (c.weight || 1), 0);
  const topY = state.y;
  let rowH = MIN_CELL_H;

  for (const cell of cells) {
    const w = (CONTENT_WIDTH * (cell.weight || 1)) / totalWeight;
    rowH = Math.max(rowH, measureCellHeight(cell.label, cell.value, w, state.bodyFont, state.titleFont));
  }

  ctx.ensureSpace(rowH + 2);
  let x = MARGIN_X;
  for (const cell of cells) {
    const w = (CONTENT_WIDTH * (cell.weight || 1)) / totalWeight;
    drawFieldCell(ctx, x, topY, w, rowH, cell.label, cell.value);
    x += w;
  }
  state.y = topY - rowH;
}

function drawQuestionRow(ctx, question, answer) {
  const { state } = ctx;
  const qWidth = CONTENT_WIDTH * 0.8;
  const aWidth = CONTENT_WIDTH - qWidth;
  const qLines = wrapText(question, state.bodyFont, 7.5, qWidth - CELL_PAD_X * 2);
  const rowH = Math.max(30, measureWrappedHeight(qLines, 7.5) + 14);
  ctx.ensureSpace(rowH + 2);

  const topY = state.y;
  const bottomY = topY - rowH;

  state.page.drawRectangle({ x: MARGIN_X, y: bottomY, width: qWidth, height: rowH, borderWidth: 0.55, borderColor: BORDER });
  state.page.drawRectangle({
    x: MARGIN_X + qWidth,
    y: bottomY,
    width: aWidth,
    height: rowH,
    borderWidth: 0.55,
    borderColor: BORDER,
  });

  let qY = topY - 10;
  for (const line of qLines) {
    state.page.drawText(toWinAnsi(line), {
      x: MARGIN_X + CELL_PAD_X,
      y: qY,
      size: 7.5,
      font: state.bodyFont,
      color: VALUE_COLOR,
      maxWidth: qWidth - CELL_PAD_X * 2,
    });
    qY -= 7.5 + LINE_GAP;
  }

  const answerText = displayValue(answer);
  const answerSize = 9;
  const answerWidth = state.titleFont.widthOfTextAtSize(answerText, answerSize);
  state.page.drawText(toWinAnsi(answerText), {
    x: MARGIN_X + qWidth + (aWidth - answerWidth) / 2,
    y: bottomY + (rowH - answerSize) / 2 + 2,
    size: answerSize,
    font: state.titleFont,
    color: VALUE_COLOR,
  });

  state.y = bottomY;
}

function drawClauseSection(ctx, title, paragraphs) {
  const { state } = ctx;
  ctx.ensureSpace(40);
  state.y -= SECTION_GAP;
  state.page.drawText(toWinAnsi(title), {
    x: MARGIN_X,
    y: state.y,
    size: 9,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  state.y -= 14;

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      state.y -= 6;
      continue;
    }
    const lines = String(paragraph).split("\n");
    for (const line of lines) {
      const wrapped = wrapLine(line, state.bodyFont, BODY_SIZE, CONTENT_WIDTH);
      for (const segment of wrapped) {
        ctx.ensureSpace(BODY_SIZE + LINE_GAP + 4);
        state.page.drawText(toWinAnsi(segment), {
          x: MARGIN_X,
          y: state.y,
          size: BODY_SIZE,
          font: state.bodyFont,
          color: VALUE_COLOR,
          maxWidth: CONTENT_WIDTH,
        });
        state.y -= BODY_SIZE + LINE_GAP;
      }
    }
    state.y -= 4;
  }
}

function drawDocumentTitle(ctx) {
  const { state } = ctx;
  const title = "CONTRATTO DI LAVORO DOMESTICO";
  const subtitle = "Lettera di assunzione - schema informativo (stile denuncia INPS)";
  const tw = state.titleFont.widthOfTextAtSize(title, 12);
  state.page.drawText(toWinAnsi(title), {
    x: (PAGE_WIDTH - tw) / 2,
    y: state.y,
    size: 12,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  state.y -= 16;
  const sw = state.bodyFont.widthOfTextAtSize(subtitle, 7.5);
  state.page.drawText(toWinAnsi(subtitle), {
    x: (PAGE_WIDTH - sw) / 2,
    y: state.y,
    size: 7.5,
    font: state.bodyFont,
    color: LABEL_COLOR,
  });
  state.y -= 20;
}

function drawSignatures(ctx) {
  const { state } = ctx;
  ctx.ensureSpace(90);
  const boxY = MARGIN_BOTTOM + 8;
  const labelY = boxY + 36;

  state.page.drawText("Firma datore di lavoro", {
    x: MARGIN_X,
    y: labelY,
    size: 8,
    font: state.bodyFont,
    color: VALUE_COLOR,
  });
  state.page.drawText("Firma lavoratrice per ricevuta e accettazione", {
    x: MARGIN_X + 262,
    y: labelY,
    size: 8,
    font: state.bodyFont,
    color: VALUE_COLOR,
  });
  state.page.drawRectangle({ x: MARGIN_X, y: boxY, width: 210, height: 30, borderWidth: 0.6, borderColor: BORDER });
  state.page.drawRectangle({ x: MARGIN_X + 262, y: boxY, width: 210, height: 30, borderWidth: 0.6, borderColor: BORDER });
  state.y = boxY;
}

function drawEmployerBlock(ctx, employer) {
  drawSectionHeader(ctx, "DATORE DI LAVORO / RAPPRESENTANTE LEGALE");
  drawFieldRow(ctx, [
    { label: "Cognome", value: employer.surname, weight: 1 },
    { label: "Nome", value: employer.firstName, weight: 1 },
    { label: "Codice fiscale", value: employer.cf, weight: 1.1 },
  ]);
  drawFieldRow(ctx, [
    { label: "Professione", value: employer.profession, weight: 1 },
    { label: "Cittadinanza", value: employer.citizenship, weight: 1 },
    { label: "Sesso", value: employer.gender, weight: 0.7 },
  ]);
  drawFieldRow(ctx, [
    { label: "Luogo di nascita", value: employer.birthPlace, weight: 1.2 },
    { label: "Prov. nascita", value: employer.birthProvince, weight: 0.7 },
    { label: "Data di nascita", value: employer.birthDate, weight: 1 },
  ]);

  drawSectionHeader(ctx, "Indirizzo del datore di lavoro");
  drawFieldRow(ctx, [
    { label: "Indirizzo", value: employer.street, weight: 2 },
    { label: "Frazione", value: employer.fraction, weight: 1 },
  ]);
  drawFieldRow(ctx, [
    { label: "Comune", value: employer.city, weight: 1.2 },
    { label: "Provincia", value: employer.province, weight: 0.7 },
    { label: "CAP", value: employer.cap, weight: 0.8 },
  ]);

  drawSectionHeader(ctx, "Estremi documento di identita (datore)");
  drawFieldRow(ctx, [
    { label: "Tipo documento", value: employer.idDocType, weight: 1 },
    { label: "Numero", value: employer.idDocNumber, weight: 1 },
    { label: "Scadenza", value: employer.idDocExpiry, weight: 1 },
  ]);
  ctx.state.y -= SECTION_GAP;
}

function drawWorkerBlock(ctx, worker) {
  ctx.newPage();
  drawSectionHeader(ctx, "LAVORATRICE");
  drawFieldRow(ctx, [
    { label: "Cognome", value: worker.surname, weight: 1 },
    { label: "Nome", value: worker.firstName, weight: 1 },
    { label: "Codice fiscale", value: worker.cf, weight: 1.1 },
  ]);
  drawFieldRow(ctx, [
    { label: "Cognome coniuge", value: worker.spouseSurname, weight: 1 },
    { label: "Professione", value: worker.profession, weight: 1 },
    { label: "Cittadinanza", value: worker.citizenship, weight: 1 },
  ]);
  drawFieldRow(ctx, [
    { label: "Luogo di nascita", value: worker.birthPlace, weight: 1.2 },
    { label: "Prov. nascita", value: worker.birthProvince, weight: 0.7 },
    { label: "Data di nascita", value: worker.birthDate, weight: 1 },
    { label: "Sesso", value: worker.gender, weight: 0.7 },
  ]);

  drawSectionHeader(ctx, "Indirizzo della lavoratrice");
  drawFieldRow(ctx, [
    { label: "Indirizzo", value: worker.street, weight: 2 },
    { label: "Frazione", value: worker.fraction, weight: 1 },
  ]);
  drawFieldRow(ctx, [
    { label: "Comune", value: worker.city, weight: 1.2 },
    { label: "Provincia", value: worker.province, weight: 0.7 },
    { label: "CAP", value: worker.cap, weight: 0.8 },
  ]);

  drawSectionHeader(ctx, "Estremi documento di identita (lavoratrice)");
  drawFieldRow(ctx, [
    { label: "Tipo documento", value: worker.idDocType, weight: 1 },
    { label: "Numero", value: worker.idDocNumber, weight: 1 },
    { label: "Scadenza", value: worker.idDocExpiry, weight: 1 },
  ]);

  drawSectionHeader(ctx, "Estremi titolo di soggiorno (se applicabile)");
  drawFieldRow(ctx, [
    { label: "Tipo permesso", value: worker.permitType, weight: 1.2 },
    { label: "Data richiesta", value: worker.permitRequestDate, weight: 1 },
    { label: "Motivo", value: worker.permitReason, weight: 1.2 },
  ]);
  drawFieldRow(ctx, [
    { label: "Numero", value: worker.permitNumber, weight: 1 },
    { label: "Scadenza", value: worker.permitExpiry, weight: 1 },
    { label: "Questura", value: worker.permitPoliceHQ, weight: 1.2 },
  ]);
  ctx.state.y -= SECTION_GAP;
}

function drawContractBlock(ctx, form) {
  ctx.newPage();
  drawSectionHeader(ctx, "DATI CONTRATTUALI");
  drawFieldRow(ctx, [
    { label: "Tipo contratto", value: form.contract.typeLabel, weight: 1 },
    { label: "Livello CCNL", value: form.contract.level, weight: 0.8 },
    { label: "In sostituzione di", value: form.contract.replacementOf, weight: 1.3 },
  ]);
  drawFieldRow(ctx, [
    { label: "Data assunzione", value: form.contract.startDate, weight: 1 },
    { label: "Data fine rapporto", value: form.contract.endDate, weight: 1 },
    { label: "Ore settimanali", value: form.contract.weeklyHours, weight: 0.9 },
    { label: "Retribuzione mensile lorda", value: form.contract.grossSalary, weight: 1.3 },
  ]);

  drawSectionHeader(ctx, "Questionario (come da denuncia INPS)");
  for (const q of form.questionnaire) {
    drawQuestionRow(ctx, q.question, q.answer);
  }
  ctx.state.y -= SECTION_GAP;
}

function drawLegalClauses(ctx, ph) {
  ctx.newPage();
  drawClauseSection(ctx, "INQUADRAMENTO", [
    `Livello ${ph.level} (CCNL lavoro domestico): ${ph.levelInquadramento}`,
  ]);
  drawClauseSection(ctx, "TIPOLOGIA E ORARIO", [
    `Rapporto in regime ${ph.contractTypeLabel}.`,
    `${ph.weeklyHours} ore settimanali, con riposo domenicale e mezza giornata settimanale.`,
  ]);
  drawClauseSection(ctx, "MANSIONI", [
    ph.mansioniIntro,
    ph.mansioniList,
    "Attivita escluse:",
    ph.esclusioniList,
  ]);
  drawClauseSection(ctx, "RETRIBUZIONE E ACCANTONAMENTI", [
    `Retribuzione mensile lorda: ${ph.grossSalary}.`,
    "Vitto e alloggio secondo quanto indicato nel questionario e nel tipo di contratto.",
    "TFR e tredicesima maturano mensilmente; liquidazione alla cessazione o nei termini di legge.",
    "Pagamento mensile; ricevuta del solo importo netto percepito.",
  ]);
  drawClauseSection(ctx, "RESIDENZA E CESSAZIONE", [
    "La residenza presso il datore non costituisce titolo di possesso dell'immobile.",
    "Alla cessazione del rapporto la lavoratrice lascia l'alloggio senza ritardi.",
  ]);
}

/**
 * @param {object} data - output di buildDocumentData
 * @param {{ fileName: string }} meta
 */
export async function generateInpsStyleContractPdf(data, meta) {
  const pdfDoc = await PDFDocument.create();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const ctx = createContext(pdfDoc, titleFont, bodyFont);
  const form = data.contractForm;

  drawDocumentTitle(ctx);
  drawEmployerBlock(ctx, form.employer);
  drawWorkerBlock(ctx, form.worker);
  drawContractBlock(ctx, form);
  drawLegalClauses(ctx, data.placeholders);
  drawSignatures(ctx);

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, fileName: meta.fileName };
}
