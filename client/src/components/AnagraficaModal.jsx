import { useState, useEffect } from 'react';
import { aggiornaDatore, aggiornaLavoratrice } from '../utils/api';

/**
 * Modal per la gestione dei dati anagrafici del datore e della lavoratrice
 */
export function AnagraficaModal({ anagrafica, onSalvato, onChiudi }) {
  const [tab, setTab] = useState('datore');
  const [datore, setDatore] = useState({ nome: '', cognome: '', codice_fiscale: '', indirizzo: '' });
  const [lavoratrice, setLavoratrice] = useState({ nome: '', cognome: '', codice_fiscale: '' });
  const [salvataggio, setSalvataggio] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [errore, setErrore] = useState('');

  useEffect(() => {
    if (anagrafica?.datore) setDatore(anagrafica.datore);
    if (anagrafica?.lavoratrice) setLavoratrice(anagrafica.lavoratrice);
  }, [anagrafica]);

  async function handleSalvaDatore(e) {
    e.preventDefault();
    if (!datore.nome && !datore.cognome) {
      setErrore('Inserisci almeno nome o cognome del datore');
      return;
    }
    setSalvataggio('loading');
    setErrore('');
    try {
      const updated = await aggiornaDatore(datore);
      setDatore(updated);
      setSalvataggio('ok');
      onSalvato && onSalvato({ tipo: 'datore', dati: updated });
      setTimeout(() => setSalvataggio(null), 2000);
    } catch (err) {
      setErrore(err.message);
      setSalvataggio('error');
    }
  }

  async function handleSalvaLavoratrice(e) {
    e.preventDefault();
    if (!lavoratrice.nome && !lavoratrice.cognome) {
      setErrore('Inserisci almeno nome o cognome della lavoratrice');
      return;
    }
    setSalvataggio('loading');
    setErrore('');
    try {
      const updated = await aggiornaLavoratrice(lavoratrice);
      setLavoratrice(updated);
      setSalvataggio('ok');
      onSalvato && onSalvato({ tipo: 'lavoratrice', dati: updated });
      setTimeout(() => setSalvataggio(null), 2000);
    } catch (err) {
      setErrore(err.message);
      setSalvataggio('error');
    }
  }

  function InputField({ label, value, onChange, placeholder, hint }) {
    return (
      <div>
        <label className="label">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
        />
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onChiudi} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Dati Anagrafici</h2>
          <button
            onClick={onChiudi}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: 'datore', etichetta: '🏢 Datore di Lavoro' },
            { id: 'lavoratrice', etichetta: '👩 Lavoratrice' },
          ].map(({ id, etichetta }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setErrore(''); setSalvataggio(null); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {etichetta}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === 'datore' && (
            <form onSubmit={handleSalvaDatore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Nome"
                  value={datore.nome}
                  onChange={(v) => setDatore({ ...datore, nome: v })}
                  placeholder="Mario"
                />
                <InputField
                  label="Cognome"
                  value={datore.cognome}
                  onChange={(v) => setDatore({ ...datore, cognome: v })}
                  placeholder="Rossi"
                />
              </div>
              <InputField
                label="Codice Fiscale"
                value={datore.codice_fiscale}
                onChange={(v) => setDatore({ ...datore, codice_fiscale: v.toUpperCase() })}
                placeholder="RSSMRA70L01H501X"
                hint="16 caratteri alfanumerici"
              />
              <InputField
                label="Indirizzo"
                value={datore.indirizzo}
                onChange={(v) => setDatore({ ...datore, indirizzo: v })}
                placeholder="Via Roma 1, 20100 Milano"
              />
              <SaveButton stato={salvataggio} errore={errore} />
            </form>
          )}

          {tab === 'lavoratrice' && (
            <form onSubmit={handleSalvaLavoratrice} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Nome"
                  value={lavoratrice.nome}
                  onChange={(v) => setLavoratrice({ ...lavoratrice, nome: v })}
                  placeholder="Ana"
                />
                <InputField
                  label="Cognome"
                  value={lavoratrice.cognome}
                  onChange={(v) => setLavoratrice({ ...lavoratrice, cognome: v })}
                  placeholder="Popescu"
                />
              </div>
              <InputField
                label="Codice Fiscale"
                value={lavoratrice.codice_fiscale}
                onChange={(v) => setLavoratrice({ ...lavoratrice, codice_fiscale: v.toUpperCase() })}
                placeholder="PPCNNA90A41Z129N"
                hint="16 caratteri alfanumerici"
              />
              <SaveButton stato={salvataggio} errore={errore} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveButton({ stato, errore }) {
  return (
    <div className="space-y-2">
      {errore && (
        <p className="text-red-600 text-sm">{errore}</p>
      )}
      {stato === 'ok' && (
        <p className="text-green-600 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Salvato con successo!
        </p>
      )}
      <button type="submit" disabled={stato === 'loading'} className="btn-primary">
        {stato === 'loading' ? (
          <><span className="spinner"></span> Salvataggio...</>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Salva Dati
          </>
        )}
      </button>
    </div>
  );
}
