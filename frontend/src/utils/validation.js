export function validateProfile(profile) {
  const errors = {};

  if (!profile.employerName?.trim()) {
    errors.employerName = "Obbligatorio";
  }
  if (!profile.employerCf?.trim()) {
    errors.employerCf = "Obbligatorio";
  }
  if (!profile.employerAddress?.trim()) {
    errors.employerAddress = "Obbligatorio";
  }
  if (!profile.workerName?.trim()) {
    errors.workerName = "Obbligatorio";
  }
  if (!profile.workerCf?.trim()) {
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
