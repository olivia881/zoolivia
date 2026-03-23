import { useState, useMemo } from "react";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function DetailModal({ entry, onClose, onDelete }) {
  if (!entry) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header">
          <h3>
            {MONTHS[entry.month - 1]} {entry.year} – {entry.workerName}
          </h3>
          <button type="button" className="history-modal-close" onClick={onClose} aria-label="Chiudi">
            ×
          </button>
        </div>
        <div className="history-modal-body">
          <div className="history-detail-grid">
            <div className="history-detail-row">
              <span>Lavoratrice</span>
              <span>{entry.workerName}</span>
            </div>
            <div className="history-detail-row">
              <span>Codice fiscale</span>
              <span>{entry.workerCf}</span>
            </div>
            <div className="history-detail-row">
              <span>Livello</span>
              <span>{entry.level ?? "–"}</span>
            </div>
            <div className="history-detail-row">
              <span>Ore settimanali</span>
              <span>{entry.weeklyHours ?? "–"}</span>
            </div>
            <div className="history-detail-row">
              <span>Lordo</span>
              <span>{euro(entry.gross)}</span>
            </div>
            <div className="history-detail-row">
              <span>Contributi lavoratrice</span>
              <span>{euro(entry.employeeContributions)}</span>
            </div>
            <div className="history-detail-row">
              <span>Contributi datore</span>
              <span>{euro(entry.employerContributions)}</span>
            </div>
            <div className="history-detail-row bold">
              <span>Netto</span>
              <span>{euro(entry.net)}</span>
            </div>
            <div className="history-detail-row">
              <span>TFR</span>
              <span>{euro(entry.tfr)}</span>
            </div>
            <div className="history-detail-row">
              <span>Tredicesima</span>
              <span>{euro(entry.thirteenth)}</span>
            </div>
            <div className="history-detail-row bold">
              <span>Costo totale datore</span>
              <span>{euro(entry.totalCost)}</span>
            </div>
          </div>
        </div>
        <div className="history-modal-footer">
          <button type="button" className="history-btn-delete" onClick={() => onDelete(entry.id)}>
            Elimina voce
          </button>
          <button type="button" className="primary-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPanel({
  history,
  filterYear,
  onFilterYearChange,
  onDelete,
  onReset,
}) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const filteredHistory = useMemo(() => {
    if (!filterYear) return history;
    return history.filter((e) => e.year === Number(filterYear));
  }, [history, filterYear]);

  const availableYears = useMemo(() => {
    const years = [...new Set(history.map((e) => e.year))].sort((a, b) => b - a);
    return years;
  }, [history]);

  function handleDelete(id) {
    onDelete(id);
    setSelectedEntry(null);
  }

  function handleReset() {
    onReset();
    setShowResetConfirm(false);
  }

  return (
    <section className="card">
      <div className="history-header">
        <h2>Storico</h2>
        <div className="history-controls">
          {availableYears.length > 0 && (
            <select
              value={filterYear ?? ""}
              onChange={(e) => onFilterYearChange(e.target.value || null)}
              className="history-filter"
              aria-label="Filtra per anno"
            >
              <option value="">Tutti gli anni</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          {history.length > 0 && (
            <button
              type="button"
              className="history-btn-reset"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset storico
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <p className="history-empty">Nessuna busta paga salvata. Genera una busta per aggiungerla allo storico.</p>
      ) : (
        <ul className="history-list">
          {filteredHistory.map((entry) => (
            <li
              key={entry.id}
              className="history-item"
              onClick={() => setSelectedEntry(entry)}
            >
              <span className="history-item-label">
                {MONTHS[entry.month - 1]} {entry.year}
                {entry.workerName && ` – ${entry.workerName}`}
              </span>
              <span className="history-item-net">{euro(entry.net)}</span>
              <span className="history-item-arrow">›</span>
            </li>
          ))}
        </ul>
      )}

      {selectedEntry && (
        <DetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={handleDelete}
        />
      )}

      {showResetConfirm && (
        <div className="history-modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="history-modal history-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Reset storico</h3>
            <p>Eliminare tutte le {history.length} voci? L'operazione non è reversibile.</p>
            <div className="history-modal-footer">
              <button
                type="button"
                className="history-btn-reset"
                onClick={() => setShowResetConfirm(false)}
              >
                Annulla
              </button>
              <button type="button" className="history-btn-delete" onClick={handleReset}>
                Elimina tutto
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
