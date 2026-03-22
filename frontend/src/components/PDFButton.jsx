export default function PDFButton({ label, onClick, loading, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className="primary-btn">
      {loading ? "Generazione in corso..." : label}
    </button>
  );
}
