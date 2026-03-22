import { useState, useEffect } from 'react';
import { getBuste, eliminaBusta, getDownloadUrl } from '../utils/api';
import { formatEuro, formatMese, formatData } from '../utils/formatters';

/**
 * Tab archivio buste paga - mostra storico con download e elimina
 */
export function ArchivioTab({ aggiornaContatore }) {
  const [buste, setBuste] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [eliminando, setEliminando] = useState(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    caricaBuste();
  }, [aggiornaContatore]);

  async function caricaBuste() {
    setCaricamento(true);
    setErrore('');
    try {
      const data = await getBuste();
      setBuste(data);
    } catch (err) {
      setErrore('Impossibile caricare l\'archivio: ' + err.message);
    } finally {
      setCaricamento(false);
    }
  }

  async function handleElimina(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questa busta paga?')) return;
    setEliminando(id);
    try {
      await eliminaBusta(id);
      setBuste((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert('Errore durante l\'eliminazione: ' + err.message);
    } finally {
      setEliminando(null);
    }
  }

  // Raggruppa per anno
  const bustePerAnno = buste.reduce((acc, busta) => {
    const anno = busta.anno;
    if (!acc[anno]) acc[anno] = [];
    acc[anno].push(busta);
    return acc;
  }, {});

  const anni = Object.keys(bustePerAnno).sort((a, b) => b - a);

  if (caricamento) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Caricamento archivio...</p>
        </div>
      </div>
    );
  }

  if (errore) {
    return (
      <div className="card text-center py-10">
        <p className="text-red-600 mb-3">{errore}</p>
        <button onClick={caricaBuste} className="btn-secondary text-sm px-4 py-2 mx-auto">
          Riprova
        </button>
      </div>
    );
  }

  if (buste.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Archivio vuoto</p>
        <p className="text-gray-400 text-sm mt-1">Nessuna busta paga generata ancora.</p>
        <p className="text-gray-400 text-sm">Usa il tab "Calcolo" per creare la prima.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totale buste */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{buste.length}</span> busta{buste.length !== 1 ? 'e' : ''} in archivio
        </p>
        <button onClick={caricaBuste} className="btn-secondary text-xs px-3 py-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Aggiorna
        </button>
      </div>

      {/* Lista per anno */}
      {anni.map((anno) => (
        <div key={anno} className="card p-0 overflow-hidden">
          {/* Header anno */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {anno}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {bustePerAnno[anno].length} buste
            </span>
          </div>

          {/* Righe buste */}
          <div className="divide-y divide-gray-50">
            {bustePerAnno[anno].map((busta) => (
              <div key={busta.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                {/* Icona PDF */}
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {formatMese(busta.mese, busta.anno)}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {busta.tipo_contratto === 'convivente' ? 'Conv.' : 'Non Conv.'} · {busta.livello}
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-blue-600 font-medium">
                      Netto: {formatEuro(busta.netto)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Tot: {formatEuro(busta.costo_totale)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">{formatData(busta.created_at)}</p>
                </div>

                {/* Azioni */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={getDownloadUrl(busta.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Scarica PDF"
                    className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>

                  <button
                    onClick={() => handleElimina(busta.id)}
                    disabled={eliminando === busta.id}
                    title="Elimina"
                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {eliminando === busta.id ? (
                      <span className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
