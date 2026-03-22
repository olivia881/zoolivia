/**
 * Modal per anagrafica datore e lavoratrice
 */

import { useState, useEffect } from 'react'

const API = '/api'

export default function AnagraficaModal({ datore, lavoratrice, onSave, onClose }) {
  const [d, setD] = useState({ nome: '', cognome: '', cf: '', indirizzo: '', cap: '', citta: '' })
  const [l, setL] = useState({ nome: '', cognome: '', cf: '', tipo_contratto: 'non_convivente' })

  useEffect(() => {
    if (datore) setD({
      nome: datore.nome || '',
      cognome: datore.cognome || '',
      cf: datore.cf || '',
      indirizzo: datore.indirizzo || '',
      cap: datore.cap || '',
      citta: datore.citta || ''
    })
    if (lavoratrice) setL({
      nome: lavoratrice.nome || '',
      cognome: lavoratrice.cognome || '',
      cf: lavoratrice.cf || '',
      tipo_contratto: lavoratrice.tipo_contratto || 'non_convivente'
    })
  }, [datore, lavoratrice])

  const saveDatore = async () => {
    await fetch(`${API}/anagrafica/datore`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    })
  }

  const saveLavoratrice = async () => {
    await fetch(`${API}/anagrafica/lavoratrice`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...l, tipo_contratto: l.tipo_contratto })
    })
  }

  const handleSave = async () => {
    await saveDatore()
    await saveLavoratrice()
    onSave(d, l)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Anagrafica</h2>

        <section>
          <h3>Datore di lavoro</h3>
          <div className="form-row">
            <label>Nome</label>
            <input value={d.nome} onChange={e => setD({ ...d, nome: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Cognome</label>
            <input value={d.cognome} onChange={e => setD({ ...d, cognome: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Codice fiscale</label>
            <input value={d.cf} onChange={e => setD({ ...d, cf: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Indirizzo</label>
            <input value={d.indirizzo} onChange={e => setD({ ...d, indirizzo: e.target.value })} />
          </div>
        </section>

        <section>
          <h3>Lavoratrice</h3>
          <div className="form-row">
            <label>Nome</label>
            <input value={l.nome} onChange={e => setL({ ...l, nome: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Cognome</label>
            <input value={l.cognome} onChange={e => setL({ ...l, cognome: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Codice fiscale</label>
            <input value={l.cf} onChange={e => setL({ ...l, cf: e.target.value })} />
          </div>
        </section>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Annulla</button>
          <button type="button" className="btn-save" onClick={handleSave}>Salva</button>
        </div>
      </div>
    </div>
  )
}
