import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { displayValue } from "../../../shared/profileFields.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 34;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 38;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const BOX_HEADER_H = 10;
const CELL_PAD = 4;
const LABEL_SIZE = 6;
const VALUE_SIZE = 7.4;
const BODY_SIZE = 7;
const LINE_GAP = 2;
const MIN_CELL_H = 18;
const LABEL_TOP = 8;
const Q_SIZE = 6.6;
const Q_ROW_MIN = 14;
const BOX_GAP = 3;

const SECTION_BG = rgb(0.86, 0.89, 0.93);
const BORDER = rgb(0.35, 0.38, 0.42);
const LABEL_COLOR = rgb(0.38, 0.4, 0.44);
const VALUE_COLOR = rgb(0.05, 0.05, 0.05);
const HEADING_COLOR = rgb(0.08, 0.16, 0.34);

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
  return Math.max(
    MIN_CELL_H,
    LABEL_TOP + lineBlockHeight(Math.max(1, lLines.length), LABEL_SIZE) + lineBlockHeight(Math.max(1, vLines.length), VALUE_SIZE) + 4,
  );
}

function measureRowsHeight(rows, width, bodyFont, titleFont) {
  let h = 0;
  for (const cells of rows) {
    const totalW = cells.reduce((s, c) => s + (c.weight || 1), 0);
    let rowH = MIN_CELL_H;
    for (const cell of cells) {
      const cw = (width * (cell.weight || 1)) / totalW;
      rowH = Math.max(rowH, measureCellH(cell.label, cell.value, cw, bodyFont, titleFont));
    }
    h += rowH;
  }
  return h;
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
      font: state.titleFont,
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
      font: state.bodyFont,
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

function drawInpsBox(ctx, boxTitle, rows) {
  if (!rows.length) return;
  const { state } = ctx;
  const x = MARGIN_X;
  const width = CONTENT_WIDTH;
  const rowsH = measureRowsHeight(rows, width, state.bodyFont, state.titleFont);
  const totalH = BOX_HEADER_H + rowsH;

  ctx.ensureSpace(totalH + BOX_GAP);
  const topY = state.y;
  const bottomY = topY - totalH;

  state.page.drawRectangle({
    x,
    y: bottomY,
    width,
    height: totalH,
    borderWidth: 0.65,
    borderColor: BORDER,
  });
  state.page.drawRectangle({
    x,
    y: topY - BOX_HEADER_H,
    width,
    height: BOX_HEADER_H,
    color: SECTION_BG,
    borderWidth: 0.45,
    borderColor: BORDER,
  });
  state.page.drawLine({
    start: { x, y: topY - BOX_HEADER_H },
    end: { x: x + width, y: topY - BOX_HEADER_H },
    thickness: 0.45,
    color: BORDER,
  });
  state.page.drawText(toWinAnsi(boxTitle), {
    x: x + CELL_PAD,
    y: topY - BOX_HEADER_H + 2.5,
    size: 6.8,
    font: state.titleFont,
    color: VALUE_COLOR,
  });

  let ry = topY - BOX_HEADER_H;
  for (const cells of rows) {
    ry = drawFieldRowAt(ctx, x, width, ry, cells);
  }

  state.y = bottomY - BOX_GAP;
}

function generalitaRows(person, { worker = false } = {}) {
  const rows = [
    [
      { label: "Cognome", value: person.surname, weight: 1 },
      { label: "Nome", value: person.firstName, weight: 1 },
    ],
    [
      { label: "Professione", value: person.profession, weight: 1 },
      { label: "Cittadinanza", value: person.citizenship, weight: 1 },
      { label: "Sesso", value: person.gender, weight: 0.6 },
    ],
    [
      { label: "Luogo di nascita", value: person.birthPlace, weight: 1.2 },
      { label: "Provincia di nascita", value: person.birthProvince, weight: 0.7 },
      { label: "Data di nascita", value: person.birthDate, weight: 1 },
    ],
  ];
  if (worker) {
    rows[1].unshift({ label: "Cognome coniuge", value: person.spouseSurname, weight: 1 });
  }
  return rows;
}

function indirizzoRows(person) {
  return [
    [
      { label: "Indirizzo", value: person.street, weight: 1.6 },
      { label: "Frazione", value: person.fraction, weight: 0.8 },
    ],
    [
      { label: "Comune", value: person.city, weight: 1.2 },
      { label: "Provincia", value: person.province, weight: 0.6 },
      { label: "CAP", value: person.cap, weight: 0.7 },
    ],
  ];
}

function documentoRows(person) {
  return [
    [
      { label: "Tipo documento", value: person.idDocType, weight: 1 },
      { label: "Numero", value: person.idDocNumber, weight: 1 },
      { label: "Scadenza", value: person.idDocExpiry, weight: 1 },
    ],
  ];
}

function permessoRows(person) {
  return [
    [
      { label: "Tipo di permesso", value: person.permitType, weight: 1.1 },
      { label: "Data della richiesta", value: person.permitRequestDate, weight: 1 },
      { label: "Motivo del permesso", value: person.permitReason, weight: 1.2 },
    ],
    [
      { label: "Numero", value: person.permitNumber, weight: 1 },
      { label: "Scadenza", value: person.permitExpiry, weight: 1 },
      { label: "Questura", value: person.permitPoliceHQ, weight: 1.2 },
    ],
  ];
}

function hasPermitData(person) {
  return ![
    person.permitType,
    person.permitRequestDate,
    person.permitReason,
    person.permitNumber,
    person.permitExpiry,
    person.permitPoliceHQ,
  ].every(isEmpty);
}

function drawEntityHeading(ctx, title, cf) {
  const { state } = ctx;
  ctx.ensureSpace(13);
  state.page.drawText(toWinAnsi(title), {
    x: MARGIN_X,
    y: state.y,
    size: 8.2,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  if (!isEmpty(cf)) {
    const cfLabel = `Codice fiscale: ${displayValue(cf)}`;
    const w = state.bodyFont.widthOfTextAtSize(cfLabel, 7.2);
    state.page.drawText(toWinAnsi(cfLabel), {
      x: MARGIN_X + CONTENT_WIDTH - w,
      y: state.y,
      size: 7.2,
      font: state.bodyFont,
      color: VALUE_COLOR,
    });
  }
  state.y -= 12;
}

function drawPersonVertical(ctx, heading, generalitaTitle, person, { worker = false } = {}) {
  drawEntityHeading(ctx, heading, person.cf);
  drawInpsBox(ctx, generalitaTitle, generalitaRows(person, { worker }));
  drawInpsBox(
    ctx,
    worker ? "INDIRIZZO DEL LAVORATORE" : "INDIRIZZO DEL DATORE DI LAVORO",
    indirizzoRows(person),
  );
  drawInpsBox(
    ctx,
    worker ? "ESTREMI DEL DOCUMENTO DI IDENTITA' (lavoratrice)" : "ESTREMI DEL DOCUMENTO DI IDENTITA' (datore)",
    documentoRows(person),
  );
  if (worker && hasPermitData(person)) {
    drawInpsBox(ctx, "ESTREMI DEL TITOLO DI SOGGIORNO", permessoRows(person));
  }
}

function drawQuestionnaireBox(ctx, contract, questions) {
  const { state } = ctx;
  const x = MARGIN_X;
  const width = CONTENT_WIDTH;
  const qW = width * 0.84;
  const aW = width - qW;

  const contractRows = [
    [
      { label: "Tipo contratto", value: contract.typeLabel, weight: 1 },
      { label: "Livello CCNL", value: contract.level, weight: 0.7 },
      { label: "In sostituzione del", value: contract.replacementOf, weight: 1.1 },
    ],
    [
      { label: "Data assunzione", value: contract.startDate, weight: 1 },
      { label: "Data fine rapporto", value: contract.endDate, weight: 1 },
      { label: "Ore settimanali", value: contract.weeklyHours, weight: 0.8 },
      { label: "Retribuzione mensile", value: contract.grossSalary, weight: 1.2 },
    ],
  ];

  let qRowsH = 0;
  for (const { question } of questions) {
    const lines = wrapText(question, state.bodyFont, Q_SIZE, qW - CELL_PAD * 2);
    qRowsH += Math.max(Q_ROW_MIN, lineBlockHeight(Math.max(1, lines.length), Q_SIZE) + 5);
  }

  const rowsH = measureRowsHeight(contractRows, width, state.bodyFont, state.titleFont);
  const totalH = BOX_HEADER_H + rowsH + qRowsH;

  ctx.ensureSpace(totalH + BOX_GAP);
  const topY = state.y;
  const bottomY = topY - totalH;

  state.page.drawRectangle({ x, y: bottomY, width, height: totalH, borderWidth: 0.65, borderColor: BORDER });
  state.page.drawRectangle({
    x,
    y: topY - BOX_HEADER_H,
    width,
    height: BOX_HEADER_H,
    color: SECTION_BG,
    borderWidth: 0.45,
    borderColor: BORDER,
  });
  state.page.drawText(toWinAnsi("QUESTIONARIO"), {
    x: x + CELL_PAD,
    y: topY - BOX_HEADER_H + 2.5,
    size: 6.8,
    font: state.titleFont,
    color: VALUE_COLOR,
  });

  let ry = topY - BOX_HEADER_H;
  for (const cells of contractRows) {
    ry = drawFieldRowAt(ctx, x, width, ry, cells);
  }

  for (const { question, answer } of questions) {
    const qLines = wrapText(question, state.bodyFont, Q_SIZE, qW - CELL_PAD * 2);
    const rowH = Math.max(Q_ROW_MIN, lineBlockHeight(Math.max(1, qLines.length), Q_SIZE) + 5);
    const rowTop = ry;
    const rowBottom = rowTop - rowH;

    state.page.drawRectangle({ x, y: rowBottom, width: qW, height: rowH, borderWidth: 0.45, borderColor: BORDER });
    state.page.drawRectangle({ x: x + qW, y: rowBottom, width: aW, height: rowH, borderWidth: 0.45, borderColor: BORDER });

    let qy = rowTop - 8;
    for (const line of qLines.length ? qLines : [question]) {
      state.page.drawText(toWinAnsi(line), {
        x: x + CELL_PAD,
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
      x: x + qW + aW - aw - CELL_PAD,
      y: rowBottom + (rowH - 7.5) / 2,
      size: 7.5,
      font: state.titleFont,
      color: VALUE_COLOR,
    });
    ry = rowBottom;
  }

  state.y = bottomY - BOX_GAP;
}

function drawClausesBox(ctx, ph) {
  const mansioni = [ph.mansioniIntro, ph.mansioniList, "Attivita escluse: " + ph.esclusioniList.replace(/\n/g, " ")].join(" ");
  const text = [
    `INQUADRAMENTO - Livello ${ph.level}: ${ph.levelInquadramento}`,
    `TIPOLOGIA - ${ph.contractTypeLabel}, ${ph.weeklyHours} ore settimanali.`,
    `RETRIBUZIONE - Lordo mensile ${ph.grossSalary}. TFR e 13a maturano mensilmente; pagamento netto con ricevuta.`,
    `MANSIONI - ${mansioni}`,
    "RESIDENZA - Non costituisce titolo di possesso. Cessazione: lasciare l'alloggio senza ritardi.",
  ].join("\n");

  const { state } = ctx;
  const lines = wrapText(text, state.bodyFont, BODY_SIZE, CONTENT_WIDTH - CELL_PAD * 2);
  const bodyH = lineBlockHeight(lines.length, BODY_SIZE) + 8;
  const totalH = BOX_HEADER_H + bodyH;

  ctx.ensureSpace(totalH + BOX_GAP);
  const topY = state.y;
  const bottomY = topY - totalH;

  state.page.drawRectangle({ x: MARGIN_X, y: bottomY, width: CONTENT_WIDTH, height: totalH, borderWidth: 0.65, borderColor: BORDER });
  state.page.drawRectangle({
    x: MARGIN_X,
    y: topY - BOX_HEADER_H,
    width: CONTENT_WIDTH,
    height: BOX_HEADER_H,
    color: SECTION_BG,
  });
  state.page.drawText(toWinAnsi("CLAUSOLE CONTRATTUALI (CCNL Lavoro Domestico)"), {
    x: MARGIN_X + CELL_PAD,
    y: topY - BOX_HEADER_H + 2.5,
    size: 6.8,
    font: state.titleFont,
    color: VALUE_COLOR,
  });

  let ty = topY - BOX_HEADER_H - 10;
  for (const line of lines) {
    state.page.drawText(toWinAnsi(line), {
      x: MARGIN_X + CELL_PAD,
      y: ty,
      size: BODY_SIZE,
      font: state.bodyFont,
      color: VALUE_COLOR,
      maxWidth: CONTENT_WIDTH - CELL_PAD * 2,
    });
    ty -= BODY_SIZE + LINE_GAP;
  }

  state.y = bottomY - BOX_GAP;
}

function drawDocumentHeader(ctx) {
  const { state } = ctx;
  const title = "CONTRATTO DI LAVORO DOMESTICO";
  const tw = state.titleFont.widthOfTextAtSize(title, 11.5);
  state.page.drawText(toWinAnsi(title), {
    x: (PAGE_WIDTH - tw) / 2,
    y: state.y,
    size: 11.5,
    font: state.titleFont,
    color: HEADING_COLOR,
  });
  state.y -= 14;

  const sub = "Lettera di assunzione - schema informativo (stile denuncia INPS)";
  const sw = state.bodyFont.widthOfTextAtSize(sub, 6.8);
  state.page.drawText(toWinAnsi(sub), {
    x: (PAGE_WIDTH - sw) / 2,
    y: state.y,
    size: 6.8,
    font: state.bodyFont,
    color: LABEL_COLOR,
  });
  state.y -= 14;
}

function drawSignatures(ctx) {
  const { state } = ctx;
  ctx.ensureSpace(44);
  state.y -= 4;
  const boxY = state.y - 24;
  state.page.drawText("Firma datore di lavoro", { x: MARGIN_X, y: state.y, size: 7, font: state.bodyFont, color: VALUE_COLOR });
  state.page.drawText("Firma lavoratrice", { x: MARGIN_X + 270, y: state.y, size: 7, font: state.bodyFont, color: VALUE_COLOR });
  state.page.drawRectangle({ x: MARGIN_X, y: boxY, width: 210, height: 22, borderWidth: 0.55, borderColor: BORDER });
  state.page.drawRectangle({ x: MARGIN_X + 270, y: boxY, width: 210, height: 22, borderWidth: 0.55, borderColor: BORDER });
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

  drawDocumentHeader(ctx);

  drawPersonVertical(ctx, "Datore di lavoro / Rappresentante legale", "PERSONA FISICA / RAPPRESENTANTE LEGALE", form.employer);
  drawPersonVertical(ctx, "Lavoratrice", "GENERALITA' DELLA LAVORATRICE", form.worker, { worker: true });

  drawQuestionnaireBox(ctx, form.contract, form.questionnaire);
  drawClausesBox(ctx, data.placeholders);
  drawSignatures(ctx);

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, fileName: meta.fileName };
}
