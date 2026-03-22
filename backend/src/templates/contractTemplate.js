export const CONTRACT_TEMPLATE = `
## DATI CONTRATTUALI
Datore di lavoro: {{employerName}}
Codice fiscale datore: {{employerTaxCode}}
Indirizzo datore: {{employerAddress}}

Lavoratrice: {{employeeName}}
Codice fiscale lavoratrice: {{employeeTaxCode}}
Tipologia contratto: {{contractTypeLabel}}
Livello CCNL: {{level}}

Decorrenza rapporto: {{monthName}} {{year}}
Ore settimanali: {{weeklyHours}}
Retribuzione lorda mensile: {{grossSalary}}
Contributi INPS datore: {{employerContributions}}
Contributi INPS lavoratrice: {{employeeContributions}}

## CLAUSOLE OBBLIGATORIE
{{mandatoryClauses}}

## FIRME
Firma datore: ______________________
Firma lavoratrice: _________________
`;

export const CLAUSE_TEMPLATE = `
## CLAUSOLA INTEGRATIVA AL CONTRATTO
Tra {{employerName}} (datore) e {{employeeName}} (lavoratrice), riferita al rapporto attivo nel mese di {{monthName}} {{year}}.

Con la presente si conferma che:
{{mandatoryClauses}}

Importo netto di riferimento per il mese: {{netSalary}}

## ACCETTAZIONE
La lavoratrice dichiara di aver compreso e accettato integralmente la presente clausola integrativa.

Firma datore: ______________________
Firma lavoratrice: _________________
`;
