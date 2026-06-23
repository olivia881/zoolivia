function Field({ label, name, value, onChange, error, type = "text", placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? "error" : ""}
      />
      {error && <small>{error}</small>}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value ?? ""} onChange={onChange}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const GENDER_OPTIONS = [
  { value: "", label: "—" },
  { value: "M", label: "M" },
  { value: "F", label: "F" },
];

export default function PersonAnagraficaSection({
  title,
  prefix,
  profile,
  onChange,
  errors = {},
  showSpouse = false,
  showPermit = false,
  requiredCf = true,
}) {
  const p = (field) => `${prefix}${field}`;
  const v = (field) => profile[p(field)] ?? "";
  const err = (field) => errors[p(field)];

  return (
    <section className="card">
      <h2>{title}</h2>

      <h3 className="inps-subsection-title">Generalità</h3>
      <div className="inps-grid inps-grid--3">
        <Field label="Cognome *" name={p("Surname")} value={v("Surname")} onChange={onChange} error={err("Surname")} />
        <Field label="Nome *" name={p("FirstName")} value={v("FirstName")} onChange={onChange} error={err("FirstName")} />
        <Field
          label={requiredCf ? "Codice fiscale *" : "Codice fiscale"}
          name={p("Cf")}
          value={v("Cf")}
          onChange={onChange}
          error={err("Cf")}
          placeholder="RSSMRA..."
        />
      </div>
      <div className="inps-grid inps-grid--3">
        {showSpouse && (
          <Field label="Cognome coniuge" name={p("SpouseSurname")} value={v("SpouseSurname")} onChange={onChange} />
        )}
        <Field label="Professione" name={p("Profession")} value={v("Profession")} onChange={onChange} />
        <Field label="Cittadinanza" name={p("Citizenship")} value={v("Citizenship")} onChange={onChange} />
        <SelectField label="Sesso" name={p("Gender")} value={v("Gender")} onChange={onChange} options={GENDER_OPTIONS} />
      </div>
      <div className="inps-grid inps-grid--3">
        <Field label="Luogo di nascita" name={p("BirthPlace")} value={v("BirthPlace")} onChange={onChange} />
        <Field label="Prov. nascita" name={p("BirthProvince")} value={v("BirthProvince")} onChange={onChange} />
        <Field label="Data di nascita" name={p("BirthDate")} value={v("BirthDate")} onChange={onChange} type="date" />
      </div>

      <h3 className="inps-subsection-title">Indirizzo</h3>
      <div className="inps-grid inps-grid--2">
        <Field label="Indirizzo *" name={p("Street")} value={v("Street")} onChange={onChange} error={err("Street")} placeholder="Via Roma 1" />
        <Field label="Frazione" name={p("Fraction")} value={v("Fraction")} onChange={onChange} />
      </div>
      <div className="inps-grid inps-grid--3">
        <Field label="Comune *" name={p("City")} value={v("City")} onChange={onChange} error={err("City")} />
        <Field label="Provincia" name={p("Province")} value={v("Province")} onChange={onChange} placeholder="MI" />
        <Field label="CAP" name={p("Cap")} value={v("Cap")} onChange={onChange} />
      </div>

      <h3 className="inps-subsection-title">Documento di identità</h3>
      <div className="inps-grid inps-grid--3">
        <Field label="Tipo documento" name={p("IdDocType")} value={v("IdDocType")} onChange={onChange} placeholder="Carta identità" />
        <Field label="Numero" name={p("IdDocNumber")} value={v("IdDocNumber")} onChange={onChange} />
        <Field label="Scadenza" name={p("IdDocExpiry")} value={v("IdDocExpiry")} onChange={onChange} type="date" />
      </div>

      {showPermit && (
        <>
          <h3 className="inps-subsection-title">Titolo di soggiorno (se applicabile)</h3>
          <div className="inps-grid inps-grid--3">
            <Field label="Tipo permesso" name={p("PermitType")} value={v("PermitType")} onChange={onChange} />
            <Field label="Data richiesta" name={p("PermitRequestDate")} value={v("PermitRequestDate")} onChange={onChange} type="date" />
            <Field label="Motivo" name={p("PermitReason")} value={v("PermitReason")} onChange={onChange} />
          </div>
          <div className="inps-grid inps-grid--3">
            <Field label="Numero" name={p("PermitNumber")} value={v("PermitNumber")} onChange={onChange} />
            <Field label="Scadenza" name={p("PermitExpiry")} value={v("PermitExpiry")} onChange={onChange} type="date" />
            <Field label="Questura" name={p("PermitPoliceHQ")} value={v("PermitPoliceHQ")} onChange={onChange} />
          </div>
        </>
      )}
    </section>
  );
}
