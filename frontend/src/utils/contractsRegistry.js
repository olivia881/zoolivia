/**
 * Gestione di più contratti (anagrafica + parametri) in locale.
 * Il backend continua a gestire un solo profilo: alla PUT si sincronizza il contratto attivo.
 */

import { loadProfile as loadLegacyProfile, saveProfile as saveLegacyProfile } from "./profileStorage";
import { loadWorkflowInput, saveWorkflowInput } from "./workflowStorage";

const REGISTRY_KEY = "badante-contracts-registry";
const ACTIVE_KEY = "badante-active-contract-id";

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
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
};

function newId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultContractName(profile) {
  const w = String(profile?.workerName ?? "").trim();
  const e = String(profile?.employerName ?? "").trim();
  if (w && e) return `${w} – ${e}`;
  if (w) return w;
  if (e) return e;
  return "Contratto 1";
}

export function loadRegistry() {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return migrateFromLegacy();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.contracts) || parsed.contracts.length === 0) {
      return migrateFromLegacy();
    }
    return parsed;
  } catch {
    return migrateFromLegacy();
  }
}

function migrateFromLegacy() {
  const legacyP = loadLegacyProfile();
  const legacyI = loadWorkflowInput();
  const profile = { ...DEFAULT_PROFILE, ...(legacyP || {}) };
  const input = { ...DEFAULT_INPUT, ...(legacyI || {}) };
  const id = newId();
  const contracts = [
    {
      id,
      name: defaultContractName(profile),
      createdAt: Date.now(),
      profile,
      input,
    },
  ];
  persistRegistry({ contracts, activeContractId: id });
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {}
  return { contracts, activeContractId: id };
}

function persistRegistry(data) {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(data));
    localStorage.setItem(ACTIVE_KEY, data.activeContractId);
  } catch (e) {
    console.warn("Impossibile salvare registry contratti:", e);
  }
}

export function getActiveContractId() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function loadActiveContract() {
  const { contracts, activeContractId } = loadRegistry();
  const id = activeContractId || contracts[0]?.id;
  const c = contracts.find((x) => x.id === id) ?? contracts[0];
  return { contract: c, contracts, activeContractId: id ?? c?.id };
}

export function setActiveContractId(id) {
  const data = loadRegistry();
  if (!data.contracts.some((c) => c.id === id)) return;
  persistRegistry({ ...data, activeContractId: id });
}

export function saveActiveContract(profile, input) {
  const data = loadRegistry();
  const id = data.activeContractId || data.contracts[0]?.id;
  if (!id) return;
  const contracts = data.contracts.map((c) =>
    c.id === id ? { ...c, profile: { ...profile }, input: { ...input } } : c,
  );
  persistRegistry({ contracts, activeContractId: id });
  saveLegacyProfile(profile);
  saveWorkflowInput(input);
}

export function addContract({ name, profile, input }) {
  const data = loadRegistry();
  const id = newId();
  const contract = {
    id,
    name: name || defaultContractName(profile),
    createdAt: Date.now(),
    profile: { ...DEFAULT_PROFILE, ...profile },
    input: { ...DEFAULT_INPUT, ...input },
  };
  const contracts = [...data.contracts, contract];
  persistRegistry({ contracts, activeContractId: id });
  saveLegacyProfile(contract.profile);
  saveWorkflowInput(contract.input);
  return contract;
}

export function removeContract(id) {
  const data = loadRegistry();
  if (data.contracts.length <= 1) return data;
  const contracts = data.contracts.filter((c) => c.id !== id);
  let activeContractId = data.activeContractId;
  if (activeContractId === id) {
    activeContractId = contracts[0].id;
  }
  persistRegistry({ contracts, activeContractId });
  const active = contracts.find((c) => c.id === activeContractId);
  if (active) {
    saveLegacyProfile(active.profile);
    saveWorkflowInput(active.input);
  }
  return { contracts, activeContractId };
}

export function renameContract(id, name) {
  const data = loadRegistry();
  const contracts = data.contracts.map((c) => (c.id === id ? { ...c, name: String(name).trim() || c.name } : c));
  persistRegistry({ ...data, contracts });
}
