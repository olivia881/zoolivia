const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
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

export function buildDocumentData({ profile, input, calculation }) {
  const employer = {
    name: profile.employerName,
    taxCode: profile.employerCf,
    address: profile.employerAddress,
  };
  const employee = {
    name: profile.workerName,
    taxCode: profile.workerCf,
    contractType: input.contractType,
    contractTypeLabel: contractLabel(input.contractType),
    level: input.level,
    weeklyHours: input.weeklyHours,
    hourlyRate: input.hourlyRate,
  };
  const payroll = {
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
      employerCF: employer.taxCode,
      employerAddress: employer.address,
      employeeName: employee.name,
      employeeCF: employee.taxCode,
      level: employee.level,
      weeklyHours: String(employee.weeklyHours),
      hourlyRate: euro(employee.hourlyRate),
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
      mandatoryClauses,
    },
  };
}
