import React from 'react';

const MESI = [
  { value: 1, label: 'Gennaio' }, { value: 2, label: 'Febbraio' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Aprile' },
  { value: 5, label: 'Maggio' }, { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Settembre' }, { value: 10, label: 'Ottobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Dicembre' },
];

export default function InputForm({ formData, setFormData, errors }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card">
      <h2 className="card-title">Dati Datore di Lavoro</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Nome</label>
          <input
            type="text"
            value={formData.datoreNome}
            onChange={e => handleChange('datoreNome', e.target.value)}
            placeholder="Mario"
            className={errors.datoreNome ? 'input-error' : ''}
          />
          {errors.datoreNome && <span className="error-msg">{errors.datoreNome}</span>}
        </div>
        <div className="form-group">
          <label>Cognome</label>
          <input
            type="text"
            value={formData.datoreCognome}
            onChange={e => handleChange('datoreCognome', e.target.value)}
            placeholder="Rossi"
            className={errors.datoreCognome ? 'input-error' : ''}
          />
          {errors.datoreCognome && <span className="error-msg">{errors.datoreCognome}</span>}
        </div>
        <div className="form-group">
          <label>Codice Fiscale</label>
          <input
            type="text"
            value={formData.datoreCodiceFiscale}
            onChange={e => handleChange('datoreCodiceFiscale', e.target.value.toUpperCase())}
            placeholder="RSSMRA80A01H501Z"
            maxLength={16}
            className={errors.datoreCodiceFiscale ? 'input-error' : ''}
          />
          {errors.datoreCodiceFiscale && <span className="error-msg">{errors.datoreCodiceFiscale}</span>}
        </div>
        <div className="form-group">
          <label>Indirizzo</label>
          <input
            type="text"
            value={formData.datoreIndirizzo}
            onChange={e => handleChange('datoreIndirizzo', e.target.value)}
            placeholder="Via Roma 1, 00100 Roma"
          />
        </div>
      </div>

      <h2 className="card-title" style={{ marginTop: '1.5rem' }}>Dati Lavoratrice</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Nome</label>
          <input
            type="text"
            value={formData.lavoratriceNome}
            onChange={e => handleChange('lavoratriceNome', e.target.value)}
            placeholder="Maria"
            className={errors.lavoratriceNome ? 'input-error' : ''}
          />
          {errors.lavoratriceNome && <span className="error-msg">{errors.lavoratriceNome}</span>}
        </div>
        <div className="form-group">
          <label>Cognome</label>
          <input
            type="text"
            value={formData.lavoratriceCognome}
            onChange={e => handleChange('lavoratriceCognome', e.target.value)}
            placeholder="Popescu"
            className={errors.lavoratriceCognome ? 'input-error' : ''}
          />
          {errors.lavoratriceCognome && <span className="error-msg">{errors.lavoratriceCognome}</span>}
        </div>
        <div className="form-group">
          <label>Codice Fiscale</label>
          <input
            type="text"
            value={formData.lavoratriceCodiceFiscale}
            onChange={e => handleChange('lavoratriceCodiceFiscale', e.target.value.toUpperCase())}
            placeholder="PPSMRA85T41Z129P"
            maxLength={16}
            className={errors.lavoratriceCodiceFiscale ? 'input-error' : ''}
          />
          {errors.lavoratriceCodiceFiscale && <span className="error-msg">{errors.lavoratriceCodiceFiscale}</span>}
        </div>
      </div>

      <h2 className="card-title" style={{ marginTop: '1.5rem' }}>Dati Contratto e Periodo</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Tipo Contratto</label>
          <select
            value={formData.tipoContratto}
            onChange={e => handleChange('tipoContratto', e.target.value)}
          >
            <option value="convivente">Convivente</option>
            <option value="non_convivente">Non Convivente</option>
          </select>
        </div>
        <div className="form-group">
          <label>Livello</label>
          <select
            value={formData.livello}
            onChange={e => handleChange('livello', e.target.value)}
          >
            <option value="BS">BS</option>
            <option value="CS">CS</option>
          </select>
        </div>
        <div className="form-group">
          <label>Ore Settimanali</label>
          <input
            type="number"
            min="1"
            max="54"
            value={formData.oreSettimanali}
            onChange={e => handleChange('oreSettimanali', e.target.value)}
            className={errors.oreSettimanali ? 'input-error' : ''}
          />
          {errors.oreSettimanali && <span className="error-msg">{errors.oreSettimanali}</span>}
        </div>
        {formData.tipoContratto === 'non_convivente' && (
          <div className="form-group">
            <label>Paga Oraria (&euro;)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.pagaOraria}
              onChange={e => handleChange('pagaOraria', e.target.value)}
              className={errors.pagaOraria ? 'input-error' : ''}
            />
            {errors.pagaOraria && <span className="error-msg">{errors.pagaOraria}</span>}
          </div>
        )}
        <div className="form-group">
          <label>Mese</label>
          <select
            value={formData.mese}
            onChange={e => handleChange('mese', e.target.value)}
          >
            {MESI.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Anno</label>
          <input
            type="number"
            min="2020"
            max="2030"
            value={formData.anno}
            onChange={e => handleChange('anno', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
