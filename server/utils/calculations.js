/**
 * Logica di calcolo stipendio badante secondo CCNL Lavoro Domestico
 */

// Stipendi mensili CCNL conviventi (lordo)
const CCNL_STIPENDI = {
  BS: 1053.00, // B Super - badante semplice
  CS: 1120.00, // C Super - badante specializzata
};

// Aliquote INPS semplificate
const INPS_ALIQUOTE = {
  lavoratore: 0.07,  // ~7% a carico della lavoratrice
  datore: 0.16,      // ~16% a carico del datore
};

// Aliquota TFR
const TFR_ALIQUOTA = 0.0741; // 7,41%

// Fattore mensile per ore settimanali (52 settimane / 12 mesi)
const FATTORE_MENSILE = 4.33;

/**
 * Calcola lo stipendio mensile della badante
 * @param {Object} params - Parametri di calcolo
 * @param {string} params.tipoContratto - 'convivente' | 'non_convivente'
 * @param {string} params.livello - 'BS' | 'CS'
 * @param {number} params.oreSettimanali - Ore settimanali (solo non convivente)
 * @param {number} params.pagaOraria - Paga oraria in euro (solo non convivente)
 * @returns {Object} Risultato del calcolo con tutti i valori
 */
function calcolaStipendio({ tipoContratto, livello, oreSettimanali, pagaOraria }) {
  let lordo = 0;

  if (tipoContratto === 'convivente') {
    lordo = CCNL_STIPENDI[livello] || CCNL_STIPENDI.BS;
  } else {
    const ore = parseFloat(oreSettimanali) || 0;
    const paga = parseFloat(pagaOraria) || 0;
    lordo = paga * ore * FATTORE_MENSILE;
  }

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

module.exports = { calcolaStipendio, CCNL_STIPENDI, INPS_ALIQUOTE, TFR_ALIQUOTA };
