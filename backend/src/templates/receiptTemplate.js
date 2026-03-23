export const RECEIPT_TEMPLATE = `
## RICEVUTA DI PAGAMENTO

Il/La sottoscritto/a {{employeeName}} (CF {{employeeCF}}) dichiara di aver ricevuto da {{employerName}} (CF {{employerCF}}):

Importo netto corrisposto per {{monthName}} {{year}}: {{netSalary}}

Riepilogo mese:
- Lordo: {{grossSalary}}
- Contributi lavoratrice: {{employeeContributions}}
- TFR maturato (accantonato, liquidazione alla cessazione): {{tfr}}
- Quota tredicesima maturata (accantonata, pagamento nei termini di legge): {{thirteenth}}

## CLAUSOLE

{{mandatoryClauses}}

## VALIDITÀ DELLA RICEVUTA

La presente ricevuta costituisce prova esclusiva dell'incasso del solo importo netto mensile percepito.

Firma datore: ______________________

Firma lavoratrice per ricevuta e accettazione: ______________________
`;
