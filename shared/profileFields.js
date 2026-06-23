/** Campi anagrafici e contrattuali in stile denuncia INPS lavoro domestico */

export const DEFAULT_PROFILE = {
  employerSurname: "",
  employerFirstName: "",
  employerProfession: "",
  employerCitizenship: "Italiana",
  employerBirthPlace: "",
  employerBirthProvince: "",
  employerBirthDate: "",
  employerGender: "",
  employerCf: "",
  employerStreet: "",
  employerFraction: "",
  employerCity: "",
  employerProvince: "",
  employerCap: "",
  employerIdDocType: "",
  employerIdDocNumber: "",
  employerIdDocExpiry: "",
  employerName: "",
  employerAddress: "",

  workerSurname: "",
  workerFirstName: "",
  workerProfession: "",
  workerCitizenship: "",
  workerBirthPlace: "",
  workerBirthProvince: "",
  workerBirthDate: "",
  workerGender: "",
  workerCf: "",
  workerSpouseSurname: "",
  workerStreet: "",
  workerFraction: "",
  workerCity: "",
  workerProvince: "",
  workerCap: "",
  workerIdDocType: "",
  workerIdDocNumber: "",
  workerIdDocExpiry: "",
  workerPermitType: "",
  workerPermitRequestDate: "",
  workerPermitReason: "",
  workerPermitNumber: "",
  workerPermitExpiry: "",
  workerPermitPoliceHQ: "",
  workerName: "",
};

export const DEFAULT_CONTRACT_INPUT = {
  startDate: "",
  endDate: "",
  replacementOf: "",
  qBoardLodging: "",
  qEmployerSpouse: "NO",
  qKinship: "NO",
  qKinshipDetail: "",
  qCohabitation: "",
  qWarInvalid: "NO",
  qSecularPriest: "NO",
};

export const YES_NO_OPTIONS = [
  { value: "", label: "—" },
  { value: "SI", label: "Sì" },
  { value: "NO", label: "No" },
];

export function displayValue(value) {
  const s = String(value ?? "").trim();
  return s || "—";
}

export function formatPersonName(surname, firstName, legacyName = "") {
  const full = `${String(surname ?? "").trim()} ${String(firstName ?? "").trim()}`.trim();
  return full || String(legacyName ?? "").trim();
}

export function formatStructuredAddress({ street, fraction, city, province, cap, legacy = "" }) {
  const parts = [
    String(street ?? "").trim(),
    String(fraction ?? "").trim(),
    [String(cap ?? "").trim(), String(city ?? "").trim()].filter(Boolean).join(" "),
    String(province ?? "").trim() ? `(${String(province).trim()})` : "",
  ].filter(Boolean);
  const line = parts.join(", ").replace(/,\s*\(/, " (");
  return line || String(legacy ?? "").trim();
}

export function normalizeProfile(profile = {}) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  p.employerName = formatPersonName(p.employerSurname, p.employerFirstName, p.employerName);
  p.workerName = formatPersonName(p.workerSurname, p.workerFirstName, p.workerName);
  p.employerAddress = formatStructuredAddress({
    street: p.employerStreet,
    fraction: p.employerFraction,
    city: p.employerCity,
    province: p.employerProvince,
    cap: p.employerCap,
    legacy: p.employerAddress,
  });
  return p;
}

export function migrateLegacyProfile(profile = {}) {
  const p = { ...profile };
  if (!p.employerSurname && !p.employerFirstName && p.employerName) {
    const parts = String(p.employerName).trim().split(/\s+/);
    if (parts.length >= 2) {
      p.employerSurname = parts[0];
      p.employerFirstName = parts.slice(1).join(" ");
    } else {
      p.employerFirstName = p.employerName;
    }
  }
  if (!p.workerSurname && !p.workerFirstName && p.workerName) {
    const parts = String(p.workerName).trim().split(/\s+/);
    if (parts.length >= 2) {
      p.workerSurname = parts[0];
      p.workerFirstName = parts.slice(1).join(" ");
    } else {
      p.workerFirstName = p.workerName;
    }
  }
  if (!p.employerStreet && p.employerAddress) {
    p.employerStreet = p.employerAddress;
  }
  return normalizeProfile(p);
}

export function defaultBoardLodging(contractType) {
  return contractType === "convivente" ? "SI" : "NO";
}

export function defaultCohabitation(contractType) {
  return contractType === "convivente" ? "SI" : "NO";
}
