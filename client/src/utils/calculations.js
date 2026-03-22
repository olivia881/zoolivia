/**
 * Logica di calcolo stipendio - versione client (specchio del backend)
 */

export const CCNL_STIPENDI = {
  BS: 1053.00,
  CS: 1120.00,
};

export const INPS_ALIQUOTE = {
  lavoratore: 0.07,
  datore: 0.16,
};

export const TFR_ALIQUOTA = 0.0741;
export const FATTORE_MENSILE = 4.33;

export const MESI_NOMI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export const LIVELLI = [
  { valore: 'BS', etichetta: 'B Super (BS)', descrizione: `~€${CCNL_STIPENDI.BS.toLocaleString('it-IT')}/mese` },
  { valore: 'CS', etichetta: 'C Super (CS)', descrizione: `~€${CCNL_STIPENDI.CS.toLocaleString('it-IT')}/mese` },
];

/**
 * Calcola lo stipendio mensile della badante in tempo reale (frontend)
 */
export function calcolaStipendio({ tipoContratto, livello, oreSettimanali, pagaOraria }) {
  let lordo = 0;

  if (tipoContratto === 'convivente') {
    lordo = CCNL_STIPENDI[livello] || CCNL_STIPENDI.BS;
  } else {
    const ore = parseFloat(oreSettimanali) || 0;
    const paga = parseFloat(pagaOraria) || 0;
    lordo = paga * ore * FATTORE_MENSILE;
  }

  if (lordo <= 0) return null;

  const contributiLavoratore = lordo * INPS_ALIQUOTE.lavoratore;
  const contributiDatore = lordo * INPS_ALIQUOTE.datore;
  const netto = lordo - contributiLavoratore;
  const tfr = lordo * TFR_ALIQUOTA;
  const tredicesima = lordo / 12;
  const costoTotale = lordo + contributiDatore + tfr + tredicesima;

  return {
    lordo: arrotonda(lordo),
    contributiLavoratore: arrotonda(contributiLavoratore),
    contributiDatore: arrotonda(contributiDatore),
    netto: arrotonda(netto),
    tfr: arrotonda(tfr),
    tredicesima: arrotonda(tredicesima),
    costoTotale: arrotonda(costoTotale),
  };
}

function arrotonda(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Valida i campi del form
 */
export function validaForm(form) {
  const errori = {};

  if (!form.tipoContratto) errori.tipoContratto = 'Seleziona il tipo di contratto';
  if (!form.livello) errori.livello = 'Seleziona il livello';
  if (!form.mese || form.mese < 1 || form.mese > 12) errori.mese = 'Seleziona un mese valido';
  if (!form.anno || form.anno < 2000) errori.anno = 'Anno non valido';

  if (form.tipoContratto === 'non_convivente') {
    if (!form.oreSettimanali || parseFloat(form.oreSettimanali) <= 0) {
      errori.oreSettimanali = 'Inserisci le ore settimanali';
    }
    if (!form.pagaOraria || parseFloat(form.pagaOraria) <= 0) {
      errori.pagaOraria = 'Inserisci la paga oraria';
    }
  }

  return errori;
}
