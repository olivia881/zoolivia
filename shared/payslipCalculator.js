export const CONTRACT_TYPES = [
  { value: 'convivente', label: 'Convivente' },
  { value: 'non convivente', label: 'Non convivente' },
]

export const LEVELS = [
  { value: 'BS', label: 'BS' },
  { value: 'CS', label: 'CS' },
]

export const MONTH_OPTIONS = [
  { value: 1, label: 'Gennaio' },
  { value: 2, label: 'Febbraio' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Aprile' },
  { value: 5, label: 'Maggio' },
  { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Settembre' },
  { value: 10, label: 'Ottobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Dicembre' },
]

export const CONVIVENTE_BASE_SALARY = {
  BS: 1053,
  CS: 1120,
}

export const CONTRIBUTION_RATES = {
  worker: 0.07,
  employer: 0.16,
}

export const TFR_RATE = 0.0741
export const MONTH_FACTOR = 4.33

export const defaultFormValues = {
  employerName: 'Mario Rossi',
  employerTaxCode: 'RSSMRA80A01H501U',
  employerAddress: 'Via Roma 10, Milano',
  workerName: 'Ana Popescu',
  workerTaxCode: 'PPCNNA85B41Z129K',
  contractType: 'convivente',
  level: 'BS',
  weeklyHours: 25,
  hourlyRate: 7.5,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
}

const taxCodeRegex = /^[A-Z0-9]{11,16}$/i

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : fallback
}

export function getMonthLabel(month) {
  return MONTH_OPTIONS.find((item) => item.value === Number(month))?.label ?? ''
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0)
}

export function normalizeFormData(rawData = {}) {
  return {
    employerName: normalizeText(rawData.employerName),
    employerTaxCode: normalizeText(rawData.employerTaxCode).toUpperCase(),
    employerAddress: normalizeText(rawData.employerAddress),
    workerName: normalizeText(rawData.workerName),
    workerTaxCode: normalizeText(rawData.workerTaxCode).toUpperCase(),
    contractType:
      normalizeText(rawData.contractType).toLowerCase() === 'non convivente'
        ? 'non convivente'
        : 'convivente',
    level: normalizeText(rawData.level).toUpperCase() === 'CS' ? 'CS' : 'BS',
    weeklyHours: normalizeNumber(rawData.weeklyHours, defaultFormValues.weeklyHours),
    hourlyRate: normalizeNumber(rawData.hourlyRate, defaultFormValues.hourlyRate),
    month: normalizeInteger(rawData.month, defaultFormValues.month),
    year: normalizeInteger(rawData.year, defaultFormValues.year),
  }
}

export function validatePayslipInput(input) {
  const errors = {}

  if (!input.employerName) {
    errors.employerName = 'Inserisci il nome del datore di lavoro.'
  }

  if (!taxCodeRegex.test(input.employerTaxCode)) {
    errors.employerTaxCode = 'Il codice fiscale del datore deve avere 11 o 16 caratteri alfanumerici.'
  }

  if (!input.employerAddress) {
    errors.employerAddress = 'Inserisci l\'indirizzo del datore di lavoro.'
  }

  if (!input.workerName) {
    errors.workerName = 'Inserisci il nome della lavoratrice.'
  }

  if (!taxCodeRegex.test(input.workerTaxCode)) {
    errors.workerTaxCode = 'Il codice fiscale della lavoratrice deve avere 11 o 16 caratteri alfanumerici.'
  }

  if (!CONTRACT_TYPES.some((type) => type.value === input.contractType)) {
    errors.contractType = 'Seleziona un tipo di contratto valido.'
  }

  if (!LEVELS.some((level) => level.value === input.level)) {
    errors.level = 'Seleziona un livello valido.'
  }

  if (input.weeklyHours <= 0 || input.weeklyHours > 60) {
    errors.weeklyHours = 'Le ore settimanali devono essere comprese tra 1 e 60.'
  }

  if (input.contractType === 'non convivente' && input.hourlyRate <= 0) {
    errors.hourlyRate = 'Inserisci una paga oraria maggiore di zero.'
  }

  if (input.month < 1 || input.month > 12) {
    errors.month = 'Il mese deve essere compreso tra 1 e 12.'
  }

  if (input.year < 2020 || input.year > 2100) {
    errors.year = 'L\'anno deve essere compreso tra 2020 e 2100.'
  }

  return errors
}

export function calculatePayslip(input) {
  const grossSalary =
    input.contractType === 'convivente'
      ? CONVIVENTE_BASE_SALARY[input.level]
      : input.hourlyRate * input.weeklyHours * MONTH_FACTOR

  const workerContributions = grossSalary * CONTRIBUTION_RATES.worker
  const employerContributions = grossSalary * CONTRIBUTION_RATES.employer
  const netSalary = grossSalary - workerContributions
  const tfr = grossSalary * TFR_RATE
  const thirteenth = grossSalary / 12
  const totalCost = grossSalary + employerContributions + tfr + thirteenth

  return {
    grossSalary: roundCurrency(grossSalary),
    workerContributions: roundCurrency(workerContributions),
    employerContributions: roundCurrency(employerContributions),
    netSalary: roundCurrency(netSalary),
    tfr: roundCurrency(tfr),
    thirteenth: roundCurrency(thirteenth),
    totalCost: roundCurrency(totalCost),
    contractLabel: CONTRACT_TYPES.find((type) => type.value === input.contractType)?.label ?? '',
    levelLabel: input.level,
    monthLabel: getMonthLabel(input.month),
  }
}

export function summarizePayslip(rawData) {
  const normalized = normalizeFormData(rawData)
  const errors = validatePayslipInput(normalized)

  return {
    normalized,
    errors,
    calculations: Object.keys(errors).length === 0 ? calculatePayslip(normalized) : null,
  }
}
