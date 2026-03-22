import React from 'react';

function fmt(n) {
  return Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ResultsPanel({ risultati }) {
  if (!risultati || risultati.lordo === 0) {
    return (
      <div className="card results-empty">
        <p>Compila i dati per visualizzare i calcoli in tempo reale.</p>
      </div>
    );
  }

  return (
    <div className="card results-panel">
      <h2 className="card-title">Riepilogo Calcoli</h2>
      <div className="results-grid">
        <div className="result-row">
          <span className="result-label">Retribuzione lorda</span>
          <span className="result-value">&euro; {fmt(risultati.lordo)}</span>
        </div>
        <div className="result-row highlight-negative">
          <span className="result-label">Contributi INPS lavoratore (7%)</span>
          <span className="result-value">- &euro; {fmt(risultati.contributiLavoratore)}</span>
        </div>
        <div className="result-row result-net">
          <span className="result-label">Retribuzione netta</span>
          <span className="result-value">&euro; {fmt(risultati.netto)}</span>
        </div>

        <div className="result-divider" />

        <div className="result-row">
          <span className="result-label">Contributi INPS datore (16%)</span>
          <span className="result-value">&euro; {fmt(risultati.contributiDatore)}</span>
        </div>
        <div className="result-row">
          <span className="result-label">TFR maturato (7,41%)</span>
          <span className="result-value">&euro; {fmt(risultati.tfr)}</span>
        </div>
        <div className="result-row">
          <span className="result-label">Quota tredicesima</span>
          <span className="result-value">&euro; {fmt(risultati.tredicesima)}</span>
        </div>

        <div className="result-divider" />

        <div className="result-row result-total">
          <span className="result-label">Costo totale mensile</span>
          <span className="result-value">&euro; {fmt(risultati.costoTotale)}</span>
        </div>
      </div>
    </div>
  );
}
