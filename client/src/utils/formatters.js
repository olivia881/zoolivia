/**
 * Formattatori per valori monetari e date in italiano
 */

const formatterEuro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(n) {
  if (n == null || isNaN(n)) return '—';
  return formatterEuro.format(n);
}

export function formatEuroShort(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

const MESI_NOMI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export function formatMese(mese, anno) {
  const nomeMese = MESI_NOMI[(mese || 1) - 1] || '';
  return `${nomeMese} ${anno || ''}`.trim();
}

export function formatData(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
