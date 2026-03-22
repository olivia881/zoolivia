/**
 * Form di input per calcolo mensile
 * Tipo contratto, livello, ore, paga oraria, mese, anno
 */

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
]

export default function InputForm({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val })

  return (
    <form className="input-form" onSubmit={e => e.preventDefault()}>
      <div className="form-row">
        <label>Tipo contratto</label>
        <select
          value={value.tipoContratto}
          onChange={e => update('tipoContratto', e.target.value)}
        >
          <option value="convivente">Convivente</option>
          <option value="non_convivente">Non convivente</option>
        </select>
      </div>

      <div className="form-row">
        <label>Livello</label>
        <select
          value={value.livello}
          onChange={e => update('livello', e.target.value)}
        >
          <option value="BS">BS</option>
          <option value="CS">CS</option>
        </select>
      </div>

      {value.tipoContratto === 'non_convivente' && (
        <>
          <div className="form-row">
            <label>Ore settimanali</label>
            <input
              type="number"
              min={1}
              max={54}
              value={value.oreSettimanali || ''}
              onChange={e => update('oreSettimanali', Number(e.target.value) || 0)}
            />
          </div>
          <div className="form-row">
            <label>Paga oraria (€)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={value.pagaOraria ?? ''}
              onChange={e => update('pagaOraria', parseFloat(e.target.value) || 0)}
            />
          </div>
        </>
      )}

      <div className="form-row">
        <label>Mese</label>
        <select
          value={value.mese}
          onChange={e => update('mese', Number(e.target.value))}
        >
          {MESI.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Anno</label>
        <input
          type="number"
          min={2020}
          max={2030}
          value={value.anno || ''}
          onChange={e => update('anno', Number(e.target.value) || new Date().getFullYear())}
        />
      </div>
    </form>
  )
}
