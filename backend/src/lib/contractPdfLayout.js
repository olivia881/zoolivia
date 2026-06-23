import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { displayValue } from "../../../shared/profileFields.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 36;
const MARGIN_TOP = 38;
const MARGIN_BOTTOM = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const COL_GAP = 6;

const SECTION_TITLE_H = 11;
const CELL_PAD = 3;
const LABEL_SIZE = 5.8;
const VALUE_SIZE = 7.2;
const BODY_SIZE = 7;
const LINE_GAP = 2;
const MIN_CELL_H = 19;
const LABEL_TOP = 7;
const Q_SIZE = 6.8;
const Q_ROW_MIN = 15;

const SECTION_BG = rgb(0.86, 0.89, 0.93);
const BORDER = rgb(0.55, 0.57, 0.6);
const LABEL_COLOR = rgb(0.4, 0.42, 0.46);
const VALUE_COLOR = rgb(0.06, 0.06, 0.06);
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
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) current = candidate;
    else {
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

function lineBlockHeight(lineCount, fontSize) {
  return lineCount * (fontSize + LINE_GAP);
}

function isEmpty(value) {
  const s = String(value ?? "").trim();
  return !s || s === "-";
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
  }

  function ensureSpace(needed) {
    if (state.y - needed < MARGIN_BOTTOM) newPage();
  }

  return { state, newPage, ensureSpace };
}

function measureCellH(label, value, width, bodyFont, titleFont) {
  const inner = width - CELL_PAD * 2;
  const vLines = wrapText(displayValue(value), titleFont, VALUE_SIZE, inner);
  const lLines = wrapLine(label, bodyFont, LABEL_SIZE, inner);
  const vCount = Math.max(1, vLines.length);
  const lCount = Math.max(1, lLines.length);
  return Math.max(MIN_CELL_H, LABEL_TOP + lineBlockHeight(lCount, LABEL_SIZE) + lineBlockHeight(vCount, VALUE_SIZE) + 5);
}

function drawSectionHeaderAt(ctx, x, width, title) {
  const { state } = ctx;
  const top = state.y;
  state.page.drawRectangle({
    x,
    y: top - SECTION_TITLE_H,
    width,
    height: SECTION_TITLE_H,
    color: SECTION_BG,
    borderWidth: 0.5,
    borderColor: BORDER,
  });
  state.page.drawText(toWinAnsi(title), {
    x: x + CELL_PAD,
    y: top - SECTION_TITLE_H + 3,
    size: 6.8,
    font: state.titleFont,
    color: VALUE_COLOR,
  });
  return top - SECTION_TITLE_H;
}

function drawFieldCellAt(ctx, x, topY, width, rowH, label, value) {
  const { state } = ctx;
  const inner = width - CELL_PAD * 2;
  const bottomY = topY - rowH;
  const vLines = wrapText(displayValue(value), state.titleFont, VALUE_SIZE, inner);
  const lLines = wrapLine(label, state.bodyFont, LABEL_SIZE, inner);

  state.page.drawRectangle({ x, y: bottomY, width, height: rowH, borderWidth: 0.45, borderColor: BORDER });

  let ly = topY - LABEL_TOP;
  for (const line of lLines.length ? lLines : [label]) {
    state.page.drawText(toWinAnsi(line), {
      x: x + CELL_PAD,
      y: ly,
      size: LABEL_SIZE,
      font: state.bodyFont,
      color: LABEL_COLOR,
      maxWidth: inner,
    });
    ly -= LABEL_SIZE + LINE_GAP;
  }

  let vy = bottomY + 5;
  for (const line of vLines.length ? vLines : [displayValue(value)]) {
    state.page.drawText(toWinAnsi(line), {
      x: x + CELL_PAD,
      y: vy,
      size: VALUE_SIZE,
      font: state.titleFont,
      color: VALUE_COLOR,
      maxWidth: inner,
    });
    vy += VALUE_SIZE + LINE_GAP;
  }
}

function drawFieldRowAt(ctx, x, width, topY, cells) {
  const { state } = ctx;
  const totalW = cells.reduce((s, c) => s + (c.weight || 1), 0);
  let rowH = MIN_CELL_H;
  for (const cell of cells) {
    const cw = (width * (cell.weight || 1)) / totalW;
    rowH = Math.max(rowH, measureCellH(cell.label, cell.value, cw, state.bodyFont, state.titleFont));
  }
  let cx = x;
  for (const cell of cells) {
    const cw = (width * (cell.weight || 1)) / totalW;
    drawFieldCellAt(ctx, cx, topY, cw, rowH, cell.label, cell.value);
    cx += cw;
  }
  return topY - rowH;
}

function personFieldRows(person, { worker = false } = {}) {
  const rows = [
    [
      { label: "Cognome", value: person.surname, weight: 1 },
      { label: "Nome", value: person.firstName, weight: 1 },
    ],
    [{ label: "Codice fiscale", value: person.cf, weight: 1 }],
    [
      ...(worker ? [{ label: "Cognome coniuge", value: person.spouseSurname, weight: 1 }] : []),
      { label: "Professione", value: person.profession, weight: 1 },
      { label: "Cittadinanza", value: person.citizenship, weight: 1 },
    ].filter((c) => worker || c.label !== "Cognome coniuge"),
    [
      { label: "Luogo nascita", value: person.birthPlace, weight: 1.1 },
      { label: "Prov.", value: person.birthProvince, weight: 0.5 },
      { label: "Data nasc.", value: person.birthDate, weight: 0.9 },
      { label: "Sesso", value: person.gender, weight: 0.5 },
    ],
    [
      { label: "Indirizzo", value: person.street, weight: 1.4 },
      { label: "Frazione", value: person.fraction, weight: 0.6 },
    ],
    [
      { label: "Comune", value: person.city, weight: 1 },
      { label: "Prov.", value: person.province, weight: 0.45 },
      { label: "CAP", value: person.cap, weight: 0.55 },
    ],
    [
      { label: "Doc. identita", value: person.idDocType, weight: 0.9 },
      { label: "N.", value: person.idDocNumber, weight: 0.8 },
      { label: "Scad.", value: person.idDocExpiry, weight: 0.8 },
    ],
  ];

  if (worker) {
    const hasPermit = ![
      person.permitType,
      person.permitRequestDate,
      person.permitReason,
      person.permitNumber,
      person.permitExpiry,
      person.permitPoliceHQ,
    ].every(isEmpty);
    if (hasPermit) {
      rows.push(
        [
          { label: "Permesso", value: person.permitType, weight: 1 },
          { label: "Richiesta", value: person.permitRequestDate, weight: 0.8 },
        ],
        [
          { label: "N. permesso", value: person.permitNumber, weight: 0.8 },
          { label: "Scad.", value: person.permitExpiry, weight: 0.8 },
          { label: "Questura", value: person.permitPoliceHQ, weight: 1 },
        ],
      );
    }
  }

  return rows;
}

function drawPersonColumn(ctx, x, width, title, person, options) {
  const { state } = ctx;
  let y = state.y;
  ctx.ensureSpace(SECTION_TITLE_H + MIN_CELL_H);
  y = drawSectionHeaderAt(ctx, x, width, title);
  for (const cells of personFieldRows(person, options)) {
    ctx.ensureSpace(MIN_CELL_H + 2);
    y = drawFieldRowAt(ctx, x, width, y, cells);
  }
  return y;
}

function drawDualPersonSection(ctx, employer, worker) {
  const colW = (CONTENT_WIDTH - COL_GAP) / 2;
  const leftX = MARGIN_X;
  const rightX = MARGIN_X + colW + COL_GAP;
  const startY = ctx.state.y;
  ctx.state.y = startY;

  const leftEnd = drawPersonColumn(ctx, leftX, colW, "DATORE DI LAVORO", employer, { worker: false });
  ctx.state.y = startY;
  const rightEnd = drawPersonColumn(ctx, rightX, colW, "LAVORATRICE", worker, { worker: true });
  ctx.state.y = Math.min(leftEnd, rightEnd) - 3;
}

function drawFullWidthRow(ctx, cells) {
  const { state } = ctx;
  const totalW = cells.reduce((s, c) => s + (c.weight || 1), 0);
  let rowH = MIN_CELL_H;
  for (const cell of cells) {
    const cw = (CONTENT_WIDTH * (cell.weight || 1)) / totalW;
    rowH = Math.max(rowH, measureCellH(cell.label, cell.value, cw, state.bodyFont, state.titleFont));
  }
  ctx.ensureSpace(rowH + 2);
  const topY = state.y;
  state.y = drawFieldRowAt(ctx, MARGIN_X, CONTENT_WIDTH, topY, cells);
}

function drawQuestionTable(ctx, questions) {
  const { state } = ctx;
  ctx.ensureSpace(SECTION_TITLE_H + Q_ROW_MIN);
  state.y = drawSectionHeaderAt(ctx, MARGIN_X, CONTENT_WIDTH, "Questionario INPS");
  const qW = CONTENT_WIDTH * 0.86;
  const aW = CONTENT_WIDTH - qW;

  for (const { question, answer } of questions) {
    const qLines = wrapText(question, state.bodyFont, Q_SIZE, qW - CELL_PAD * 2);
    const rowH = Math.max(Q_ROW_MIN, lineBlockHeight(Math.max(1, qLines.length), Q_SIZE) + 6);
    ctx.ensureSpace(rowH + 1);
    const topY = state.y;
    const bottomY = topY - rowH;

    state.page.drawRectangle({ x: MARGIN_X, y: bottomY, width: qW, height: rowH, borderWidth: 0.45, borderColor: BORDER });
    state.page.drawRectangle({ x: MARGIN_X + qW, y: bottomY, width: aW, height: rowH, borderWidth: 0.45, borderColor: BORDER });

    let qy = topY - 8;
    for (const line of qLines.length ? qLines : [question]) {
      state.page.drawText(toWinAnsi(line), {
        x: MARGIN_X + CELL_PAD,
        y: qy,
        size: Q_SIZE,
        font: state.bodyFont,
        color: VALUE_COLOR,
        maxWidth: qW - CELL_PAD * 2,
      });
      qy -= Q_SIZE + LINE_GAP;
    }

    const ans = displayValue(answer);
    const aw = state.titleFont.widthOfTextAtSize(ans, 7.5);
    state.page.drawText(toWinAnsi(ans), {
      x: MARGIN_X + qW + (aW - aw) / 2,
      y: bottomY + (rowH - 7.5) / 2,
      size: 7.5,
      font: state.titleFont,
      color: VALUE_COLOR,
    });
    state.y = bottomY;
  }
}

function drawCompactClause(ctx, title, text) {
  const { state } = ctx;
  ctx.ensureSpace(14);
  state.page.drawText(toWinAnsi(title), {
    x: MARGIN_X,
    y: state.y,
    size: 7.5,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  state.y -= 9;
  const lines = wrapText(text, state.bodyFont, BODY_SIZE, CONTENT_WIDTH);
  for (const line of lines) {
    ctx.ensureSpace(BODY_SIZE + LINE_GAP);
    state.page.drawText(toWinAnsi(line), {
      x: MARGIN_X,
      y: state.y,
      size: BODY_SIZE,
      font: state.bodyFont,
      color: VALUE_COLOR,
      maxWidth: CONTENT_WIDTH,
    });
    state.y -= BODY_SIZE + LINE_GAP;
  }
  state.y -= 2;
}

function drawTitle(ctx) {
  const { state } = ctx;
  const title = "CONTRATTO DI LAVORO DOMESTICO";
  const tw = state.titleFont.widthOfTextAtSize(title, 11);
  state.page.drawText(toWinAnsi(title), {
    x: (PAGE_WIDTH - tw) / 2,
    y: state.y,
    size: 11,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  state.y -= 13;
  const sub = "Lettera di assunzione - CCNL Lavoro Domestico";
  const sw = state.bodyFont.widthOfTextAtSize(sub, 6.5);
  state.page.drawText(toWinAnsi(sub), {
    x: (PAGE_WIDTH - sw) / 2,
    y: state.y,
    size: 6.5,
    font: state.bodyFont,
    color: LABEL_COLOR,
  });
  state.y -= 12;
}

function drawSignatures(ctx) {
  const { state } = ctx;
  ctx.ensureSpace(48);
  state.y -= 6;
  const boxY = state.y - 26;
  const labelY = state.y;

  state.page.drawText("Firma datore", { x: MARGIN_X, y: labelY, size: 7, font: state.bodyFont, color: VALUE_COLOR });
  state.page.drawText("Firma lavoratrice", { x: MARGIN_X + 268, y: labelY, size: 7, font: state.bodyFont, color: VALUE_COLOR });
  state.page.drawRectangle({ x: MARGIN_X, y: boxY, width: 200, height: 22, borderWidth: 0.5, borderColor: BORDER });
  state.page.drawRectangle({ x: MARGIN_X + 268, y: boxY, width: 200, height: 22, borderWidth: 0.5, borderColor: BORDER });
  state.y = boxY - 4;
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
  const ph = data.placeholders;

  drawTitle(ctx);
  drawDualPersonSection(ctx, form.employer, form.worker);

  ctx.ensureSpace(SECTION_TITLE_H + MIN_CELL_H);
  ctx.state.y = drawSectionHeaderAt(ctx, MARGIN_X, CONTENT_WIDTH, "DATI CONTRATTUALI");
  drawFullWidthRow(ctx, [
    { label: "Tipo", value: form.contract.typeLabel, weight: 0.8 },
    { label: "Livello", value: form.contract.level, weight: 0.5 },
    { label: "Assunzione", value: form.contract.startDate, weight: 0.9 },
    { label: "Fine", value: form.contract.endDate, weight: 0.7 },
    { label: "Ore/sett.", value: form.contract.weeklyHours, weight: 0.6 },
    { label: "Lordo mensile", value: form.contract.grossSalary, weight: 1 },
  ]);
  if (!isEmpty(form.contract.replacementOf)) {
    drawFullWidthRow(ctx, [{ label: "In sostituzione di", value: form.contract.replacementOf, weight: 1 }]);
  }

  drawQuestionTable(ctx, form.questionnaire);

  const mansioni = [ph.mansioniIntro, ph.mansioniList, "Escluse: " + ph.esclusioniList.replace(/\n/g, "; ")].join(" ");
  drawCompactClause(ctx, "INQUADRAMENTO", `Livello ${ph.level}: ${ph.levelInquadramento}`);
  drawCompactClause(
    ctx,
    "ORARIO E RETRIBUZIONE",
    `${ph.contractTypeLabel}, ${ph.weeklyHours} ore/sett. Lordo ${ph.grossSalary}. TFR e 13a maturano mensilmente; pagamento netto con ricevuta.`,
  );
  drawCompactClause(ctx, "MANSIONI", mansioni);
  drawCompactClause(
    ctx,
    "RESIDENZA E CESSAZIONE",
    "La residenza non costituisce titolo di possesso. Alla cessazione la lavoratrice lascia l'alloggio senza ritardi.",
  );

  drawSignatures(ctx);

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, fileName: meta.fileName };
}
