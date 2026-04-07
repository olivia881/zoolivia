import { useState } from "react";

export default function ContractSwitcher({
  contracts,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const active = contracts.find((c) => c.id === activeId);

  function startRename() {
    if (!active) return;
    setNameDraft(active.name);
    setRenaming(true);
  }

  function submitRename() {
    if (activeId && nameDraft.trim()) onRename(activeId, nameDraft.trim());
    setRenaming(false);
  }

  return (
    <div className="contract-switcher card">
      <h2>Contratto attivo</h2>
      <p className="contract-switcher-hint">
        Puoi salvare più rapporti (più badanti o più datori). Scegli il contratto da usare per buste e documenti.
      </p>
      <div className="contract-switcher-row">
        <label className="field contract-switcher-select">
          <span>Contratto</span>
          <select
            value={activeId ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Seleziona contratto"
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="contract-switcher-actions">
          <button type="button" className="contract-btn secondary" onClick={onNew}>
            Nuovo contratto
          </button>
          {contracts.length > 1 && (
            <button
              type="button"
              className="contract-btn danger"
              onClick={() => onDelete(activeId)}
            >
              Elimina
            </button>
          )}
        </div>
      </div>
      {active && (
        <div className="contract-rename">
          {renaming ? (
            <>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="contract-rename-input"
                placeholder="Nome contratto"
              />
              <button type="button" className="contract-btn" onClick={submitRename}>
                OK
              </button>
              <button type="button" className="contract-btn secondary" onClick={() => setRenaming(false)}>
                Annulla
              </button>
            </>
          ) : (
            <button type="button" className="contract-link" onClick={startRename}>
              Rinomina contratto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
