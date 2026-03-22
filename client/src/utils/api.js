/**
 * Client API per comunicare con il backend Express
 */

const BASE_URL = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Errore HTTP ${response.status}`);
  }

  return data;
}

// ─── ANAGRAFICA ────────────────────────────────────────────────────────────

export async function getAnagrafica() {
  return fetchJSON(`${BASE_URL}/anagrafica`);
}

export async function aggiornaDatore(datore) {
  return fetchJSON(`${BASE_URL}/anagrafica/datore`, {
    method: 'PUT',
    body: JSON.stringify(datore),
  });
}

export async function aggiornaLavoratrice(lavoratrice) {
  return fetchJSON(`${BASE_URL}/anagrafica/lavoratrice`, {
    method: 'PUT',
    body: JSON.stringify(lavoratrice),
  });
}

// ─── BUSTE PAGA ────────────────────────────────────────────────────────────

export async function getBuste() {
  return fetchJSON(`${BASE_URL}/buste`);
}

export async function generaBusta(dati) {
  return fetchJSON(`${BASE_URL}/buste/genera`, {
    method: 'POST',
    body: JSON.stringify(dati),
  });
}

export async function eliminaBusta(id) {
  return fetchJSON(`${BASE_URL}/buste/${id}`, {
    method: 'DELETE',
  });
}

export function getDownloadUrl(id) {
  return `${BASE_URL}/buste/${id}/download`;
}
