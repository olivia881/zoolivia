import { useMemo, useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import HistoryPanel from "./components/HistoryPanel";
import ContractSwitcher from "./components/ContractSwitcher";
import { calculatePayroll } from "./utils/payrollCalculator";
import { validateInput, validateProfile } from "./utils/validation";
import {
  getPayrollHistory,
  addToPayrollHistory,
  removeFromPayrollHistory,
  resetPayrollHistory,
} from "./utils/payrollStorage";
import { bumpMonthYearIfNeeded } from "./utils/workflowStorage";
import {
  loadRegistry,
  loadActiveContract,
  saveActiveContract,
  setActiveContractId,
  addContract,
  removeContract,
  renameContract,
} from "./utils/contractsRegistry";
import { generatePDFClient, generateManualPdf } from "./lib/pdfGenerator";
import { downloadOrOpenPdf } from "./utils/fileDownload";

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
  hourlyRate: 7.45,
  month: currentMonth(),
  year: currentYear(),
};

function App() {
  const [registryTick, setRegistryTick] = useState(0);
  const contractsData = useMemo(() => loadRegistry(), [registryTick]);
  const activeContractId = contractsData.activeContractId || contractsData.contracts[0]?.id;

  const [profile, setProfile] = useState(() => {
    const { contract } = loadActiveContract();
    return { ...DEFAULT_PROFILE, ...contract?.profile };
  });
  const [input, setInput] = useState(() => {
    const { contract } = loadActiveContract();
    return bumpMonthYearIfNeeded({ ...DEFAULT_INPUT, ...contract?.input });
  });
  const [loadingType, setLoadingType] = useState("");
  const [documents, setDocuments] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [historyFilterYear, setHistoryFilterYear] = useState(null);
  const [forceDesktopLayout, setForceDesktopLayout] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const s = localStorage.getItem("bustabadante-zoom");
      const n = s ? Number(s) : 100;
      return Math.max(30, Math.min(150, n)) || 100;
    } catch {
      return 100;
    }
  });

  function setZoom(delta) {
    setZoomLevel((z) => {
      const next = Math.max(30, Math.min(150, z + delta));
      try {
        localStorage.setItem("bustabadante-zoom", String(next));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    setHistory(getPayrollHistory());
    async function initProfile() {
      const applyWorkflow = (baseInput, data) => {
        const merged = {
          ...baseInput,
          contractType: data.contractType ?? baseInput.contractType,
          level: data.level ?? baseInput.level,
          weeklyHours: data.weeklyHours ?? baseInput.weeklyHours,
          hourlyRate: data.hourlyRate ?? baseInput.hourlyRate,
          month: data.month ?? baseInput.month,
          year: data.year ?? baseInput.year,
        };
        return bumpMonthYearIfNeeded(merged);
      };

      try {
        const res = await fetch(`${API_BASE}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile((p) => ({
            ...p,
            employerName: data.employerName ?? p.employerName,
            employerCf: data.employerCf ?? p.employerCf,
            employerAddress: data.employerAddress ?? p.employerAddress,
            workerName: data.workerName ?? p.workerName,
            workerCf: data.workerCf ?? p.workerCf,
          }));
          setInput((prev) => applyWorkflow(prev, data));
          return;
        }
      } catch {
        /* backend non raggiungibile */
      }
    }
    initProfile();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      saveActiveContract(profile, input);
    }, 400);
    return () => clearTimeout(t);
  }, [profile, input]);

  function handleSelectContract(id) {
    setActiveContractId(id);
    const r = loadRegistry();
    const c = r.contracts.find((x) => x.id === id);
    if (c) {
      setProfile({ ...c.profile });
      setInput(bumpMonthYearIfNeeded({ ...c.input }));
    }
    setRegistryTick((x) => x + 1);
    setStatusMessage("");
  }

  function handleNewContract() {
    const c = addContract({
      profile: { ...DEFAULT_PROFILE },
      input: { ...DEFAULT_INPUT, month: currentMonth(), year: currentYear() },
    });
    setProfile({ ...c.profile });
    setInput(bumpMonthYearIfNeeded({ ...c.input }));
    setRegistryTick((x) => x + 1);
    setStatusMessage("Nuovo contratto creato. Compila anagrafica e parametri.");
  }

  function handleDeleteContract(id) {
    if (!window.confirm("Eliminare questo contratto salvato? I dati non saranno recuperabili.")) return;
    removeContract(id);
    const r = loadRegistry();
    const active = r.contracts.find((x) => x.id === r.activeContractId) ?? r.contracts[0];
    if (active) {
      setProfile({ ...active.profile });
      setInput(bumpMonthYearIfNeeded({ ...active.input }));
    }
    setRegistryTick((x) => x + 1);
    setStatusMessage("Contratto eliminato.");
  }

  function handleRenameContract(id, name) {
    renameContract(id, name);
    setRegistryTick((x) => x + 1);
  }

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

  function handleDeleteHistory(id) {
    setHistory(removeFromPayrollHistory(id));
  }

  function handleResetHistory() {
    resetPayrollHistory();
    setHistory([]);
  }

  async function saveProfile() {
    const payload = { ...profile, ...input };
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) return;
    } catch {
      /* standalone mode */
    }
    saveActiveContract(profile, input);
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

      if (response.ok) {
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
        if (documentType === "payslip") {
          const calc = data.calculation ?? calculation;
          setHistory(
            addToPayrollHistory({
              month: input.month,
              year: input.year,
              workerName: profile.workerName,
              workerCf: profile.workerCf,
              contractType: input.contractType,
              level: input.level,
              weeklyHours: input.weeklyHours,
              gross: calc.gross,
              net: calc.net,
              employeeContributions: calc.employeeContributions,
              employerContributions: calc.employerContributions,
              tfr: calc.tfr,
              thirteenth: calc.thirteenth,
              totalCost: calc.totalCost,
            }),
          );
        }
        setLoadingType("");
        return;
      }
    } catch {
      /* API non disponibile, usa generazione locale */
    }

    try {
      const result = await generatePDFClient(documentType, {
        profile,
        input,
        calculation,
      });
      const files = Array.isArray(result) ? result : [result];
      const opened = [];
      for (const { blob, fileName } of files) {
        const res = await downloadOrOpenPdf(blob, fileName);
        opened.push(res);
      }
      setDocuments(
        files.map((f, i) => ({
          documentType: documentType === "contract" ? (i === 0 ? "contract" : "clause") : documentType,
          fileName: f.fileName,
          url: URL.createObjectURL(f.blob),
          localPath: opened[i]?.localPath,
        })),
      );
      setStatusMessage("Documenti generati e scaricati localmente.");
      if (documentType === "payslip") {
        setHistory(
          addToPayrollHistory({
            month: input.month,
            year: input.year,
            workerName: profile.workerName,
            workerCf: profile.workerCf,
            contractType: input.contractType,
            level: input.level,
            weeklyHours: input.weeklyHours,
            gross: calculation.gross,
            net: calculation.net,
            employeeContributions: calculation.employeeContributions,
            employerContributions: calculation.employerContributions,
            tfr: calculation.tfr,
            thirteenth: calculation.thirteenth,
            totalCost: calculation.totalCost,
          }),
        );
      }
    } catch (error) {
      setStatusMessage(error.message ?? "Errore nella generazione.");
    }
    setLoadingType("");
  }

  async function handleDownloadManual() {
    setManualLoading(true);
    setStatusMessage("");
    try {
      const { blob, fileName } = await generateManualPdf();
      await downloadOrOpenPdf(blob, fileName);
      setStatusMessage("Manuale generato.");
    } catch (e) {
      setStatusMessage(e?.message ?? "Errore nella generazione del manuale.");
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <div className="app-root">
      <div
        className="zoom-container"
        style={{ "--zoom": zoomLevel / 100 }}
      >
        <main className={`layout ${forceDesktopLayout ? "layout-desktop" : ""}`}>
          <header className="hero">
        <h1>Gestionale Buste Paga Badante</h1>
        <p>Calcolo stipendio, contributi INPS e generazione PDF in un'unica schermata.</p>
        <button
          type="button"
          className="hero-manual-link"
          onClick={handleDownloadManual}
          disabled={manualLoading}
        >
          {manualLoading ? "Generazione…" : "Scarica manuale PDF"}
        </button>
      </header>

      <button
        type="button"
        className={`layout-toggle ${forceDesktopLayout ? "active" : ""}`}
        onClick={() => setForceDesktopLayout((v) => !v)}
        aria-pressed={forceDesktopLayout}
        aria-label={forceDesktopLayout ? "Layout compatto" : "Layout desktop (2 colonne, pulsanti in riga)"}
        title={forceDesktopLayout ? "Layout compatto" : "Layout desktop (2 colonne, pulsanti in riga)"}
      >
        <span className="layout-toggle-icon">⊞</span>
        <span>{forceDesktopLayout ? "Layout compatto" : "Layout desktop"}</span>
      </button>

      <ContractSwitcher
        contracts={contractsData.contracts}
        activeId={activeContractId}
        onSelect={handleSelectContract}
        onNew={handleNewContract}
        onDelete={handleDeleteContract}
        onRename={handleRenameContract}
      />

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

      <HistoryPanel
        history={history}
        filterYear={historyFilterYear}
        onFilterYearChange={setHistoryFilterYear}
        onDelete={handleDeleteHistory}
        onReset={handleResetHistory}
      />

      {statusMessage && <p className="status">{statusMessage}</p>}
        </main>
      </div>

      <div className="zoom-controls" aria-label="Controllo zoom">
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setZoom(-10)}
          disabled={zoomLevel <= 30}
          aria-label="Rimpicciolisci"
        >
          −
        </button>
        <span className="zoom-label">{zoomLevel}%</span>
        <button
          type="button"
          className="zoom-btn"
          onClick={() => setZoom(10)}
          disabled={zoomLevel >= 150}
          aria-label="Ingrandisci"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default App;
