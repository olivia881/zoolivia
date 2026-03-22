import React, { useState, useMemo } from 'react';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import PDFButton from './components/PDFButton';
import { calcolaStipendio } from './utils/calcoloStipendio';
import './App.css';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const INITIAL_FORM = {
  datoreNome: '',
  datoreCognome: '',
  datoreCodiceFiscale: '',
  datoreIndirizzo: '',
  lavoratriceNome: '',
  lavoratriceCognome: '',
  lavoratriceCodiceFiscale: '',
  tipoContratto: 'convivente',
  livello: 'BS',
  oreSettimanali: '40',
  pagaOraria: '8.00',
  mese: String(currentMonth),
  anno: String(currentYear),
};

function validateForm(data) {
  const errors = {};
  if (!data.datoreNome.trim()) errors.datoreNome = 'Obbligatorio';
  if (!data.datoreCognome.trim()) errors.datoreCognome = 'Obbligatorio';
  if (!data.datoreCodiceFiscale.trim()) {
    errors.datoreCodiceFiscale = 'Obbligatorio';
  } else if (data.datoreCodiceFiscale.trim().length !== 16) {
    errors.datoreCodiceFiscale = 'Deve essere di 16 caratteri';
  }
  if (!data.lavoratriceNome.trim()) errors.lavoratriceNome = 'Obbligatorio';
  if (!data.lavoratriceCognome.trim()) errors.lavoratriceCognome = 'Obbligatorio';
  if (!data.lavoratriceCodiceFiscale.trim()) {
    errors.lavoratriceCodiceFiscale = 'Obbligatorio';
  } else if (data.lavoratriceCodiceFiscale.trim().length !== 16) {
    errors.lavoratriceCodiceFiscale = 'Deve essere di 16 caratteri';
  }
  const ore = parseFloat(data.oreSettimanali);
  if (!ore || ore <= 0 || ore > 54) {
    errors.oreSettimanali = 'Inserire un valore tra 1 e 54';
  }
  if (data.tipoContratto === 'non_convivente') {
    const paga = parseFloat(data.pagaOraria);
    if (!paga || paga <= 0) {
      errors.pagaOraria = 'Inserire una paga oraria valida';
    }
  }
  return errors;
}

function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const risultati = useMemo(() => {
    return calcolaStipendio({
      tipoContratto: formData.tipoContratto,
      livello: formData.livello,
      oreSettimanali: formData.oreSettimanali,
      pagaOraria: formData.pagaOraria,
    });
  }, [formData.tipoContratto, formData.livello, formData.oreSettimanali, formData.pagaOraria]);

  const errors = useMemo(() => validateForm(formData), [formData]);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gestione Buste Paga Badante</h1>
        <p>Calcolo stipendio, contributi INPS e generazione busta paga</p>
      </header>

      <main className="app-main">
        <InputForm formData={formData} setFormData={setFormData} errors={errors} />
        <ResultsPanel risultati={risultati} />
        <PDFButton
          formData={formData}
          risultati={risultati}
          disabled={hasErrors || risultati.lordo === 0}
        />
      </main>

      <footer className="app-footer">
        <p>Gestionale Buste Paga &mdash; Lavoro Domestico CCNL</p>
      </footer>
    </div>
  );
}

export default App;
