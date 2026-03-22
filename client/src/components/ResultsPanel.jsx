import { formatEuro } from '../utils/formatters';

/**
 * Pannello con i risultati del calcolo stipendio
 */
export function ResultsPanel({ calcoli }) {
  if (!calcoli) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm font-medium">I risultati appariranno qui</p>
        <p className="text-gray-400 text-xs mt-1">Compila il form a sinistra per calcolare</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
        <span className="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
        Riepilogo Stipendio
      </h2>

      {/* Lordo */}
      <div className="result-row border-b border-gray-100">
        <span className="result-label">Stipendio Lordo</span>
        <span className="result-value">{formatEuro(calcoli.lordo)}</span>
      </div>

      {/* Contributi lavoratrice */}
      <div className="result-row border-b border-gray-100">
        <span className="result-label flex items-center gap-1">
          <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
          Contributi INPS lavoratrice (~7%)
        </span>
        <span className="font-semibold text-red-600 tabular-nums">
          - {formatEuro(calcoli.contributiLavoratore)}
        </span>
      </div>

      {/* NETTO - evidenziato */}
      <div className="flex justify-between items-center py-3 px-4 my-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Netto in busta</p>
          <p className="text-xs text-blue-500">Da corrispondere alla lavoratrice</p>
        </div>
        <span className="text-2xl font-bold text-blue-700 tabular-nums">{formatEuro(calcoli.netto)}</span>
      </div>

      {/* Sezione costi datore */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-4 mb-2">
        Costi e accantonamenti datore
      </p>

      {/* Contributi datore */}
      <div className="result-row border-b border-gray-100">
        <span className="result-label flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
          Contributi INPS datore (~16%)
        </span>
        <span className="result-value text-orange-700">{formatEuro(calcoli.contributiDatore)}</span>
      </div>

      {/* TFR */}
      <div className="result-row border-b border-gray-100">
        <span className="result-label flex items-center gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full inline-block"></span>
          Rateo TFR mensile (7,41%)
        </span>
        <span className="result-value text-purple-700">{formatEuro(calcoli.tfr)}</span>
      </div>

      {/* Tredicesima */}
      <div className="result-row border-b border-gray-100">
        <span className="result-label flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
          Rateo Tredicesima (1/12)
        </span>
        <span className="result-value text-yellow-700">{formatEuro(calcoli.tredicesima)}</span>
      </div>

      {/* Costo totale */}
      <div className="flex justify-between items-center py-3 px-4 mt-3 bg-gray-900 text-white rounded-xl">
        <div>
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-0.5">Costo Totale Mensile</p>
          <p className="text-xs text-gray-400">Lordo + Inps datore + TFR + 13ª</p>
        </div>
        <span className="text-2xl font-bold tabular-nums">{formatEuro(calcoli.costoTotale)}</span>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
        Calcoli indicativi basati su CCNL Lavoro Domestico.<br />
        Aliquote INPS semplificate (lav. 7%, datore 16%).
      </p>
    </div>
  );
}
