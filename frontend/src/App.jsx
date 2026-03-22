import { useEffect, useMemo, useState } from 'react'
import { defaultFormValues, summarizePayslip } from '@shared/payslipCalculator.js'
import './App.css'
import InputForm from './components/InputForm'
import ResultsPanel from './components/ResultsPanel'
import PDFButton from './components/PDFButton'

function App() {
  const [formData, setFormData] = useState(defaultFormValues)
  const [archive, setArchive] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState({ type: 'info', message: '' })

  const summary = useMemo(() => summarizePayslip(formData), [formData])

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [settingsResponse, archiveResponse] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/archive'),
        ])

        if (!settingsResponse.ok || !archiveResponse.ok) {
          throw new Error('Impossibile caricare i dati iniziali.')
        }

        const settingsPayload = await settingsResponse.json()
        const archivePayload = await archiveResponse.json()

        setFormData(settingsPayload.settings)
        setArchive(archivePayload.archive)
      } catch (error) {
        console.error(error)
        setStatus({
          type: 'error',
          message: 'Non sono riuscito a caricare i dati salvati. Puoi comunque usare i valori di default.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveSettings() {
    setIsSaving(true)
    setStatus({ type: 'info', message: '' })

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json()

      if (!response.ok) {
        const firstError = Object.values(payload.errors ?? {})[0] ?? 'Controlla i campi inseriti.'
        throw new Error(firstError)
      }

      setFormData(payload.settings)
      setStatus({ type: 'success', message: 'Dati salvati correttamente nel database locale.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Salvataggio non riuscito.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function generatePdf() {
    setIsGenerating(true)
    setStatus({ type: 'info', message: '' })

    try {
      const response = await fetch('/api/payslips/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json()

      if (!response.ok) {
        const firstError = Object.values(payload.errors ?? {})[0] ?? payload.error ?? 'Controlla i dati inseriti.'
        throw new Error(firstError)
      }

      setArchive(payload.archive ?? [])
      setStatus({
        type: 'success',
        message: `${payload.fileName} generato e archiviato con successo.`,
      })

      const link = document.createElement('a')
      link.href = payload.downloadUrl
      link.download = payload.fileName
      document.body.append(link)
      link.click()
      link.remove()
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Generazione PDF non riuscita.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return <div className="loading-state">Caricamento gestionale...</div>
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="hero-card__eyebrow">Gestionale badante</p>
        <h1>Buste paga, contributi INPS e archivio PDF in una sola schermata.</h1>
        <p className="hero-card__copy">
          Calcolo semplificato ma realistico per badante convivente e non convivente, con salvataggio
          locale su SQLite e PDF pronto al download.
        </p>
      </section>

      <InputForm
        formData={formData}
        errors={summary.errors}
        onChange={updateField}
        onSave={saveSettings}
        isSaving={isSaving}
      />

      <ResultsPanel
        calculations={summary.calculations}
        archive={archive}
        validationErrors={summary.errors}
      />

      <PDFButton
        onGenerate={generatePdf}
        disabled={!summary.calculations}
        isLoading={isGenerating}
        statusMessage={status.message}
        statusType={status.type}
      />
    </main>
  )
}

export default App
