import { migrateLegacyProfile, formatStructuredAddress } from "../../../shared/profileFields.js";

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
  const p = migrateLegacyProfile(profile);
  const errors = {};

  if (!isNotEmpty(p.employerSurname) && !isNotEmpty(p.employerFirstName) && !isNotEmpty(p.employerName)) {
    errors.employerName = "Inserire cognome e nome del datore di lavoro.";
  }

  if (!isNotEmpty(p.employerCf)) {
    errors.employerCf = "Inserire il codice fiscale del datore.";
  }

  const employerAddress = formatStructuredAddress({
    street: p.employerStreet,
    fraction: p.employerFraction,
    city: p.employerCity,
    province: p.employerProvince,
    cap: p.employerCap,
    legacy: p.employerAddress,
  });
  if (!isNotEmpty(employerAddress)) {
    errors.employerAddress = "Inserire l'indirizzo del datore.";
  }

  if (!isNotEmpty(p.workerSurname) && !isNotEmpty(p.workerFirstName) && !isNotEmpty(p.workerName)) {
    errors.workerName = "Inserire cognome e nome della lavoratrice.";
  }

  if (!isNotEmpty(p.workerCf)) {
    errors.workerCf = "Inserire il codice fiscale della lavoratrice.";
  }

  const sanitized = {
    ...p,
    employerName: p.employerName,
    employerCf: normalizeText(p.employerCf).toUpperCase(),
    employerAddress,
    workerName: p.workerName,
    workerCf: normalizeText(p.workerCf).toUpperCase(),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
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
