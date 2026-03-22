export const RECEIPT_TEMPLATE = `
## RICEVUTA DI PAGAMENTO
Il/La sottoscritto/a {{employeeName}} (CF {{employeeTaxCode}}) dichiara di aver ricevuto da {{employerName}} (CF {{employerTaxCode}}):

Importo netto corrisposto per {{monthName}} {{year}}: {{netSalary}}

Riepilogo mese:
- Lordo: {{grossSalary}}
- Contributi lavoratrice: {{employeeContributions}}
- TFR maturato: {{tfr}}
- Quota tredicesima maturata: {{thirteenth}}

## CLAUSOLE OBBLIGATORIE
{{mandatoryClauses}}

## VALIDITA DELLA RICEVUTA
La presente ricevuta costituisce prova esclusiva dell'incasso del solo netto mensile indicato.

Firma datore: ______________________
Firma lavoratrice: _________________
`;
