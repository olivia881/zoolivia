/**
 * CCNL Lavoro Domestico - Minimi retributivi 2025
 * Fonte: tabelle ufficiali CCNL
 */
const CONVIVENTE_MONTHLY = {
  A: 736.25,
  AS: 870.13,
  B: 937.06,
  BS: 1003.99,
  C: 1070.94,
  CS: 1137.86,
  D: 1536.6,
  DS: 1603.53,
};

const NON_CONVIVENTE_HOURLY = {
  A: 5.35,
  AS: 6.3,
  B: 6.68,
  BS: 7.1,
  C: 7.49,
  CS: 7.91,
  D: 9.12,
  DS: 9.5,
};

const EMPLOYEE_CONTRIBUTION_RATE = 0.07;
const EMPLOYER_CONTRIBUTION_RATE = 0.16;
const TFR_RATE = 0.0741;
const WEEK_FACTOR = 4.33;

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

export function calculatePayroll(input) {
  const isConvivente = input.contractType === "convivente";
  let gross;
  if (isConvivente) {
    gross = CONVIVENTE_MONTHLY[input.level] ?? CONVIVENTE_MONTHLY.BS;
  } else {
    const rate = Number(input.hourlyRate) || (NON_CONVIVENTE_HOURLY[input.level] ?? NON_CONVIVENTE_HOURLY.BS);
    gross = rate * Number(input.weeklyHours || 0) * WEEK_FACTOR;
  }

  const employeeContributions = gross * EMPLOYEE_CONTRIBUTION_RATE;
  const employerContributions = gross * EMPLOYER_CONTRIBUTION_RATE;
  const net = gross - employeeContributions;
  const tfr = gross * TFR_RATE;
  const thirteenth = gross / 12;
  const totalCost = gross + employerContributions + tfr + thirteenth;

  return {
    gross: roundCurrency(gross),
    employeeContributions: roundCurrency(employeeContributions),
    employerContributions: roundCurrency(employerContributions),
    net: roundCurrency(net),
    tfr: roundCurrency(tfr),
    thirteenth: roundCurrency(thirteenth),
    totalCost: roundCurrency(totalCost),
  };
}

export function getNonConviventeHourlyMinimum(level) {
  return NON_CONVIVENTE_HOURLY[level] ?? NON_CONVIVENTE_HOURLY.BS;
}
