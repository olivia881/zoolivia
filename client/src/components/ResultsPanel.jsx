/**
 * Pannello risultati calcolo in tempo reale
 * Lordo, netto, contributi, TFR, tredicesima, costo totale
 */

export default function ResultsPanel({ risultato }) {
  if (!risultato) return null

  const {
    lordo,
    contributiLavoratore,
    contributiDatore,
    netto,
    tfr,
    tredicesima,
    costoTotale,
    meseLabel,
    anno
  } = risultato

  return (
    <div className="results-panel">
      <h3 className="results-title">
        {meseLabel} {anno}
      </h3>

      <div className="results-grid">
        <div className="result-row">
          <span>Stipendio lordo</span>
          <span className="val">€ {lordo.toFixed(2)}</span>
        </div>
        <div className="result-row">
          <span>Contributi lavoratore (-7%)</span>
          <span className="val">€ {contributiLavoratore.toFixed(2)}</span>
        </div>
        <div className="result-row">
          <span>Contributi datore (+16%)</span>
          <span className="val">€ {contributiDatore.toFixed(2)}</span>
        </div>
        <div className="result-row highlight">
          <span>Stipendio netto</span>
          <span className="val">€ {netto.toFixed(2)}</span>
        </div>
        <div className="result-row">
          <span>TFR (7.41%)</span>
          <span className="val">€ {tfr.toFixed(2)}</span>
        </div>
        <div className="result-row">
          <span>Tredicesima</span>
          <span className="val">€ {tredicesima.toFixed(2)}</span>
        </div>
        <div className="result-row total">
          <span>Costo totale</span>
          <span className="val">€ {costoTotale.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
