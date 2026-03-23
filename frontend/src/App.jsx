import { useEffect, useMemo, useState } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import { calculatePayroll } from "./utils/payrollCalculator";
import { validateInput, validateProfile } from "./utils/validation";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

const DEFAULT_PROFILE = {
  employerName: "",
  employerCf: "",
  employerAddress: "",
  workerName: "",
  workerCf: "",
};

const DEFAULT_INPUT = {
  contractType: "convivente",
  level: "BS",
  weeklyHours: 54,
  hourlyRate: 7.5,
  month: currentMonth(),
  year: currentYear(),
};

function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [loadingType, setLoadingType] = useState("");
  const [documents, setDocuments] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE}/profile`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setProfile((prev) => ({ ...prev, ...data }));
      } catch (_error) {
        setStatusMessage("Backend non raggiungibile: dati locali attivi.");
      }
    }

    loadProfile();
  }, []);

  const profileErrors = useMemo(() => validateProfile(profile), [profile]);
  const inputErrors = useMemo(() => validateInput(input), [input]);
  const canCalculate = Object.keys(inputErrors).length === 0;
  const canGenerateDocuments = Object.keys(profileErrors).length === 0 && canCalculate;
  const calculation = useMemo(() => (canCalculate ? calculatePayroll(input) : null), [canCalculate, input]);

  function onProfileChange(event) {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setStatusMessage("");
  }

  function onInputChange(event) {
    const { name, value } = event.target;
    const numericFields = new Set(["weeklyHours", "hourlyRate", "month", "year"]);
    setInput((prev) => ({
      ...prev,
      [name]: numericFields.has(name) ? Number(value) : value,
    }));
    setStatusMessage("");
  }

  async function saveProfile() {
    const response = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error("Impossibile salvare l'anagrafica.");
    }
  }

  async function handleGenerateDocument(documentType) {
    if (!calculation) {
      setStatusMessage("Correggi i campi input prima di generare i documenti.");
      return;
    }

    if (Object.keys(profileErrors).length > 0) {
      setStatusMessage("Compila l'anagrafica prima di generare i documenti.");
      return;
    }

    setLoadingType(documentType);
    setStatusMessage("");
    try {
      await saveProfile();

      const response = await fetch(`${API_BASE}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, profile, input }),
      });

      if (!response.ok) {
        throw new Error("Errore durante la generazione dei documenti.");
      }

      const data = await response.json();
      const baseOrigin = API_BASE.startsWith("http") ? API_BASE.replace("/api", "") : "";
      const cacheBuster = Date.now();
      const generatedDocs = (data.files ?? []).map((file) => ({
        documentType: file.documentType,
        fileName: file.fileName,
        url: `${baseOrigin}${file.filePath}?v=${cacheBuster}`,
      }));

      setDocuments(generatedDocs);
      setStatusMessage(data.message ?? "Documenti generati correttamente.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoadingType("");
    }
  }

  return (
    <main className="layout">
      <header className="hero">
        <h1>Gestionale Buste Paga Badante</h1>
        <p>Calcolo stipendio, contributi INPS e generazione PDF in un'unica schermata.</p>
      </header>

      <InputForm
        profile={profile}
        input={input}
        onProfileChange={onProfileChange}
        onInputChange={onInputChange}
        profileErrors={profileErrors}
        inputErrors={inputErrors}
      />

      <ResultsPanel calculation={calculation} />
      <DocumentsPanel
        onGenerate={handleGenerateDocument}
        loadingType={loadingType}
        disabled={!canGenerateDocuments}
        documents={documents}
      />

      {statusMessage && <p className="status">{statusMessage}</p>}
    </main>
  );
}

export default App;
