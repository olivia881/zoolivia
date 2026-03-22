import { CONTRACT_TYPES, LEVELS, MONTH_OPTIONS } from '@shared/payslipCalculator.js'

function Field({ label, error, children, hint }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

function InputForm({ formData, errors, onChange, onSave, isSaving }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Gestione anagrafica</p>
          <h2>Dati datore e lavoratrice</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Salvataggio...' : 'Salva dati'}
        </button>
      </div>

      <div className="form-grid">
        <Field label="Datore di lavoro" error={errors.employerName}>
          <input
            value={formData.employerName}
            onChange={(event) => onChange('employerName', event.target.value)}
            placeholder="Nome e cognome"
          />
        </Field>

        <Field label="CF datore" error={errors.employerTaxCode}>
          <input
            value={formData.employerTaxCode}
            onChange={(event) => onChange('employerTaxCode', event.target.value)}
            placeholder="RSSMRA80A01H501U"
          />
        </Field>

        <Field label="Indirizzo datore" error={errors.employerAddress}>
          <input
            value={formData.employerAddress}
            onChange={(event) => onChange('employerAddress', event.target.value)}
            placeholder="Via e citta"
          />
        </Field>

        <Field label="Lavoratrice" error={errors.workerName}>
          <input
            value={formData.workerName}
            onChange={(event) => onChange('workerName', event.target.value)}
            placeholder="Nome e cognome"
          />
        </Field>

        <Field label="CF lavoratrice" error={errors.workerTaxCode}>
          <input
            value={formData.workerTaxCode}
            onChange={(event) => onChange('workerTaxCode', event.target.value)}
            placeholder="PPCNNA85B41Z129K"
          />
        </Field>
      </div>

      <div className="section-divider" />

      <div className="panel__header panel__header--compact">
        <div>
          <p className="eyebrow">Input mensile</p>
          <h2>Contratto, ore e periodo</h2>
        </div>
      </div>

      <div className="form-grid">
        <Field label="Tipo contratto" error={errors.contractType}>
          <select
            value={formData.contractType}
            onChange={(event) => onChange('contractType', event.target.value)}
          >
            {CONTRACT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Livello" error={errors.level}>
          <select value={formData.level} onChange={(event) => onChange('level', event.target.value)}>
            {LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ore settimanali" error={errors.weeklyHours}>
          <input
            type="number"
            min="1"
            max="60"
            step="0.5"
            value={formData.weeklyHours}
            onChange={(event) => onChange('weeklyHours', event.target.value)}
          />
        </Field>

        <Field
          label="Paga oraria"
          error={errors.hourlyRate}
          hint={formData.contractType === 'convivente' ? 'Per il convivente si usa lo stipendio fisso CCNL.' : null}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.hourlyRate}
            disabled={formData.contractType === 'convivente'}
            onChange={(event) => onChange('hourlyRate', event.target.value)}
          />
        </Field>

        <Field label="Mese" error={errors.month}>
          <select value={formData.month} onChange={(event) => onChange('month', event.target.value)}>
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Anno" error={errors.year}>
          <input
            type="number"
            min="2020"
            max="2100"
            value={formData.year}
            onChange={(event) => onChange('year', event.target.value)}
          />
        </Field>
      </div>
    </section>
  )
}

export default InputForm
