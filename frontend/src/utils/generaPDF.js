import { jsPDF } from 'jspdf';

const MESI = [
  '', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function fmt(n) {
  return Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generaPDF({ datore, lavoratrice, risultati, mese, anno }) {
  const doc = new jsPDF();
  const meseNome = MESI[Number(mese)] || mese;
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSTA PAGA', pageW / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${meseNome} ${anno}`, pageW / 2, 28, { align: 'center' });

  doc.setDrawColor(30, 86, 219);
  doc.setLineWidth(0.5);
  doc.line(14, 33, pageW - 14, 33);

  let y = 42;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATORE DI LAVORO', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${datore.nome} ${datore.cognome}`, 14, y); y += 5;
  doc.text(`Codice Fiscale: ${datore.codiceFiscale}`, 14, y); y += 5;
  if (datore.indirizzo) {
    doc.text(`Indirizzo: ${datore.indirizzo}`, 14, y); y += 5;
  }

  y += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LAVORATRICE', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${lavoratrice.nome} ${lavoratrice.cognome}`, 14, y); y += 5;
  doc.text(`Codice Fiscale: ${lavoratrice.codiceFiscale}`, 14, y); y += 5;
  doc.text(`Tipo contratto: ${lavoratrice.tipoContratto === 'convivente' ? 'Convivente' : 'Non convivente'}`, 14, y); y += 5;
  doc.text(`Livello: ${lavoratrice.livello}`, 14, y); y += 5;

  y += 5;
  doc.setDrawColor(30, 86, 219);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RIEPILOGO RETRIBUTIVO', 14, y);
  y += 10;

  const righe = [
    ['Retribuzione lorda', `\u20AC ${fmt(risultati.lordo)}`],
    ['Contributi INPS lavoratore (7%)', `- \u20AC ${fmt(risultati.contributiLavoratore)}`],
    ['Retribuzione netta', `\u20AC ${fmt(risultati.netto)}`],
    ['', ''],
    ['Contributi INPS datore (16%)', `\u20AC ${fmt(risultati.contributiDatore)}`],
    ['TFR maturato (7,41%)', `\u20AC ${fmt(risultati.tfr)}`],
    ['Quota tredicesima', `\u20AC ${fmt(risultati.tredicesima)}`],
    ['', ''],
    ['COSTO TOTALE MENSILE', `\u20AC ${fmt(risultati.costoTotale)}`],
  ];

  doc.setFontSize(10);
  for (const [label, value] of righe) {
    if (!label && !value) {
      y += 3;
      continue;
    }
    const isBold = label === 'Retribuzione netta' || label === 'COSTO TOTALE MENSILE';
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label, 18, y);
    doc.text(value, pageW - 18, y, { align: 'right' });
    if (isBold) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y + 2, pageW - 14, y + 2);
    }
    y += 7;
  }

  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Documento generato automaticamente - Gestionale Buste Paga Badante', pageW / 2, y, { align: 'center' });

  const nomeLavoratrice = `${lavoratrice.nome}_${lavoratrice.cognome}`.replace(/\s+/g, '_');
  const fileName = `Busta_${meseNome}_${anno}_${nomeLavoratrice}.pdf`;

  doc.save(fileName);
  return fileName;
}
