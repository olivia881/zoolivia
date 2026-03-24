function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function Row({ label, value, bold = false }) {
  return (
    <div className={`result-row ${bold ? "bold" : ""}`}>
      <span>{label}</span>
      <strong>{euro(value)}</strong>
    </div>
  );
}

export default function ResultsPanel({ calculation }) {
  if (!calculation) {
    return (
      <section className="card">
        <h2>Risultati</h2>
        <p>Compila i dati per vedere i calcoli in tempo reale.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Risultati</h2>
      <div className="results">
        <Row label="Lordo" value={calculation.gross} />
        <Row label="Contributi lavoratrice (~7%)" value={calculation.employeeContributions} />
        <Row label="Contributi datore (~16%)" value={calculation.employerContributions} />
        <Row label="Netto" value={calculation.net} bold />
        <Row label="TFR (7,41%)" value={calculation.tfr} />
        <Row label="Tredicesima mensile" value={calculation.thirteenth} />
        <Row label="Costo totale datore" value={calculation.totalCost} bold />
      </div>
    </section>
  );
}
