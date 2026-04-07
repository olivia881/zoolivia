/**
 * Persiste anagrafica + parametri contrattuali (non solo il mese).
 * Chiave separata da badante-profile per retrocompatibilità.
 */
const KEY = "badante-workflow-input";

const DEFAULT_INPUT = {
  contractType: "convivente",
  level: "BS",
  weeklyHours: 54,
  hourlyRate: 7.45,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

function normalizeInput(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = { ...DEFAULT_INPUT };
  if (typeof raw.contractType === "string") out.contractType = raw.contractType;
  if (typeof raw.level === "string") out.level = raw.level.toUpperCase();
  const wh = Number(raw.weeklyHours);
  if (Number.isFinite(wh) && wh > 0) out.weeklyHours = wh;
  const hr = Number(raw.hourlyRate);
  if (Number.isFinite(hr) && hr >= 0) out.hourlyRate = hr;
  const m = Number(raw.month);
  if (Number.isInteger(m) && m >= 1 && m <= 12) out.month = m;
  const y = Number(raw.year);
  if (Number.isInteger(y) && y >= 2000 && y <= 2100) out.year = y;
  return out;
}

export function loadWorkflowInput() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return normalizeInput(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveWorkflowInput(input) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        contractType: input.contractType,
        level: input.level,
        weeklyHours: input.weeklyHours,
        hourlyRate: input.hourlyRate,
        month: input.month,
        year: input.year,
      }),
    );
  } catch (e) {
    console.warn("Impossibile salvare parametri contratto:", e);
  }
}

/**
 * Se siamo in un mese/anno calendario diverso da quello salvato, aggiorna mese/anno al mese corrente.
 * (Es: l'utente riapre l'app a febbraio dopo aver lavorato a gennaio.)
 */
export function bumpMonthYearIfNeeded(input) {
  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();
  if (input.year === cy && input.month === cm) return input;
  if (input.year === cy && input.month < cm) {
    return { ...input, month: cm };
  }
  if (input.year < cy) {
    return { ...input, month: cm, year: cy };
  }
  return input;
}
