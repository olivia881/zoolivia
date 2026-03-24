/**
 * CCNL Lavoro Domestico - Minimi retributivi 2026
 * Fonte: tabelle ufficiali CCNL (decorrenza 01-01-2026)
 */
const CONVIVENTE_MONTHLY = {
  A: 908.1,
  AS: 958.55,
  B: 983.16,
  BS: 1053.39,
  C: 1123.63,
  CS: 1193.84,
  D: 1612.2,
  DS: 1682.42,
};

const NON_CONVIVENTE_HOURLY = {
  A: 6.51,
  AS: 6.76,
  B: 7.01,
  BS: 7.45,
  C: 7.86,
  CS: 8.3,
  D: 9.57,
  DS: 9.97,
};

const EMPLOYEE_CONTRIBUTION_RATE = 0.07;
const EMPLOYER_CONTRIBUTION_RATE = 0.16;
const TFR_RATE = 0.0741;
const WEEK_FACTOR = 4.33;

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

export function calculatePayroll(input) {
  const { contractType, level, weeklyHours, hourlyRate } = input;

  let gross = 0;
  if (contractType === "convivente") {
    gross = CONVIVENTE_MONTHLY[level] ?? CONVIVENTE_MONTHLY.BS;
  } else {
    const rate = Number(hourlyRate) || (NON_CONVIVENTE_HOURLY[level] ?? NON_CONVIVENTE_HOURLY.BS);
    gross = rate * Number(weeklyHours) * WEEK_FACTOR;
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
    rates: {
      employeeRate: EMPLOYEE_CONTRIBUTION_RATE,
      employerRate: EMPLOYER_CONTRIBUTION_RATE,
      tfrRate: TFR_RATE,
    },
  };
}

export function getLevels() {
  return Object.keys(CONVIVENTE_MONTHLY);
}

export function getConviventeMinimum(level) {
  return CONVIVENTE_MONTHLY[level] ?? CONVIVENTE_MONTHLY.BS;
}

export function getNonConviventeHourlyMinimum(level) {
  return NON_CONVIVENTE_HOURLY[level] ?? NON_CONVIVENTE_HOURLY.BS;
}
