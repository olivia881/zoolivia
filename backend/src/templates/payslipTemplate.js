export function generatePayslipHTML(data) {
  return `
    <h1>BUSTA PAGA - ${data.month} ${data.year}</h1>

    <h3>Dati</h3>
    <p>Datore: ${data.employer.name}</p>
    <p>Lavoratrice: ${data.employee.name}</p>

    <h3>Retribuzione</h3>
    <p>Lordo: EUR ${data.grossSalary}</p>
    <p>Netto: EUR ${data.netSalary}</p>

    <h3>Accantonamenti</h3>
    <p>TFR: EUR ${data.tfr}</p>
    <p>Tredicesima: EUR ${data.thirteenth}</p>

    <hr/>

    <p><strong>NOTE:</strong></p>
    <p>
    Gli importi relativi a TFR e tredicesima sono accantonati e non corrisposti nel mese.
    </p>

    <p>
    Il lavoratore dichiara di aver ricevuto esclusivamente il netto mensile.
    </p>
  `;
}
