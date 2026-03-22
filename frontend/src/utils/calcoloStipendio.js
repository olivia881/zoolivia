/**
 * Logica di calcolo stipendio badante lato client.
 * Replica esatta della logica backend per calcolo in tempo reale.
 */

export const STIPENDI_CCNL_CONVIVENTE = {
  BS: 1053.00,
  CS: 1120.00,
};

export const ALIQUOTA_CONTRIBUTI_LAVORATORE = 0.07;
export const ALIQUOTA_CONTRIBUTI_DATORE = 0.16;
export const ALIQUOTA_TFR = 0.0741;
export const DIVISORE_TREDICESIMA = 12;
export const SETTIMANE_MESE = 4.33;

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function calcolaStipendio({
  tipoContratto,
  livello,
  oreSettimanali,
  pagaOraria,
}) {
  let lordo = 0;

  if (tipoContratto === 'convivente') {
    lordo = STIPENDI_CCNL_CONVIVENTE[livello] || 0;
  } else {
    const ore = parseFloat(oreSettimanali) || 0;
    const paga = parseFloat(pagaOraria) || 0;
    lordo = paga * ore * SETTIMANE_MESE;
  }

  lordo = round2(lordo);

  const contributiLavoratore = round2(lordo * ALIQUOTA_CONTRIBUTI_LAVORATORE);
  const contributiDatore = round2(lordo * ALIQUOTA_CONTRIBUTI_DATORE);
  const netto = round2(lordo - contributiLavoratore);
  const tfr = round2(lordo * ALIQUOTA_TFR);
  const tredicesima = round2(lordo / DIVISORE_TREDICESIMA);
  const costoTotale = round2(lordo + contributiDatore + tfr + tredicesima);

  return {
    lordo,
    contributiLavoratore,
    contributiDatore,
    netto,
    tfr,
    tredicesima,
    costoTotale,
  };
}
