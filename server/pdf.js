/**
 * Generazione PDF busta paga
 * Salvataggio in /buste/[anno]/
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARTELLA_BUSTE = path.join(__dirname, 'buste');

/**
 * Crea la cartella buste/[anno] se non esiste
 */
function assicuraCartella(anno) {
  const dir = path.join(CARTELLA_BUSTE, String(anno));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Genera il PDF della busta paga e lo salva in buste/[anno]/
 */
export async function generaBustaPagaPDF(datiCalcolo, datore, lavoratrice) {
  const { meseLabel, anno, lordo, netto, contributiLavoratore, contributiDatore, tfr, costoTotale } = datiCalcolo;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const lineHeight = 18;

  const text = (str, x, size = 11, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(str, { x, y, size, font: f });
    y -= lineHeight;
  };

  // Titolo
  text('BUSTA PAGA', 50, 18, true);
  y -= 8;

  // Dati datore
  text('Datore di lavoro:', 50, 12, true);
  if (datore) {
    text(`${datore.nome || ''} ${datore.cognome || ''}`, 50);
    text(`CF: ${datore.cf || '-'}`, 50);
    text(`Indirizzo: ${datore.indirizzo || '-'}`, 50);
  } else {
    text('Non specificato', 50);
  }
  y -= 10;

  // Dati lavoratrice
  text('Lavoratrice:', 50, 12, true);
  if (lavoratrice) {
    text(`${lavoratrice.nome || ''} ${lavoratrice.cognome || ''}`, 50);
    text(`CF: ${lavoratrice.cf || '-'}`, 50);
  } else {
    text('Non specificata', 50);
  }
  y -= 10;

  // Periodo
  text(`Periodo: ${meseLabel} ${anno}`, 50, 12, true);
  y -= 15;

  // Riepilogo
  text('RIEPILOGO', 50, 12, true);
  text(`Stipendio lordo: € ${lordo.toFixed(2)}`, 50);
  text(`Contributi lavoratore (-7%): € ${contributiLavoratore.toFixed(2)}`, 50);
  text(`Contributi datore (+16%): € ${contributiDatore.toFixed(2)}`, 50);
  text(`Stipendio netto: € ${netto.toFixed(2)}`, 50);
  text(`TFR (7.41%): € ${tfr.toFixed(2)}`, 50);
  text(`Costo totale: € ${costoTotale.toFixed(2)}`, 50, 11, true);

  const pdfBytes = await doc.save();

  // Nome file: Busta_[Mese]_[Anno]_[Nome].pdf
  const nomeLavoratrice = lavoratrice
    ? `${(lavoratrice.nome || '').trim()}_${(lavoratrice.cognome || '').trim()}`.replace(/\s+/g, '_') || 'Lavoratrice'
    : 'Lavoratrice';
  const nomeFile = `Busta_${meseLabel}_${anno}_${nomeLavoratrice}.pdf`;

  const cartella = assicuraCartella(anno);
  const filePath = path.join(cartella, nomeFile);
  fs.writeFileSync(filePath, pdfBytes);

  return path.relative(__dirname, filePath);
}
