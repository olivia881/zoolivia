import { Capacitor } from "@capacitor/core";
import PDFButton from "./PDFButton";
import { openPdfByPath } from "../utils/fileDownload";

const DOCUMENT_LABELS = {
  contract: "Genera contratto",
  payslip: "Genera busta paga",
  receipt: "Genera ricevuta",
};

const FILE_LABELS = {
  contract: "Contratto di assunzione",
  clause: "Clausola integrativa",
  payslip: "Busta paga",
  receipt: "Ricevuta pagamento",
};

export default function DocumentsPanel({ onGenerate, loadingType, disabled, documents }) {
  return (
    <section className="card actions">
      <h2>Documenti</h2>
      <p className="documents-help">Genera automaticamente documenti coerenti e legalmente chiari.</p>

      <div className="documents-buttons">
        {Object.entries(DOCUMENT_LABELS).map(([documentType, label]) => (
          <PDFButton
            key={documentType}
            label={label}
            onClick={() => onGenerate(documentType)}
            loading={loadingType === documentType}
            disabled={disabled}
          />
        ))}
      </div>

      {documents.length > 0 && (
        <ul className="documents-list">
          {documents.map((document) => (
            <li key={document.url || document.fileName}>
              <span>{FILE_LABELS[document.documentType] ?? document.documentType}</span>
              {Capacitor.isNativePlatform() && document.localPath ? (
                <button
                  type="button"
                  className="download-link download-link-btn"
                  onClick={() => openPdfByPath(document.localPath)}
                >
                  Apri PDF
                </button>
              ) : (
                <a href={document.url} target="_blank" rel="noreferrer" className="download-link">
                  Apri PDF
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
