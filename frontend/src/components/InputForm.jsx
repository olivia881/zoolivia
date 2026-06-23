import { LEVEL_ORDER, LEVEL_LABELS } from "../utils/levelLabels";
import { getNonConviventeHourlyMinimum } from "../utils/payrollCalculator";
import { YES_NO_OPTIONS } from "../../../shared/profileFields.js";
import PersonAnagraficaSection from "./PersonAnagraficaSection";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function InputField({ label, name, value, onChange, error, placeholder, type = "text", disabled = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "error" : ""}
      />
      {error && <small>{error}</small>}
    </label>
  );
}

function YesNoField({ label, name, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value ?? ""} onChange={onChange}>
        {YES_NO_OPTIONS.map((o) => (
          <option key={o.value || "empty"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
      <PersonAnagraficaSection
        title="Datore di lavoro"
        prefix="employer"
        profile={profile}
        onChange={onProfileChange}
        errors={profileErrors}
      />

      <PersonAnagraficaSection
        title="Lavoratrice"
        prefix="worker"
        profile={profile}
        onChange={onProfileChange}
        errors={profileErrors}
        showSpouse
        showPermit
      />

      <section className="card full-width">
        <h2>Dati contratto e questionario</h2>
        <p className="form-persist-hint">
          Schema allineato alla denuncia INPS: compila i campi utili al rapporto; nel PDF contratto appariranno in
          schede come nel modulo ufficiale.
        </p>
        <div className="input-monthly-groups">
          <div className="input-group">
            <h3 className="input-group-title">Rapporto di lavoro</h3>
            <div className="input-row input-row--cols-3">
              <label className="field">
                <span>Tipo contratto</span>
                <select
                  name="contractType"
                  value={input.contractType}
                  onChange={(e) => {
                    onInputChange(e);
                    if (e.target.value === "non_convivente") {
                      onInputChange({
                        target: {
                          name: "hourlyRate",
                          value: String(getNonConviventeHourlyMinimum(input.level)),
                        },
                      });
                      onInputChange({ target: { name: "qBoardLodging", value: "NO" } });
                      onInputChange({ target: { name: "qCohabitation", value: "NO" } });
                    } else {
                      onInputChange({ target: { name: "qBoardLodging", value: "SI" } });
                      onInputChange({ target: { name: "qCohabitation", value: "SI" } });
                    }
                  }}
                >
                  <option value="convivente">Convivente</option>
                  <option value="non_convivente">Non convivente</option>
                </select>
              </label>

              <label className="field">
                <span>Livello CCNL</span>
                <select
                  name="level"
                  value={input.level}
                  onChange={(e) => {
                    const newLevel = e.target.value;
                    onInputChange(e);
                    if (input.contractType === "non_convivente") {
                      onInputChange({
                        target: {
                          name: "hourlyRate",
                          value: String(getNonConviventeHourlyMinimum(newLevel)),
                        },
                      });
                    }
                  }}
                >
                  {LEVEL_ORDER.map((lv) => (
                    <option key={lv} value={lv}>
                      {LEVEL_LABELS[lv]}
                    </option>
                  ))}
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
            </div>
            <div className="input-row input-row--cols-3">
              <InputField
                label="Data assunzione"
                name="startDate"
                value={input.startDate}
                onChange={onInputChange}
                type="date"
              />
              <InputField
                label="Data fine rapporto"
                name="endDate"
                value={input.endDate}
                onChange={onInputChange}
                type="date"
              />
              <InputField
                label="In sostituzione di"
                name="replacementOf"
                value={input.replacementOf}
                onChange={onInputChange}
                placeholder="Nome lavoratrice sostituita"
              />
            </div>
          </div>

          <div className="input-group">
            <h3 className="input-group-title">Questionario (come da denuncia INPS)</h3>
            <div className="inps-grid inps-grid--2">
              <YesNoField
                label="Servizio continuativo con vitto e alloggio"
                name="qBoardLodging"
                value={input.qBoardLodging}
                onChange={onInputChange}
              />
              <YesNoField
                label="Il datore è il coniuge della lavoratrice?"
                name="qEmployerSpouse"
                value={input.qEmployerSpouse}
                onChange={onInputChange}
              />
              <YesNoField
                label="Parentela o affinità entro il 3° grado?"
                name="qKinship"
                value={input.qKinship}
                onChange={onInputChange}
              />
              <YesNoField
                label="Convivenza tra datore e lavoratrice?"
                name="qCohabitation"
                value={input.qCohabitation}
                onChange={onInputChange}
              />
              <YesNoField
                label="Datore invalido di guerra, disabile o cieco?"
                name="qWarInvalid"
                value={input.qWarInvalid}
                onChange={onInputChange}
              />
              <YesNoField
                label="Datore prete secolare cattolico?"
                name="qSecularPriest"
                value={input.qSecularPriest}
                onChange={onInputChange}
              />
            </div>
            {input.qKinship === "SI" && (
              <div className="input-row input-row--single">
                <InputField
                  label="Specificare parentela o affinità"
                  name="qKinshipDetail"
                  value={input.qKinshipDetail}
                  onChange={onInputChange}
                />
              </div>
            )}
          </div>

          <div className="input-group">
            <h3 className="input-group-title">Retribuzione</h3>
            <div className="input-row input-row--single">
              <InputField
                label="Paga oraria (min. CCNL)"
                name="hourlyRate"
                value={input.hourlyRate}
                onChange={onInputChange}
                error={inputErrors.hourlyRate}
                type="number"
                disabled={input.contractType === "convivente"}
                placeholder={
                  input.contractType === "non_convivente"
                    ? getNonConviventeHourlyMinimum(input.level).toString()
                    : ""
                }
              />
            </div>
            {input.contractType === "convivente" && (
              <p className="input-group-note">Stipendio mensile minimo CCNL (convivente): non serve paga oraria.</p>
            )}
          </div>

          <div className="input-group">
            <h3 className="input-group-title">Periodo di riferimento (busta paga)</h3>
            <div className="input-row input-row--cols-2">
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
          </div>
        </div>
      </section>
    </div>
  );
}
