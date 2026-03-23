const CONVIVENTE_BASE_SALARY = {
  BS: 1053,
  CS: 1120,
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
    gross = CONVIVENTE_BASE_SALARY[level] ?? CONVIVENTE_BASE_SALARY.BS;
  } else {
    gross = Number(hourlyRate) * Number(weeklyHours) * WEEK_FACTOR;
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
