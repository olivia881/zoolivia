import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import {
  defaultFormValues,
  getMonthLabel,
  summarizePayslip,
} from '../../shared/payslipCalculator.js'
import { createPayslipPdf } from './createPayslipPdf.js'
import { getSettings, listArchive, saveArchiveEntry, saveSettings } from './db.js'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const frontendDist = path.join(projectRoot, 'frontend', 'dist')

const app = express()
const port = process.env.PORT || 3001

function formatArchiveEntry(entry) {
  return {
    ...entry,
    monthLabel: getMonthLabel(entry.month),
    downloadUrl: `/${entry.filePath.replaceAll(path.sep, '/')}`,
  }
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/buste', express.static(path.join(projectRoot, 'buste')))

app.get('/api/settings', (_request, response) => {
  const savedSettings = getSettings()

  response.json({
    settings: savedSettings ? { ...defaultFormValues, ...savedSettings } : { ...defaultFormValues },
  })
})

app.post('/api/settings', (request, response) => {
  const summary = summarizePayslip(request.body)

  if (Object.keys(summary.errors).length > 0) {
    return response.status(400).json({ errors: summary.errors })
  }

  saveSettings(summary.normalized)

  return response.json({ settings: summary.normalized })
})

app.get('/api/archive', (_request, response) => {
  response.json({
    archive: listArchive().map(formatArchiveEntry),
  })
})

app.post('/api/payslips/generate', async (request, response) => {
  const summary = summarizePayslip(request.body)

  if (Object.keys(summary.errors).length > 0 || !summary.calculations) {
    return response.status(400).json({ errors: summary.errors })
  }

  try {
    saveSettings(summary.normalized)

    const pdfFile = await createPayslipPdf(summary.normalized, summary.calculations)

    saveArchiveEntry({
      ...summary.normalized,
      ...summary.calculations,
      fileName: pdfFile.fileName,
      filePath: pdfFile.relativePath,
    })

    return response.status(201).json({
      fileName: pdfFile.fileName,
      downloadUrl: `/${pdfFile.relativePath}`,
      calculations: summary.calculations,
      archive: listArchive().map(formatArchiveEntry),
    })
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error)
    return response.status(500).json({
      error: 'Non e stato possibile generare la busta paga.',
    })
  }
})

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get(/^(?!\/api|\/buste).*/, (_request, response) => {
    response.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Backend avviato su http://localhost:${port}`)
})
