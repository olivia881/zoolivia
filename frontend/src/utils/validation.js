import { formatStructuredAddress, migrateLegacyProfile } from "../../../shared/profileFields.js";

export function validateProfile(profile) {
  const p = migrateLegacyProfile(profile);
  const errors = {};

  if (!p.employerSurname?.trim()) {
    errors.employerSurname = "Obbligatorio";
  }
  if (!p.employerFirstName?.trim()) {
    errors.employerFirstName = "Obbligatorio";
  }
  if (!p.employerCf?.trim()) {
    errors.employerCf = "Obbligatorio";
  }
  const employerAddr = formatStructuredAddress({
    street: p.employerStreet,
    fraction: p.employerFraction,
    city: p.employerCity,
    province: p.employerProvince,
    cap: p.employerCap,
    legacy: p.employerAddress,
  });
  if (!p.employerStreet?.trim() && !p.employerCity?.trim() && !employerAddr) {
    errors.employerStreet = "Indirizzo obbligatorio";
    errors.employerCity = "Comune obbligatorio";
  } else if (!p.employerCity?.trim() && !employerAddr.includes(",")) {
    errors.employerCity = "Comune obbligatorio";
  }

  if (!p.workerSurname?.trim()) {
    errors.workerSurname = "Obbligatorio";
  }
  if (!p.workerFirstName?.trim()) {
    errors.workerFirstName = "Obbligatorio";
  }
  if (!p.workerCf?.trim()) {
    errors.workerCf = "Obbligatorio";
  }

  return errors;
}

export function validateInput(input) {
  const errors = {};
  const weeklyHours = Number(input.weeklyHours);
  const hourlyRate = Number(input.hourlyRate);

  if (!weeklyHours || weeklyHours <= 0) {
    errors.weeklyHours = "Inserire ore > 0";
  }

  if (input.contractType === "non_convivente" && (!hourlyRate || hourlyRate <= 0)) {
    errors.hourlyRate = "Inserire paga > 0";
  }

  if (!input.month || input.month < 1 || input.month > 12) {
    errors.month = "Mese non valido";
  }

  if (!input.year || input.year < 2000 || input.year > 2100) {
    errors.year = "Anno non valido";
  }

  return errors;
}
