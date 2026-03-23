export const CONTRACT_TEMPLATE = `
## LETTERA DI ASSUNZIONE – LAVORO DOMESTICO

Datore di lavoro: {{employerName}}
Codice fiscale: {{employerCF}}
Indirizzo: {{employerAddress}}

Lavoratrice: {{employeeName}}
Codice fiscale: {{employeeCF}}

Data inizio rapporto: {{startDate}}

## INQUADRAMENTO

La lavoratrice è assunta con livello {{level}} (CCNL lavoro domestico),
con mansioni di assistenza alla persona.

## TIPOLOGIA

Rapporto di lavoro in regime di convivenza.

## ORARIO DI LAVORO

{{weeklyHours}} ore settimanali, con riposo domenicale e mezza giornata settimanale.

## MANSIONI

La lavoratrice svolgerà attività di assistenza alla persona e di supporto domestico non sanitario, in particolare:

- supporto alla mobilità leggera
- aiuto nella vestizione e cura personale di base
- preparazione dei pasti
- compagnia e sorveglianza
- pulizia ordinaria degli ambienti
- lavaggio e gestione della biancheria
- piccole commissioni quotidiane

Attività escluse:

- prestazioni di natura sanitaria o infermieristica
- somministrazione di farmaci invasivi
- movimentazioni complesse o assistenza specialistica

## RETRIBUZIONE

Retribuzione mensile lorda:
{{grossSalary}}

Vitto e alloggio sono forniti dal datore di lavoro.

## ACCANTONAMENTI

Il trattamento di fine rapporto (TFR) matura mensilmente ma verrà liquidato esclusivamente alla cessazione del rapporto di lavoro.

La tredicesima mensilità matura mensilmente ma verrà corrisposta nei termini previsti dalla legge.

Tali importi non sono inclusi nella retribuzione mensile corrisposta.

## MODALITÀ DI PAGAMENTO

Il pagamento avverrà mensilmente. La lavoratrice firmerà ricevuta del solo importo netto mensile percepito.

## DICHIARAZIONE ECONOMICA

La lavoratrice dichiara che la retribuzione pattuita è conforme al CCNL e che, salvo quanto previsto dalla legge, non avanza ulteriori pretese economiche oltre a quanto indicato nel presente contratto.

## RESIDENZA

L'eventuale concessione della residenza presso l'abitazione è esclusivamente collegata al rapporto di lavoro e non costituisce titolo di possesso o diritto di permanenza nell'immobile.

## CESSAZIONE DEL RAPPORTO

In caso di cessazione del rapporto di lavoro, la lavoratrice si impegna a lasciare l'abitazione senza ritardi, con restituzione immediata dei locali.

Verranno liquidate le competenze finali (TFR e spettanze maturate).

## FIRME

Firma datore ______________________________

Firma lavoratrice per ricevuta e accettazione ______________________________
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

Firma lavoratrice: ______________________
`;

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
