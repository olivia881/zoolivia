const STORAGE_KEY = "badante-payroll-history";

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn("Impossibile salvare lo storico:", e);
  }
}

export function getPayrollHistory() {
  return getStoredHistory();
}

export function addToPayrollHistory(entry) {
  const history = getStoredHistory();
  const key = (e) => `${e.month}-${e.year}-${e.workerCf ?? ""}`;
  const entryKey = key(entry);

  const filtered = history.filter((e) => key(e) !== entryKey);
  const withId = { ...entry, id: entry.id ?? Date.now(), createdAt: entry.createdAt ?? Date.now() };
  const updated = [...filtered, withId].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  saveHistory(updated);
  return updated;
}

export function removeFromPayrollHistory(id) {
  const history = getStoredHistory().filter((e) => e.id !== id);
  saveHistory(history);
  return history;
}

export function resetPayrollHistory() {
  saveHistory([]);
  return [];
}
