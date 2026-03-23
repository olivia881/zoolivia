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
    hourlyRate: input.hourlyRate,
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
    "- Il trattamento di fine rapporto (TFR) matura mensilmente ma verrà liquidato esclusivamente alla cessazione del rapporto di lavoro.",
    "- La tredicesima mensilità matura mensilmente ma verrà corrisposta nei termini previsti dalla legge.",
    "- Tali importi non sono inclusi nella retribuzione mensile corrisposta.",
    "- La lavoratrice firma ricevuta del solo importo netto mensile percepito.",
    "- L'eventuale residenza presso il datore non costituisce titolo di possesso o diritto di permanenza nell'immobile.",
  ].join("\n");

  const startDate = `1 ${payroll.monthName} ${payroll.year}`;
  const salaryFormatted = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2 }).format(
    Number(payroll.grossSalary) || 0,
  );

  return {
    employer,
    employee,
    payroll,
    placeholders: {
      employerName: employer.name,
      employerTaxCode: employer.taxCode,
      employerCF: employer.taxCode,
      employerAddress: employer.address,
      employeeName: employee.name,
      employeeTaxCode: employee.taxCode,
      employeeCF: employee.taxCode,
      contractType: employee.contractType,
      contractTypeLabel: employee.contractTypeLabel,
      level: employee.level,
      weeklyHours: String(employee.weeklyHours),
      hourlyRate: euro(employee.hourlyRate),
      month: String(payroll.month),
      monthName: payroll.monthName,
      year: String(payroll.year),
      startDate,
      salary: salaryFormatted,
      grossSalary: euro(payroll.grossSalary),
      netSalary: euro(payroll.netSalary),
      employerContributions: euro(payroll.employerContributions),
      employeeContributions: euro(payroll.employeeContributions),
      tfr: euro(payroll.tfr),
      thirteenth: euro(payroll.thirteenth),
      totalCost: euro(payroll.totalCost),
      monthlySafetyNote: "TFR e tredicesima maturano mensilmente ma verranno liquidati alla cessazione o nei termini di legge. Non inclusi nel netto mensile.",
      mandatoryClauses,
    },
  };
}
