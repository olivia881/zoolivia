import { useState, useEffect } from 'react'
import './App.css'
import InputForm from './components/InputForm'
import ResultsPanel from './components/ResultsPanel'
import PDFButton from './components/PDFButton'
import AnagraficaModal from './components/AnagraficaModal'

const API = '/api'

export default function App() {
  const [input, setInput] = useState({
    tipoContratto: 'non_convivente',
    livello: 'BS',
    oreSettimanali: 20,
    pagaOraria: 8,
    mese: new Date().getMonth() + 1,
    anno: new Date().getFullYear()
  })

  const [risultato, setRisultato] = useState(null)
  const [datore, setDatore] = useState(null)
  const [lavoratrice, setLavoratrice] = useState(null)
  const [showAnagrafica, setShowAnagrafica] = useState(false)

  // Carica anagrafica all'avvio
  useEffect(() => {
    fetch(`${API}/anagrafica/datore`).then(r => r.json()).then(setDatore)
    fetch(`${API}/anagrafica/lavoratrice`).then(r => r.json()).then(setLavoratrice)
  }, [])

  // Calcolo in tempo reale
  useEffect(() => {
    fetch(`${API}/calcola`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
      .then(r => r.json())
      .then(setRisultato)
      .catch(() => setRisultato(null))
  }, [input])

  const onPDFGenerato = () => {
    setShowAnagrafica(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Buste Paga Badante</h1>
        <button
          type="button"
          className="btn-anagrafica"
          onClick={() => setShowAnagrafica(true)}
        >
          Anagrafica
        </button>
      </header>

      <main className="main">
        <section className="card input-section">
          <InputForm value={input} onChange={setInput} />
        </section>

        {risultato && (
          <section className="card results-section">
            <ResultsPanel risultato={risultato} />
            <PDFButton
              risultato={risultato}
              datore={datore}
              lavoratrice={lavoratrice}
              onSuccess={onPDFGenerato}
            />
          </section>
        )}
      </main>

      {showAnagrafica && (
        <AnagraficaModal
          datore={datore}
          lavoratrice={lavoratrice}
          onSave={(d, l) => {
            setDatore(d)
            setLavoratrice(l)
          }}
          onClose={() => setShowAnagrafica(false)}
        />
      )}
    </div>
  )
}
