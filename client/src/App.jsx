import { useState, useEffect, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsPanel } from './components/ResultsPanel';
import { PDFButton } from './components/PDFButton';
import { AnagraficaModal } from './components/AnagraficaModal';
import { ArchivioTab } from './components/ArchivioTab';
import { calcolaStipendio, validaForm } from './utils/calculations';
import { getAnagrafica } from './utils/api';

const annoCorrente = new Date().getFullYear();
const meseCorrente = new Date().getMonth() + 1;

const FORM_DEFAULT = {
  tipoContratto: 'convivente',
  livello: 'BS',
  oreSettimanali: '',
  pagaOraria: '',
  mese: meseCorrente,
  anno: annoCorrente,
};

export default function App() {
  const [tab, setTab] = useState('calcolo');
  const [formData, setFormData] = useState(FORM_DEFAULT);
  const [anagrafica, setAnagrafica] = useState({ datore: {}, lavoratrice: {} });
  const [mostraModal, setMostraModal] = useState(false);
  const [archivioVersion, setArchivioVersion] = useState(0);
  const [errori, setErrori] = useState({});
  const [serverOk, setServerOk] = useState(null);

  // Calcolo in tempo reale al variare del form
  const calcoli = useCallback(() => {
    const e = validaForm(formData);
    setErrori(e);
    if (Object.keys(e).length > 0) return null;
    return calcolaStipendio(formData);
  }, [formData])();

  // Carica anagrafica all'avvio e verifica server
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.ok ? setServerOk(true) : setServerOk(false))
      .catch(() => setServerOk(false));

    getAnagrafica()
      .then(setAnagrafica)
      .catch(() => {});
  }, []);

  function handleAnagraficaSalvata({ tipo, dati }) {
    setAnagrafica((prev) => ({ ...prev, [tipo]: dati }));
  }

  function handleBustaGenerata() {
    setArchivioVersion((v) => v + 1);
  }

  const nomeDatore = [anagrafica.datore?.nome, anagrafica.datore?.cognome].filter(Boolean).join(' ');
  const nomeLavoratrice = [anagrafica.lavoratrice?.nome, anagrafica.lavoratrice?.cognome].filter(Boolean).join(' ');
  const anagraficaCompleta = nomeDatore && nomeLavoratrice;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Gestionale Badante</h1>
              <p className="text-xs text-gray-400 leading-tight">CCNL Lavoro Domestico</p>
            </div>
          </div>

          {/* Indicatore anagrafica + pulsante */}
          <button
            onClick={() => setMostraModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
              anagraficaCompleta
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">
              {anagraficaCompleta ? `${nomeLavoratrice}` : 'Imposta Anagrafica'}
            </span>
            <span className="sm:hidden">Anagrafica</span>
            {!anagraficaCompleta && (
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Avviso server offline */}
        {serverOk === false && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2">
            <p className="text-xs text-red-600 text-center flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Server non raggiungibile. Avvia il backend con: <code className="font-mono bg-red-100 px-1 rounded">cd server && npm start</code>
            </p>
          </div>
        )}
      </header>

      {/* ─── NAVIGAZIONE TAB ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { id: 'calcolo', etichetta: 'Calcolo', icona: '🧮' },
            { id: 'archivio', etichetta: 'Archivio', icona: '📁' },
          ].map(({ id, etichetta, icona }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{icona}</span>
              {etichetta}
              {id === 'archivio' && archivioVersion > 0 && (
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENUTO PRINCIPALE ───────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab === 'calcolo' && (
          <>
            {/* Avviso anagrafica mancante */}
            {!anagraficaCompleta && (
              <div
                onClick={() => setMostraModal(true)}
                className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Anagrafica non configurata</p>
                  <p className="text-xs text-amber-600">
                    I dati del datore e della lavoratrice appariranno nella busta paga PDF.{' '}
                    <span className="underline">Clicca qui per configurare.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Layout principale a due colonne */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Colonna sinistra: input */}
              <div>
                <InputForm
                  formData={formData}
                  onChange={setFormData}
                  errori={errori}
                />
              </div>

              {/* Colonna destra: risultati + PDF */}
              <div className="space-y-4">
                <ResultsPanel calcoli={calcoli} />

                {calcoli && (
                  <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                      <span className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      Genera Busta Paga
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Crea il PDF e salvalo nell'archivio automaticamente.
                    </p>
                    <PDFButton
                      calcoli={calcoli}
                      formData={formData}
                      anagrafica={anagrafica}
                      onBustaGenerata={handleBustaGenerata}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Info calcolo */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'INPS Lavoratrice', valore: '7%', colore: 'text-red-600', bg: 'bg-red-50' },
                { label: 'INPS Datore', valore: '16%', colore: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Aliquota TFR', valore: '7,41%', colore: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Tredicesima', valore: 'Lordo / 12', colore: 'text-yellow-600', bg: 'bg-yellow-50' },
              ].map(({ label, valore, colore, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-bold ${colore}`}>{valore}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'archivio' && (
          <ArchivioTab aggiornaContatore={archivioVersion} />
        )}
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-4 pb-8 mt-4">
        <p className="text-center text-xs text-gray-300">
          Gestionale Badante · Calcoli basati su CCNL Lavoro Domestico · Solo uso indicativo
        </p>
      </footer>

      {/* ─── MODAL ANAGRAFICA ───────────────────────────────────────── */}
      {mostraModal && (
        <AnagraficaModal
          anagrafica={anagrafica}
          onSalvato={handleAnagraficaSalvata}
          onChiudi={() => setMostraModal(false)}
        />
      )}
    </div>
  );
}
