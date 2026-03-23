const CONTRACT_TYPES = new Set(["convivente", "non_convivente"]);
const LEVELS = new Set(["A", "AS", "B", "BS", "C", "CS", "D", "DS"]);

function isNotEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return NaN;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function validateProfile(profile) {
  const errors = {};

  if (!isNotEmpty(profile.employerName)) {
    errors.employerName = "Inserire il nome del datore di lavoro.";
  }

  if (!isNotEmpty(profile.employerCf)) {
    errors.employerCf = "Inserire il codice fiscale del datore.";
  }

  if (!isNotEmpty(profile.employerAddress)) {
    errors.employerAddress = "Inserire l'indirizzo del datore.";
  }

  if (!isNotEmpty(profile.workerName)) {
    errors.workerName = "Inserire il nome della lavoratrice.";
  }

  if (!isNotEmpty(profile.workerCf)) {
    errors.workerCf = "Inserire il codice fiscale della lavoratrice.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      employerName: normalizeText(profile.employerName),
      employerCf: normalizeText(profile.employerCf).toUpperCase(),
      employerAddress: normalizeText(profile.employerAddress),
      workerName: normalizeText(profile.workerName),
      workerCf: normalizeText(profile.workerCf).toUpperCase(),
    },
  };
}

export function validateMonthlyInput(input) {
  const errors = {};

  const contractType = normalizeText(input.contractType);
  const level = normalizeText(input.level).toUpperCase();
  const weeklyHours = normalizeNumber(input.weeklyHours);
  const hourlyRate = normalizeNumber(input.hourlyRate);
  const month = normalizeNumber(input.month);
  const year = normalizeNumber(input.year);

  if (!CONTRACT_TYPES.has(contractType)) {
    errors.contractType = "Tipo contratto non valido.";
  }

  if (!LEVELS.has(level)) {
    errors.level = "Livello non valido (A, AS, B, BS, C, CS, D, DS).";
  }

  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
    errors.weeklyHours = "Le ore settimanali devono essere maggiori di 0.";
  }

  if (contractType === "non_convivente" && (!Number.isFinite(hourlyRate) || hourlyRate <= 0)) {
    errors.hourlyRate = "La paga oraria deve essere maggiore di 0.";
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.month = "Il mese deve essere compreso tra 1 e 12.";
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.year = "L'anno deve essere valido (2000-2100).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      contractType,
      level,
      weeklyHours,
      hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
      month,
      year,
    },
  };
}
