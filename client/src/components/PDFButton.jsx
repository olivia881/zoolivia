/**
 * Pulsante per generare busta paga PDF
 * Chiama API backend e salva in buste/[anno]/
 */

import { useState } from 'react'

const API = '/api'

export default function PDFButton({ risultato, datore, lavoratrice, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadUrl, setDownloadUrl] = useState(null)

  const handleGenera = async () => {
    setLoading(true)
    setError(null)
    setDownloadUrl(null)
    try {
      const res = await fetch(`${API}/pdf/genera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datiCalcolo: risultato,
          datore: datore || { nome: '', cognome: '', cf: '', indirizzo: '' },
          lavoratrice: lavoratrice || { nome: '', cognome: '', cf: '' }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore generazione PDF')
      setDownloadUrl(data.downloadUrl)
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pdf-button-wrap">
      <button
        type="button"
        className="btn-pdf"
        onClick={handleGenera}
        disabled={loading || !risultato}
      >
        {loading ? 'Generazione...' : 'Genera Busta Paga'}
      </button>
      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-download"
        >
          Scarica PDF
        </a>
      )}
      {error && <p className="pdf-error">{error}</p>}
    </div>
  )
}
