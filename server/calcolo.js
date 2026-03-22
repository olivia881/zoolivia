/**
 * Logica di calcolo stipendio badante
 * CCNL Lavoro Domestico - Convivenza e non convivenza
 */

// Stipendi fissi CCNL per conviventi (livelli BS e CS)
// Valori indicativi - aggiornare secondo CCNL vigente
const STIPENDI_CONVIVENTE = {
  BS: 1003.99,  // Livello BS - circa 1004€ (2025)
  CS: 1137.86   // Livello CS - circa 1138€ (2025)
};

// Aliquote INPS semplificate
const ALIQUOTA_LAVORATORE = 0.07;   // ~7% a carico lavoratore
const ALIQUOTA_DATORE = 0.16;       // ~16% a carico datore
const ALIQUOTA_TFR = 0.0741;        // 7.41% TFR

/**
 * Calcola lo stipendio e tutti i componenti per la busta paga
 * @param {Object} input - Dati di input
 * @param {string} input.tipoContratto - 'convivente' | 'non_convivente'
 * @param {string} input.livello - 'BS' | 'CS'
 * @param {number} input.oreSettimanali - ore lavorate a settimana
 * @param {number} input.pagaOraria - paga oraria (solo non convivente)
 * @param {number} input.mese - 1-12
 * @param {number} input.anno - anno
 * @returns {Object} Riepilogo calcolo
 */
export function calcolaStipendio(input) {
  const {
    tipoContratto = 'non_convivente',
    livello = 'BS',
    oreSettimanali = 0,
    pagaOraria = 0,
    mese = new Date().getMonth() + 1,
    anno = new Date().getFullYear()
  } = input;

  // Validazione
  if (!['convivente', 'non_convivente'].includes(tipoContratto)) {
    throw new Error('Tipo contratto non valido');
  }
  if (!['BS', 'CS'].includes(livello)) {
    throw new Error('Livello non valido (BS o CS)');
  }

  let lordo;

  if (tipoContratto === 'convivente') {
    // Stipendio fisso CCNL
    lordo = STIPENDI_CONVIVENTE[livello] || STIPENDI_CONVIVENTE.BS;
  } else {
    // Non convivente: stipendio = paga_oraria × ore_settimanali × 4.33
    if (!oreSettimanali || !pagaOraria) {
      throw new Error('Per contratto non convivente servono ore settimanali e paga oraria');
    }
    lordo = Math.round(pagaOraria * oreSettimanali * 4.33 * 100) / 100;
  }

  // Contributi
  const contributiLavoratore = Math.round(lordo * ALIQUOTA_LAVORATORE * 100) / 100;
  const contributiDatore = Math.round(lordo * ALIQUOTA_DATORE * 100) / 100;

  // Netto = lordo - contributi lavoratore
  const netto = Math.round((lordo - contributiLavoratore) * 100) / 100;

  // TFR = lordo × 7.41%
  const tfr = Math.round(lordo * ALIQUOTA_TFR * 100) / 100;

  // Tredicesima = lordo / 12
  const tredicesima = Math.round((lordo / 12) * 100) / 100;

  // Costo totale per il datore
  const costoTotale = Math.round((lordo + contributiDatore + tfr + tredicesima) * 100) / 100;

  const nomiMese = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  return {
    input: { tipoContratto, livello, oreSettimanali, pagaOraria, mese, anno },
    lordo,
    contributiLavoratore,
    contributiDatore,
    netto,
    tfr,
    tredicesima,
    costoTotale,
    meseLabel: nomiMese[mese - 1],
    anno
  };
}
