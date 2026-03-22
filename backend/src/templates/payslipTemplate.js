export const PAYSLIP_TEMPLATE = `
## BUSTA PAGA
Mese di riferimento: {{monthName}} {{year}}
Datore di lavoro: {{employerName}} (CF {{employerTaxCode}})
Lavoratrice: {{employeeName}} (CF {{employeeTaxCode}})
Tipologia contratto: {{contractTypeLabel}} - Livello {{level}}

## RIEPILOGO RETRIBUTIVO
Lordo: {{grossSalary}}
Contributi lavoratrice: {{employeeContributions}}
Contributi datore: {{employerContributions}}
Netto da corrispondere: {{netSalary}}
TFR maturato: {{tfr}}
Quota tredicesima maturata: {{thirteenth}}
Costo totale datore: {{totalCost}}

## NOTA MENSILE
{{monthlySafetyNote}}

## CLAUSOLE OBBLIGATORIE
{{mandatoryClauses}}

## FIRME
Firma datore (solo per netto corrisposto): ______________________
Firma lavoratrice (solo per netto ricevuto): ____________________
`;
