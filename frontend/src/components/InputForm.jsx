const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function InputField({ label, name, value, onChange, error, placeholder, type = "text", disabled = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "error" : ""}
      />
      {error && <small>{error}</small>}
    </label>
  );
}

export default function InputForm({
  profile,
  input,
  onProfileChange,
  onInputChange,
  profileErrors,
  inputErrors,
}) {
  return (
    <div className="form-grid">
      <section className="card">
        <h2>Anagrafica Datore</h2>
        <InputField
          label="Nome"
          name="employerName"
          value={profile.employerName}
          onChange={onProfileChange}
          error={profileErrors.employerName}
          placeholder="Mario Rossi"
        />
        <InputField
          label="Codice fiscale"
          name="employerCf"
          value={profile.employerCf}
          onChange={onProfileChange}
          error={profileErrors.employerCf}
          placeholder="RSSMRA..."
        />
        <InputField
          label="Indirizzo"
          name="employerAddress"
          value={profile.employerAddress}
          onChange={onProfileChange}
          error={profileErrors.employerAddress}
          placeholder="Via Roma 1, Milano"
        />
      </section>

      <section className="card">
        <h2>Anagrafica Lavoratrice</h2>
        <InputField
          label="Nome"
          name="workerName"
          value={profile.workerName}
          onChange={onProfileChange}
          error={profileErrors.workerName}
          placeholder="Anna Bianchi"
        />
        <InputField
          label="Codice fiscale"
          name="workerCf"
          value={profile.workerCf}
          onChange={onProfileChange}
          error={profileErrors.workerCf}
          placeholder="BNCNNA..."
        />
      </section>

      <section className="card full-width">
        <h2>Input Mensile</h2>
        <div className="inline-grid">
          <label className="field">
            <span>Tipo contratto</span>
            <select name="contractType" value={input.contractType} onChange={onInputChange}>
              <option value="convivente">Convivente</option>
              <option value="non_convivente">Non convivente</option>
            </select>
          </label>

          <label className="field">
            <span>Livello</span>
            <select name="level" value={input.level} onChange={onInputChange}>
              <option value="BS">BS</option>
              <option value="CS">CS</option>
            </select>
          </label>

          <InputField
            label="Ore settimanali"
            name="weeklyHours"
            value={input.weeklyHours}
            onChange={onInputChange}
            error={inputErrors.weeklyHours}
            type="number"
          />

          <InputField
            label="Paga oraria"
            name="hourlyRate"
            value={input.hourlyRate}
            onChange={onInputChange}
            error={inputErrors.hourlyRate}
            type="number"
            disabled={input.contractType === "convivente"}
          />

          <label className="field">
            <span>Mese</span>
            <select name="month" value={input.month} onChange={onInputChange}>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            {inputErrors.month && <small>{inputErrors.month}</small>}
          </label>

          <InputField
            label="Anno"
            name="year"
            value={input.year}
            onChange={onInputChange}
            error={inputErrors.year}
            type="number"
          />
        </div>
      </section>
    </div>
  );
}
