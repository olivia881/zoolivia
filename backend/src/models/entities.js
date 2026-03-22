const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function euro(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}

function contractLabel(type) {
  return type === "convivente" ? "Convivente" : "Non convivente";
}

export function buildEmployer(profile) {
  return {
    name: profile.employerName,
    taxCode: profile.employerCf,
    address: profile.employerAddress,
  };
}

export function buildEmployee(profile, input) {
  return {
    name: profile.workerName,
    taxCode: profile.workerCf,
    contractType: input.contractType,
    contractTypeLabel: contractLabel(input.contractType),
    level: input.level,
    weeklyHours: input.weeklyHours,
  };
}

export function buildPayroll(input, calculation) {
  return {
    month: input.month,
    monthName: MONTH_NAMES[input.month - 1],
    year: input.year,
    grossSalary: calculation.gross,
    netSalary: calculation.net,
    employerContributions: calculation.employerContributions,
    employeeContributions: calculation.employeeContributions,
    tfr: calculation.tfr,
    thirteenth: calculation.thirteenth,
    totalCost: calculation.totalCost,
  };
}

export function buildDocumentData({ profile, input, calculation }) {
  const employer = buildEmployer(profile);
  const employee = buildEmployee(profile, input);
  const payroll = buildPayroll(input, calculation);

  const mandatoryClauses = [
    "- TFR non pagato mensilmente, ma accantonato secondo normativa.",
    "- Tredicesima non inclusa nel netto mensile.",
    "- La firma e valida esclusivamente per l'importo netto corrisposto.",
    "- L'eventuale residenza presso il datore non crea diritto abitativo.",
  ].join("\n");

  return {
    employer,
    employee,
    payroll,
    placeholders: {
      employerName: employer.name,
      employerTaxCode: employer.taxCode,
      employerAddress: employer.address,
      employeeName: employee.name,
      employeeTaxCode: employee.taxCode,
      contractType: employee.contractType,
      contractTypeLabel: employee.contractTypeLabel,
      level: employee.level,
      weeklyHours: String(employee.weeklyHours),
      month: String(payroll.month),
      monthName: payroll.monthName,
      year: String(payroll.year),
      grossSalary: euro(payroll.grossSalary),
      netSalary: euro(payroll.netSalary),
      employerContributions: euro(payroll.employerContributions),
      employeeContributions: euro(payroll.employeeContributions),
      tfr: euro(payroll.tfr),
      thirteenth: euro(payroll.thirteenth),
      totalCost: euro(payroll.totalCost),
      monthlySafetyNote: "TFR e tredicesima non sono corrisposti nel mese.",
      mandatoryClauses,
    },
  };
}
