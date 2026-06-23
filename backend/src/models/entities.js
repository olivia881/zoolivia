import { getMansioniForContract, getInquadramentoText } from "../lib/ccnlLevels.js";
import {
  displayValue,
  migrateLegacyProfile,
  defaultBoardLodging,
  defaultCohabitation,
} from "../../../shared/profileFields.js";

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

function formatStartDate(input, payroll) {
  if (input.startDate?.trim()) return input.startDate.trim();
  return `1 ${payroll.monthName} ${payroll.year}`;
}

export function buildEmployer(profile) {
  const p = migrateLegacyProfile(profile);
  return {
    name: p.employerName,
    taxCode: p.employerCf,
    address: p.employerAddress,
  };
}

export function buildEmployee(profile, input) {
  const p = migrateLegacyProfile(profile);
  return {
    name: p.workerName,
    taxCode: p.workerCf,
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

export function buildDocumentData({ profile: rawProfile, input, calculation }) {
  const profile = migrateLegacyProfile(rawProfile);
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

  const startDate = formatStartDate(input, payroll);
  const salaryFormatted = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2 }).format(
    Number(payroll.grossSalary) || 0,
  );

  const level = employee.level || "BS";
  const { intro: mansioniIntro, mansioni: mansioniList, esclusioni: esclusioniList } = getMansioniForContract(level);
  const levelInquadramento = getInquadramentoText(level);

  const boardLodging = input.qBoardLodging || defaultBoardLodging(input.contractType);
  const cohabitation = input.qCohabitation || defaultCohabitation(input.contractType);

  const contractForm = {
    employer: {
      surname: profile.employerSurname,
      firstName: profile.employerFirstName,
      profession: profile.employerProfession,
      citizenship: profile.employerCitizenship,
      birthPlace: profile.employerBirthPlace,
      birthProvince: profile.employerBirthProvince,
      birthDate: profile.employerBirthDate,
      gender: profile.employerGender,
      cf: profile.employerCf,
      street: profile.employerStreet,
      fraction: profile.employerFraction,
      city: profile.employerCity,
      province: profile.employerProvince,
      cap: profile.employerCap,
      idDocType: profile.employerIdDocType,
      idDocNumber: profile.employerIdDocNumber,
      idDocExpiry: profile.employerIdDocExpiry,
    },
    worker: {
      surname: profile.workerSurname,
      firstName: profile.workerFirstName,
      spouseSurname: profile.workerSpouseSurname,
      profession: profile.workerProfession,
      citizenship: profile.workerCitizenship,
      birthPlace: profile.workerBirthPlace,
      birthProvince: profile.workerBirthProvince,
      birthDate: profile.workerBirthDate,
      gender: profile.workerGender,
      cf: profile.workerCf,
      street: profile.workerStreet,
      fraction: profile.workerFraction,
      city: profile.workerCity,
      province: profile.workerProvince,
      cap: profile.workerCap,
      idDocType: profile.workerIdDocType,
      idDocNumber: profile.workerIdDocNumber,
      idDocExpiry: profile.workerIdDocExpiry,
      permitType: profile.workerPermitType,
      permitRequestDate: profile.workerPermitRequestDate,
      permitReason: profile.workerPermitReason,
      permitNumber: profile.workerPermitNumber,
      permitExpiry: profile.workerPermitExpiry,
      permitPoliceHQ: profile.workerPermitPoliceHQ,
    },
    contract: {
      typeLabel: employee.contractTypeLabel,
      level: employee.level,
      replacementOf: input.replacementOf,
      startDate,
      endDate: input.endDate,
      weeklyHours: String(employee.weeklyHours),
      grossSalary: euro(payroll.grossSalary),
    },
    questionnaire: [
      {
        question: "La lavoratrice presta servizio continuativo e percepisce vitto e alloggio?",
        answer: boardLodging,
      },
      {
        question: "Il datore di lavoro è il coniuge della lavoratrice?",
        answer: input.qEmployerSpouse || "NO",
      },
      {
        question: "Il datore è parente o affine entro il 3° grado della lavoratrice?",
        answer: input.qKinship || "NO",
      },
      ...(input.qKinship === "SI"
        ? [{ question: "Parentela o affinità", answer: input.qKinshipDetail }]
        : []),
      {
        question: "Esiste convivenza tra datore e lavoratrice?",
        answer: cohabitation,
      },
      {
        question: "Il datore è invalido di guerra, disabile o cieco?",
        answer: input.qWarInvalid || "NO",
      },
      {
        question: "Il datore è prete secolare di religione cattolica?",
        answer: input.qSecularPriest || "NO",
      },
    ],
  };

  return {
    employer,
    employee,
    payroll,
    contractForm,
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
      endDate: displayValue(input.endDate),
      replacementOf: displayValue(input.replacementOf),
      salary: salaryFormatted,
      grossSalary: euro(payroll.grossSalary),
      netSalary: euro(payroll.netSalary),
      employerContributions: euro(payroll.employerContributions),
      employeeContributions: euro(payroll.employeeContributions),
      tfr: euro(payroll.tfr),
      thirteenth: euro(payroll.thirteenth),
      totalCost: euro(payroll.totalCost),
      monthlySafetyNote:
        "TFR e tredicesima maturano mensilmente ma verranno liquidati alla cessazione o nei termini di legge. Non inclusi nel netto mensile.",
      mandatoryClauses,
      levelInquadramento,
      mansioniIntro,
      mansioniList,
      esclusioniList,
    },
  };
}
