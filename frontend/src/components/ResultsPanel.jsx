import { formatCurrency } from '@shared/payslipCalculator.js'

const summaryFields = [
  { key: 'grossSalary', label: 'Lordo' },
  { key: 'netSalary', label: 'Netto' },
  { key: 'workerContributions', label: 'Contributi lavoratore' },
  { key: 'employerContributions', label: 'Contributi datore' },
  { key: 'tfr', label: 'TFR' },
  { key: 'thirteenth', label: 'Tredicesima' },
  { key: 'totalCost', label: 'Costo totale' },
]

function ResultsPanel({ calculations, archive, validationErrors }) {
  const errorMessages = Object.values(validationErrors)

  return (
    <section className="panel">
      <div className="panel__header panel__header--compact">
        <div>
          <p className="eyebrow">Risultati</p>
          <h2>Calcolo in tempo reale</h2>
        </div>
      </div>

      {errorMessages.length > 0 ? (
        <div className="validation-box">
          <strong>Completa i campi richiesti:</strong>
          <ul>
            {errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="results-grid">
            {summaryFields.map((field) => (
              <article key={field.key} className="result-card">
                <span>{field.label}</span>
                <strong>{formatCurrency(calculations[field.key])}</strong>
              </article>
            ))}
          </div>

          <div className="calculation-note">
            <p>
              <strong>Contratto:</strong> {calculations.contractLabel} - livello {calculations.levelLabel}
            </p>
            <p>
              <strong>Periodo:</strong> {calculations.monthLabel}
            </p>
            <p>
              Il costo totale include lordo, contributi a carico del datore, TFR e quota tredicesima.
            </p>
          </div>
        </>
      )}

      <div className="section-divider" />

      <div className="panel__header panel__header--compact">
        <div>
          <p className="eyebrow">Archivio PDF</p>
          <h2>Ultime buste generate</h2>
        </div>
      </div>

      {archive.length === 0 ? (
        <p className="empty-state">Nessun PDF generato al momento.</p>
      ) : (
        <div className="archive-list">
          {archive.map((item) => (
            <a key={item.id} className="archive-item" href={item.downloadUrl} target="_blank" rel="noreferrer">
              <div>
                <strong>{item.fileName}</strong>
                <span>
                  {item.monthLabel} {item.year} - {item.workerName}
                </span>
              </div>
              <span>{formatCurrency(item.netSalary)}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

export default ResultsPanel
