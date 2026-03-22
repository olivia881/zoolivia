/**
 * Logica di calcolo stipendio badante secondo CCNL lavoro domestico.
 *
 * Supporta contratti conviventi (stipendio fisso CCNL) e
 * non conviventi (paga oraria × ore settimanali × 4.33).
 */

const STIPENDI_CCNL_CONVIVENTE = {
  BS: 1053.00,
  CS: 1120.00,
};

const ALIQUOTA_CONTRIBUTI_LAVORATORE = 0.07;
const ALIQUOTA_CONTRIBUTI_DATORE = 0.16;
const ALIQUOTA_TFR = 0.0741;
const DIVISORE_TREDICESIMA = 12;
const SETTIMANE_MESE = 4.33;

function calcolaStipendio({
  tipoContratto,
  livello,
  oreSettimanali,
  pagaOraria,
  mese,
  anno,
}) {
  let lordo;

  if (tipoContratto === 'convivente') {
    lordo = STIPENDI_CCNL_CONVIVENTE[livello];
    if (!lordo) {
      throw new Error(`Livello ${livello} non supportato per convivente`);
    }
  } else {
    if (!pagaOraria || pagaOraria <= 0) {
      throw new Error('Paga oraria obbligatoria per non convivente');
    }
    if (!oreSettimanali || oreSettimanali <= 0) {
      throw new Error('Ore settimanali obbligatorie');
    }
    lordo = pagaOraria * oreSettimanali * SETTIMANE_MESE;
  }

  lordo = round2(lordo);

  const contributiLavoratore = round2(lordo * ALIQUOTA_CONTRIBUTI_LAVORATORE);
  const contributiDatore = round2(lordo * ALIQUOTA_CONTRIBUTI_DATORE);
  const netto = round2(lordo - contributiLavoratore);
  const tfr = round2(lordo * ALIQUOTA_TFR);
  const tredicesima = round2(lordo / DIVISORE_TREDICESIMA);
  const costoTotale = round2(lordo + contributiDatore + tfr + tredicesima);

  return {
    tipoContratto,
    livello,
    oreSettimanali: Number(oreSettimanali) || 0,
    pagaOraria: Number(pagaOraria) || 0,
    mese: Number(mese),
    anno: Number(anno),
    lordo,
    contributiLavoratore,
    contributiDatore,
    netto,
    tfr,
    tredicesima,
    costoTotale,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  calcolaStipendio,
  STIPENDI_CCNL_CONVIVENTE,
  ALIQUOTA_CONTRIBUTI_LAVORATORE,
  ALIQUOTA_CONTRIBUTI_DATORE,
  ALIQUOTA_TFR,
};
