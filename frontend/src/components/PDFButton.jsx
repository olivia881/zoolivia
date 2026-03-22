export default function PDFButton({ onClick, loading, disabled, downloadUrl }) {
  return (
    <section className="card actions">
      <button type="button" onClick={onClick} disabled={disabled || loading} className="primary-btn">
        {loading ? "Generazione in corso..." : "Genera Busta Paga"}
      </button>

      {downloadUrl && (
        <a href={downloadUrl} target="_blank" rel="noreferrer" className="download-link">
          Apri PDF generato
        </a>
      )}
    </section>
  );
}
