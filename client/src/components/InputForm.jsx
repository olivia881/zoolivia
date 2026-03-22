import { MESI_NOMI, LIVELLI, CCNL_STIPENDI } from '../utils/calculations';

const annoCorrente = new Date().getFullYear();

/**
 * Form di input per i dati mensili della badante
 */
export function InputForm({ formData, onChange, errori = {} }) {
  const isNonConvivente = formData.tipoContratto === 'non_convivente';

  function handleChange(campo, valore) {
    onChange({ ...formData, [campo]: valore });
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
        <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
        Dati Mensili
      </h2>

      {/* Tipo contratto */}
      <div className="mb-4">
        <label className="label">Tipo Contratto *</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { valore: 'convivente', etichetta: 'Convivente', icona: '🏠' },
            { valore: 'non_convivente', etichetta: 'Non Convivente', icona: '🚶' },
          ].map(({ valore, etichetta, icona }) => (
            <label
              key={valore}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.tipoContratto === valore
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="radio"
                name="tipoContratto"
                value={valore}
                checked={formData.tipoContratto === valore}
                onChange={() => handleChange('tipoContratto', valore)}
                className="sr-only"
              />
              <span>{icona}</span>
              <span className="text-sm font-medium">{etichetta}</span>
            </label>
          ))}
        </div>
        {errori.tipoContratto && <p className="text-red-500 text-xs mt-1">{errori.tipoContratto}</p>}
      </div>

      {/* Livello CCNL */}
      <div className="mb-4">
        <label className="label">Livello CCNL *</label>
        <select
          value={formData.livello}
          onChange={(e) => handleChange('livello', e.target.value)}
          className="input-field"
        >
          {LIVELLI.map(({ valore, etichetta, descrizione }) => (
            <option key={valore} value={valore}>
              {etichetta}
              {formData.tipoContratto === 'convivente' ? ` — ${descrizione}` : ''}
            </option>
          ))}
        </select>
        {formData.tipoContratto === 'convivente' && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Stipendio CCNL convivente: €{CCNL_STIPENDI[formData.livello]?.toLocaleString('it-IT')}/mese
          </p>
        )}
        {errori.livello && <p className="text-red-500 text-xs mt-1">{errori.livello}</p>}
      </div>

      {/* Ore settimanali e paga oraria (solo non convivente) */}
      {isNonConvivente && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">Ore Settimanali *</label>
            <input
              type="number"
              value={formData.oreSettimanali}
              onChange={(e) => handleChange('oreSettimanali', e.target.value)}
              min="1"
              max="60"
              step="0.5"
              placeholder="es. 30"
              className={`input-field ${errori.oreSettimanali ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {errori.oreSettimanali && (
              <p className="text-red-500 text-xs mt-1">{errori.oreSettimanali}</p>
            )}
          </div>

          <div>
            <label className="label">Paga Oraria (€) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="number"
                value={formData.pagaOraria}
                onChange={(e) => handleChange('pagaOraria', e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="8.50"
                className={`input-field pl-7 ${errori.pagaOraria ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
            </div>
            {errori.pagaOraria && (
              <p className="text-red-500 text-xs mt-1">{errori.pagaOraria}</p>
            )}
          </div>
        </div>
      )}

      {isNonConvivente && formData.oreSettimanali && formData.pagaOraria && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>Calcolo lordo:</strong>{' '}
            €{formData.pagaOraria} × {formData.oreSettimanali}h × 4,33 settimane =
            €{(parseFloat(formData.pagaOraria || 0) * parseFloat(formData.oreSettimanali || 0) * 4.33).toFixed(2).replace('.', ',')}
          </p>
        </div>
      )}

      {/* Mese e Anno */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <label className="label">Mese *</label>
          <select
            value={formData.mese}
            onChange={(e) => handleChange('mese', parseInt(e.target.value))}
            className={`input-field ${errori.mese ? 'border-red-400' : ''}`}
          >
            {MESI_NOMI.map((nome, i) => (
              <option key={i} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Anno *</label>
          <input
            type="number"
            value={formData.anno}
            onChange={(e) => handleChange('anno', parseInt(e.target.value))}
            min="2020"
            max="2030"
            className={`input-field ${errori.anno ? 'border-red-400' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
