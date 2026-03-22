import React, { useState } from 'react';
import { generaPDF } from '../utils/generaPDF';

export default function PDFButton({ formData, risultati, disabled }) {
  const [generating, setGenerating] = useState(false);
  const [lastFile, setLastFile] = useState('');

  const handleGenera = async () => {
    setGenerating(true);
    try {
      const fileName = generaPDF({
        datore: {
          nome: formData.datoreNome,
          cognome: formData.datoreCognome,
          codiceFiscale: formData.datoreCodiceFiscale,
          indirizzo: formData.datoreIndirizzo,
        },
        lavoratrice: {
          nome: formData.lavoratriceNome,
          cognome: formData.lavoratriceCognome,
          codiceFiscale: formData.lavoratriceCodiceFiscale,
          tipoContratto: formData.tipoContratto,
          livello: formData.livello,
        },
        risultati,
        mese: formData.mese,
        anno: formData.anno,
      });
      setLastFile(fileName);

      try {
        await fetch('/api/buste-paga/salva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lavoratrice_id: formData.lavoratriceId || 1,
            datore_id: formData.datoreId || 1,
            mese: formData.mese,
            anno: formData.anno,
            tipo_contratto: formData.tipoContratto,
            livello: formData.livello,
            ore_settimanali: formData.oreSettimanali,
            paga_oraria: formData.pagaOraria,
            ...risultati,
            contributi_lavoratore: risultati.contributiLavoratore,
            contributi_datore: risultati.contributiDatore,
            costo_totale: risultati.costoTotale,
            pdf_path: `buste/${formData.anno}/${fileName}`,
          }),
        });
      } catch {
        // Il salvataggio su DB è opzionale: il PDF viene comunque generato
      }
    } catch (err) {
      alert('Errore nella generazione del PDF: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="pdf-section">
      <button
        className="btn-pdf"
        onClick={handleGenera}
        disabled={disabled || generating}
      >
        {generating ? 'Generazione in corso...' : '📄 Genera Busta Paga PDF'}
      </button>
      {lastFile && (
        <p className="pdf-info">Ultimo file generato: <strong>{lastFile}</strong></p>
      )}
    </div>
  );
}
