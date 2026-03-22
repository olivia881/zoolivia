import { useState } from 'react';
import { generaBusta, getDownloadUrl } from '../utils/api';
import { MESI_NOMI } from '../utils/calculations';
import { formatEuro } from '../utils/formatters';

/**
 * Pulsante per generare la busta paga PDF
 * Comunica con il backend per salvare i dati e generare il file
 */
export function PDFButton({ calcoli, formData, anagrafica, onBustaGenerata }) {
  const [stato, setStato] = useState('idle'); // idle | loading | success | error
  const [ultimaBusta, setUltimaBusta] = useState(null);
  const [messaggio, setMessaggio] = useState('');

  const nomeMese = MESI_NOMI[(formData.mese || 1) - 1];
  const nomeLav = [anagrafica?.lavoratrice?.nome, anagrafica?.lavoratrice?.cognome]
    .filter(Boolean)
    .join(' ') || 'Lavoratrice';

  async function handleGenera() {
    setStato('loading');
    setMessaggio('');

    try {
      const result = await generaBusta({
        tipoContratto: formData.tipoContratto,
        livello: formData.livello,
        oreSettimanali: formData.oreSettimanali || null,
        pagaOraria: formData.pagaOraria || null,
        mese: formData.mese,
        anno: formData.anno,
      });

      setUltimaBusta(result);
      setStato('success');
      setMessaggio(`Busta paga ${nomeMese} ${formData.anno} generata!`);

      if (onBustaGenerata) onBustaGenerata(result);

      // Avvia download automatico
      setTimeout(() => {
        window.open(getDownloadUrl(result.id), '_blank');
      }, 300);
    } catch (err) {
      setStato('error');
      setMessaggio(err.message || 'Errore durante la generazione');
    }
  }

  function handleScarica() {
    if (ultimaBusta?.id) {
      window.open(getDownloadUrl(ultimaBusta.id), '_blank');
    }
  }

  return (
    <div className="mt-5 space-y-3">
      {/* Messaggio feedback */}
      {stato === 'success' && (
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700">{messaggio}</p>
            {ultimaBusta && (
              <p className="text-xs text-green-600 mt-0.5">
                Netto: {formatEuro(ultimaBusta.calcoli?.netto)} — Costo totale: {formatEuro(ultimaBusta.calcoli?.costoTotale)}
              </p>
            )}
          </div>
          {ultimaBusta && (
            <button onClick={handleScarica} className="text-xs text-green-600 hover:text-green-700 underline font-medium flex-shrink-0">
              Scarica
            </button>
          )}
        </div>
      )}

      {stato === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{messaggio}</p>
        </div>
      )}

      {/* Bottone principale */}
      <button
        onClick={handleGenera}
        disabled={stato === 'loading' || !calcoli}
        className="btn-primary text-base"
      >
        {stato === 'loading' ? (
          <>
            <span className="spinner"></span>
            Generazione in corso...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Genera Busta Paga PDF
          </>
        )}
      </button>

      {!calcoli && (
        <p className="text-xs text-gray-400 text-center">
          Completa il form per abilitare la generazione
        </p>
      )}

      {/* Bottone scarica di nuovo se già generata */}
      {stato === 'success' && ultimaBusta && (
        <button onClick={handleScarica} className="btn-secondary text-sm w-full">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Scarica nuovamente
        </button>
      )}
    </div>
  );
}
