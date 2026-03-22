const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const MESI_NOMI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function formatEuro(n) {
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `EUR ${n.toFixed(2).replace('.', ',')}`;
  }
}

/**
 * Genera la busta paga in formato PDF
 * @param {Object} options
 * @param {Object} options.datore - Dati datore di lavoro
 * @param {Object} options.lavoratrice - Dati lavoratrice
 * @param {number} options.mese - Numero mese (1-12)
 * @param {number} options.anno - Anno
 * @param {Object} options.calcoli - Risultati del calcolo
 * @param {string} options.tipoContratto - Tipo contratto
 * @param {string} options.livello - Livello CCNL
 * @param {number} options.oreSettimanali - Ore settimanali
 * @param {number} options.pagaOraria - Paga oraria
 * @param {string} options.outputPath - Percorso file di output
 * @returns {Promise<string>} Percorso del file generato
 */
function generaPDF({
  datore,
  lavoratrice,
  mese,
  anno,
  calcoli,
  tipoContratto,
  livello,
  oreSettimanali,
  pagaOraria,
  outputPath,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    const BLU_SCURO = '#1E3A8A';
    const BLU_CHIARO = '#EFF6FF';
    const BLU_MEDIO = '#3B82F6';
    const GRIGIO_CHIARO = '#F9FAFB';
    const GRIGIO_BORDO = '#E5E7EB';
    const VERDE = '#059669';
    const VERDE_CHIARO = '#F0FDF4';
    const TESTO_SCURO = '#111827';
    const TESTO_GRIGIO = '#6B7280';
    const BIANCO = '#FFFFFF';

    const MARGINE = 50;
    const LARGHEZZA_PAGINA = 595;
    const AREA_UTILE = LARGHEZZA_PAGINA - MARGINE * 2; // 495

    // ─── HEADER BLU ───────────────────────────────────────────────────────
    doc.rect(0, 0, LARGHEZZA_PAGINA, 85).fill(BLU_SCURO);

    doc.fillColor(BIANCO)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('BUSTA PAGA', 0, 18, { width: LARGHEZZA_PAGINA, align: 'center' });

    doc.fontSize(13)
      .font('Helvetica')
      .text(`${MESI_NOMI[mese - 1]} ${anno}`, 0, 50, { width: LARGHEZZA_PAGINA, align: 'center' });

    let y = 105;

    // ─── SEZIONE ANAGRAFICA ───────────────────────────────────────────────
    // Labels categorie
    doc.fillColor(BLU_MEDIO)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('DATORE DI LAVORO', MARGINE, y);

    doc.fillColor(BLU_MEDIO)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('LAVORATRICE', MARGINE + 255, y);

    y += 14;

    // Nomi
    doc.fillColor(TESTO_SCURO)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${datore.nome} ${datore.cognome}`.trim() || 'N.D.', MARGINE, y, { width: 240 });

    doc.fillColor(TESTO_SCURO)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${lavoratrice.nome} ${lavoratrice.cognome}`.trim() || 'N.D.', MARGINE + 255, y, { width: 240 });

    y += 17;

    // Codici fiscali
    doc.fillColor(TESTO_GRIGIO)
      .fontSize(10)
      .font('Helvetica')
      .text(`C.F.: ${datore.codice_fiscale || 'n.d.'}`, MARGINE, y, { width: 240 });

    doc.fillColor(TESTO_GRIGIO)
      .fontSize(10)
      .font('Helvetica')
      .text(`C.F.: ${lavoratrice.codice_fiscale || 'n.d.'}`, MARGINE + 255, y, { width: 240 });

    y += 14;

    if (datore.indirizzo) {
      doc.fillColor(TESTO_GRIGIO)
        .fontSize(10)
        .font('Helvetica')
        .text(`Indirizzo: ${datore.indirizzo}`, MARGINE, y, { width: 240 });
      y += 14;
    }

    y += 8;

    // ─── LINEA SEPARATRICE ────────────────────────────────────────────────
    doc.moveTo(MARGINE, y).lineTo(MARGINE + AREA_UTILE, y)
      .lineWidth(0.5).strokeColor(GRIGIO_BORDO).stroke();
    y += 10;

    // ─── DETTAGLI CONTRATTO ───────────────────────────────────────────────
    const nomeContratto = tipoContratto === 'convivente' ? 'Convivente' : 'Non Convivente';
    let dettagliContratto = `Tipo: ${nomeContratto}  |  Livello CCNL: ${livello}`;
    if (tipoContratto === 'non_convivente') {
      dettagliContratto += `  |  ${oreSettimanali} ore/sett.  |  ${formatEuro(pagaOraria)}/ora`;
    }

    doc.fillColor(TESTO_GRIGIO).fontSize(9).font('Helvetica').text(dettagliContratto, MARGINE, y);
    y += 18;

    doc.moveTo(MARGINE, y).lineTo(MARGINE + AREA_UTILE, y)
      .lineWidth(0.5).strokeColor(GRIGIO_BORDO).stroke();
    y += 12;

    // ─── INTESTAZIONE TABELLA ─────────────────────────────────────────────
    doc.rect(MARGINE, y, AREA_UTILE, 22).fill(BLU_SCURO);
    doc.fillColor(BIANCO).fontSize(10).font('Helvetica-Bold')
      .text('VOCE', MARGINE + 10, y + 6);
    doc.fillColor(BIANCO).fontSize(10).font('Helvetica-Bold')
      .text('IMPORTO', MARGINE, y + 6, { width: AREA_UTILE - 10, align: 'right' });
    y += 22;

    // ─── FUNZIONE RIGA TABELLA ────────────────────────────────────────────
    function disegnaRiga(label, valore, opts = {}) {
      const { grassetto = false, sfondo = BIANCO, coloreTesto = TESTO_SCURO, altezza = 22 } = opts;
      doc.rect(MARGINE, y, AREA_UTILE, altezza).fill(sfondo);
      const font = grassetto ? 'Helvetica-Bold' : 'Helvetica';
      doc.fillColor(coloreTesto).fontSize(11).font(font)
        .text(label, MARGINE + 10, y + 5, { width: 320 });
      doc.fillColor(coloreTesto).fontSize(11).font(font)
        .text(valore, MARGINE, y + 5, { width: AREA_UTILE - 10, align: 'right' });
      y += altezza;
    }

    // ─── RIGHE CALCOLO ────────────────────────────────────────────────────
    disegnaRiga('Stipendio Lordo', formatEuro(calcoli.lordo), { sfondo: GRIGIO_CHIARO });
    disegnaRiga(
      'Contributi INPS lavoratrice (~7%)',
      `- ${formatEuro(calcoli.contributiLavoratore)}`,
      { sfondo: BIANCO, coloreTesto: '#DC2626' },
    );

    // Riga netto evidenziata
    disegnaRiga('NETTO IN BUSTA', formatEuro(calcoli.netto), {
      grassetto: true,
      sfondo: BLU_CHIARO,
      coloreTesto: BLU_SCURO,
      altezza: 26,
    });

    y += 6;

    // Sottotitolo voci datore
    doc.fillColor(TESTO_GRIGIO).fontSize(9).font('Helvetica')
      .text('Voci di accantonamento/costo a carico del datore:', MARGINE + 10, y + 3);
    y += 18;

    disegnaRiga('Contributi INPS datore (~16%)', formatEuro(calcoli.contributiDatore), { sfondo: GRIGIO_CHIARO });
    disegnaRiga('Rateo TFR mensile (7,41% del lordo)', formatEuro(calcoli.tfr), { sfondo: BIANCO });
    disegnaRiga('Rateo Tredicesima (lordo / 12)', formatEuro(calcoli.tredicesima), { sfondo: GRIGIO_CHIARO });

    y += 8;

    // ─── RIGA COSTO TOTALE ────────────────────────────────────────────────
    doc.rect(MARGINE, y, AREA_UTILE, 28).fill(TESTO_SCURO);
    doc.fillColor(BIANCO).fontSize(12).font('Helvetica-Bold')
      .text('COSTO TOTALE MENSILE', MARGINE + 10, y + 8);
    doc.fillColor(BIANCO).fontSize(12).font('Helvetica-Bold')
      .text(formatEuro(calcoli.costoTotale), MARGINE, y + 8, { width: AREA_UTILE - 10, align: 'right' });
    y += 28;

    // ─── RIGA NETTO VERDE ────────────────────────────────────────────────
    y += 8;
    doc.rect(MARGINE, y, AREA_UTILE, 24).fill(VERDE_CHIARO);
    doc.fillColor(VERDE).fontSize(11).font('Helvetica-Bold')
      .text('Netto da corrispondere alla lavoratrice:', MARGINE + 10, y + 6, { width: 310 });
    doc.fillColor(VERDE).fontSize(11).font('Helvetica-Bold')
      .text(formatEuro(calcoli.netto), MARGINE, y + 6, { width: AREA_UTILE - 10, align: 'right' });
    y += 24;

    // ─── LINEA DI FIRMA ───────────────────────────────────────────────────
    y += 30;
    doc.moveTo(MARGINE, y).lineTo(MARGINE + 180, y).lineWidth(0.5).strokeColor(GRIGIO_BORDO).stroke();
    doc.moveTo(MARGINE + AREA_UTILE - 180, y).lineTo(MARGINE + AREA_UTILE, y)
      .lineWidth(0.5).strokeColor(GRIGIO_BORDO).stroke();
    y += 8;
    doc.fillColor(TESTO_GRIGIO).fontSize(9).font('Helvetica')
      .text('Firma datore di lavoro', MARGINE, y, { width: 180, align: 'center' });
    doc.fillColor(TESTO_GRIGIO).fontSize(9).font('Helvetica')
      .text('Firma lavoratrice', MARGINE + AREA_UTILE - 180, y, { width: 180, align: 'center' });

    // ─── FOOTER ───────────────────────────────────────────────────────────
    const dataGenerazione = new Date().toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
      .text(
        `Documento generato automaticamente il ${dataGenerazione} - Gestionale Badante`,
        0,
        792,
        { width: LARGHEZZA_PAGINA, align: 'center' },
      );

    doc.end();

    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

module.exports = { generaPDF, MESI_NOMI };
