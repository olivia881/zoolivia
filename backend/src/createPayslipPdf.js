import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency } from '../../shared/payslipCalculator.js'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const archiveRoot = path.join(projectRoot, 'buste')

function sanitizeFilePart(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function drawRow(page, font, label, value, x, y, width) {
  page.drawText(label, {
    x,
    y,
    size: 11,
    font,
    color: rgb(0.32, 0.36, 0.44),
  })

  page.drawText(value, {
    x: x + width,
    y,
    size: 11,
    font,
    color: rgb(0.06, 0.1, 0.18),
  })
}

export async function createPayslipPdf(input, calculations) {
  fs.mkdirSync(archiveRoot, { recursive: true })

  const monthLabel = calculations.monthLabel
  const safeName = sanitizeFilePart(input.workerName) || 'Lavoratrice'
  const yearDirectory = path.join(archiveRoot, String(input.year))

  fs.mkdirSync(yearDirectory, { recursive: true })

  const fileName = `Busta_${monthLabel}_${input.year}_${safeName}.pdf`
  const filePath = path.join(yearDirectory, fileName)

  const pdfDocument = await PDFDocument.create()
  const page = pdfDocument.addPage([595.28, 841.89])
  const titleFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
  const bodyFont = await pdfDocument.embedFont(StandardFonts.Helvetica)

  page.drawText('Busta paga badante', {
    x: 50,
    y: 790,
    size: 22,
    font: titleFont,
    color: rgb(0.06, 0.1, 0.18),
  })

  page.drawText(`${monthLabel} ${input.year}`, {
    x: 50,
    y: 765,
    size: 12,
    font: bodyFont,
    color: rgb(0.32, 0.36, 0.44),
  })

  page.drawText('Datore di lavoro', {
    x: 50,
    y: 720,
    size: 14,
    font: titleFont,
  })

  drawRow(page, bodyFont, 'Nome', input.employerName, 50, 695, 130)
  drawRow(page, bodyFont, 'Codice fiscale', input.employerTaxCode, 50, 675, 130)
  drawRow(page, bodyFont, 'Indirizzo', input.employerAddress, 50, 655, 130)

  page.drawText('Lavoratrice', {
    x: 50,
    y: 615,
    size: 14,
    font: titleFont,
  })

  drawRow(page, bodyFont, 'Nome', input.workerName, 50, 590, 130)
  drawRow(page, bodyFont, 'Codice fiscale', input.workerTaxCode, 50, 570, 130)
  drawRow(page, bodyFont, 'Contratto', calculations.contractLabel, 50, 550, 130)
  drawRow(page, bodyFont, 'Livello', calculations.levelLabel, 50, 530, 130)
  drawRow(page, bodyFont, 'Ore settimanali', `${input.weeklyHours}`, 50, 510, 130)
  drawRow(
    page,
    bodyFont,
    'Paga oraria',
    input.contractType === 'non convivente' ? formatCurrency(input.hourlyRate) : 'Non applicabile',
    50,
    490,
    130,
  )

  page.drawText('Riepilogo economico', {
    x: 50,
    y: 445,
    size: 14,
    font: titleFont,
  })

  const summaryRows = [
    ['Lordo', formatCurrency(calculations.grossSalary)],
    ['Netto', formatCurrency(calculations.netSalary)],
    ['Contributi lavoratore', formatCurrency(calculations.workerContributions)],
    ['Contributi datore', formatCurrency(calculations.employerContributions)],
    ['TFR', formatCurrency(calculations.tfr)],
    ['Tredicesima', formatCurrency(calculations.thirteenth)],
    ['Costo totale', formatCurrency(calculations.totalCost)],
  ]

  summaryRows.forEach(([label, value], index) => {
    drawRow(page, bodyFont, label, value, 50, 420 - index * 24, 180)
  })

  page.drawText('Documento generato automaticamente dal gestionale badante.', {
    x: 50,
    y: 90,
    size: 10,
    font: bodyFont,
    color: rgb(0.45, 0.48, 0.53),
  })

  const pdfBytes = await pdfDocument.save()
  fs.writeFileSync(filePath, pdfBytes)

  return {
    fileName,
    filePath,
    relativePath: path.relative(projectRoot, filePath).replaceAll(path.sep, '/'),
  }
}
