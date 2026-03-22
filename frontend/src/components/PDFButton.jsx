function PDFButton({ onGenerate, disabled, isLoading, statusMessage, statusType }) {
  return (
    <section className="panel panel--accent">
      <div className="panel__header panel__header--compact">
        <div>
          <p className="eyebrow">Generazione PDF</p>
          <h2>Esporta la busta paga mensile</h2>
        </div>
        <button type="button" className="primary-button" onClick={onGenerate} disabled={disabled || isLoading}>
          {isLoading ? 'Generazione...' : 'Genera Busta Paga'}
        </button>
      </div>

      <p className="pdf-description">
        Il file viene salvato automaticamente nella cartella <code>/buste/anno/</code> e poi reso disponibile
        per il download.
      </p>

      {statusMessage ? (
        <p className={`status-message status-message--${statusType}`}>{statusMessage}</p>
      ) : null}
    </section>
  )
}

export default PDFButton
