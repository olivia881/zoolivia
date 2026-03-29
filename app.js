const STORAGE_KEY = "turni_servizio_v1";

const shiftForm = document.getElementById("shiftForm");
const repeatWeeklyInput = document.getElementById("repeatWeekly");
const repeatCountWrapper = document.getElementById("repeatCountWrapper");
const repeatCountInput = document.getElementById("repeatCount");
const formMessage = document.getElementById("formMessage");
const shiftTableBody = document.getElementById("shiftTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const personFilter = document.getElementById("personFilter");
const serviceFilter = document.getElementById("serviceFilter");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const resetFiltersBtn = document.getElementById("resetFilters");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");
const clearAllBtn = document.getElementById("clearAllBtn");

const todayCountEl = document.getElementById("todayCount");
const tomorrowCountEl = document.getElementById("tomorrowCount");
const nextWeekCountEl = document.getElementById("nextWeekCount");
const nextShiftEl = document.getElementById("nextShift");

let shifts = loadShifts();
let editingId = null;

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function isoDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function parseDateTime(shift) {
  return new Date(`${shift.date}T${shift.startTime}:00`);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function showMessage(message, type = "success") {
  formMessage.textContent = message;
  formMessage.classList.remove("success", "error");
  formMessage.classList.add(type);
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.classList.remove("success", "error");
}

function loadShifts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidShift).sort(sortByDateTime);
  } catch (error) {
    return [];
  }
}

function saveShifts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
}

function sortByDateTime(a, b) {
  return parseDateTime(a) - parseDateTime(b);
}

function isValidShift(item) {
  if (!item || typeof item !== "object") return false;

  const requiredText = ["id", "date", "startTime", "endTime", "person", "service"];
  const missing = requiredText.some(
    (key) => typeof item[key] !== "string" || item[key].trim() === "",
  );
  if (missing) return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
  if (!/^\d{2}:\d{2}$/.test(item.startTime)) return false;
  if (!/^\d{2}:\d{2}$/.test(item.endTime)) return false;

  return true;
}

function getFormShift() {
  const date = document.getElementById("date").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const person = document.getElementById("person").value.trim();
  const service = document.getElementById("service").value.trim();
  const location = document.getElementById("location").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!date || !startTime || !endTime || !person || !service) {
    return { error: "Compila tutti i campi obbligatori." };
  }

  if (endTime <= startTime) {
    return { error: "L'ora di fine deve essere successiva all'ora di inizio." };
  }

  return {
    value: {
      date,
      startTime,
      endTime,
      person,
      service,
      location,
      notes,
    },
  };
}

function fillFilters(data) {
  const people = [...new Set(data.map((s) => s.person))].sort((a, b) =>
    a.localeCompare(b, "it"),
  );
  const services = [...new Set(data.map((s) => s.service))].sort((a, b) =>
    a.localeCompare(b, "it"),
  );

  const selectedPerson = personFilter.value;
  const selectedService = serviceFilter.value;

  personFilter.innerHTML = `<option value="">Tutte</option>${people
    .map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
    .join("")}`;
  serviceFilter.innerHTML = `<option value="">Tutti</option>${services
    .map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`)
    .join("")}`;

  if (people.includes(selectedPerson)) personFilter.value = selectedPerson;
  if (services.includes(selectedService)) serviceFilter.value = selectedService;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredShifts() {
  const query = searchInput.value.trim().toLowerCase();
  const person = personFilter.value;
  const service = serviceFilter.value;
  const from = fromDateInput.value;
  const to = toDateInput.value;

  return shifts.filter((shift) => {
    if (person && shift.person !== person) return false;
    if (service && shift.service !== service) return false;
    if (from && shift.date < from) return false;
    if (to && shift.date > to) return false;

    if (!query) return true;
    const haystack = [shift.person, shift.service, shift.location || "", shift.notes || ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function renderTable() {
  const filtered = getFilteredShifts();
  shiftTableBody.innerHTML = filtered
    .map(
      (shift) => `
      <tr>
        <td>${formatDate(shift.date)}</td>
        <td>${shift.startTime} - ${shift.endTime}</td>
        <td>${escapeHtml(shift.person)}</td>
        <td>${escapeHtml(shift.service)}</td>
        <td>${escapeHtml(shift.location || "-")}</td>
        <td>${escapeHtml(shift.notes || "-")}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="icon-btn secondary" data-action="edit" data-id="${
              shift.id
            }">Modifica</button>
            <button type="button" class="icon-btn danger" data-action="delete" data-id="${
              shift.id
            }">Elimina</button>
          </div>
        </td>
      </tr>`,
    )
    .join("");

  emptyState.style.display = filtered.length === 0 ? "block" : "none";
}

function renderStats() {
  const now = new Date();
  const today = isoDate(now);
  const tomorrow = isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayCount = shifts.filter((s) => s.date === today).length;
  const tomorrowCount = shifts.filter((s) => s.date === tomorrow).length;
  const nextWeekCount = shifts.filter((s) => {
    const shiftDate = new Date(`${s.date}T00:00:00`);
    return shiftDate >= new Date(`${today}T00:00:00`) && shiftDate <= nextWeek;
  }).length;

  const upcoming = shifts
    .filter((s) => parseDateTime(s) >= now)
    .sort(sortByDateTime)[0];

  todayCountEl.textContent = `${todayCount} turn${todayCount === 1 ? "o" : "i"}`;
  tomorrowCountEl.textContent = `${tomorrowCount} turn${tomorrowCount === 1 ? "o" : "i"}`;
  nextWeekCountEl.textContent = `${nextWeekCount} turn${nextWeekCount === 1 ? "o" : "i"}`;
  nextShiftEl.textContent = upcoming
    ? `${formatDateTime(parseDateTime(upcoming))} · ${upcoming.person} (${upcoming.service})`
    : "Nessun turno programmato";
}

function renderAll() {
  shifts.sort(sortByDateTime);
  fillFilters(shifts);
  renderTable();
  renderStats();
}

function resetForm() {
  shiftForm.reset();
  editingId = null;
  repeatCountWrapper.classList.add("hidden");
  repeatCountInput.value = "4";
}

function addShift(shiftData) {
  shifts.push({
    id: uid(),
    ...shiftData,
  });
}

function addRepeatedShifts(baseShift, repeatCount) {
  for (let i = 0; i <= repeatCount; i += 1) {
    const date = new Date(`${baseShift.date}T00:00:00`);
    date.setDate(date.getDate() + 7 * i);
    addShift({
      ...baseShift,
      date: isoDate(date),
    });
  }
}

function setFormFromShift(shift) {
  document.getElementById("date").value = shift.date;
  document.getElementById("startTime").value = shift.startTime;
  document.getElementById("endTime").value = shift.endTime;
  document.getElementById("person").value = shift.person;
  document.getElementById("service").value = shift.service;
  document.getElementById("location").value = shift.location || "";
  document.getElementById("notes").value = shift.notes || "";
}

function onSubmit(event) {
  event.preventDefault();
  clearMessage();

  const formShift = getFormShift();
  if (formShift.error) {
    showMessage(formShift.error, "error");
    return;
  }

  const data = formShift.value;

  if (editingId) {
    const idx = shifts.findIndex((s) => s.id === editingId);
    if (idx === -1) {
      showMessage("Turno da modificare non trovato.", "error");
      return;
    }

    shifts[idx] = { ...shifts[idx], ...data };
    saveShifts();
    renderAll();
    showMessage("Turno aggiornato con successo.");
    resetForm();
    return;
  }

  const repeatWeekly = repeatWeeklyInput.checked;
  if (repeatWeekly) {
    const repeatCount = Number(repeatCountInput.value);
    if (!Number.isInteger(repeatCount) || repeatCount < 1 || repeatCount > 52) {
      showMessage("Il numero di ripetizioni deve essere tra 1 e 52.", "error");
      return;
    }

    addRepeatedShifts(data, repeatCount);
    showMessage(`Turni aggiunti: ${repeatCount + 1} occorrenze create.`);
  } else {
    addShift(data);
    showMessage("Turno aggiunto con successo.");
  }

  saveShifts();
  renderAll();
  resetForm();
}

function onTableClick(event) {
  const target = event.target.closest("button[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  const shift = shifts.find((s) => s.id === id);
  if (!shift) return;

  if (action === "delete") {
    const confirmed = window.confirm("Eliminare questo turno?");
    if (!confirmed) return;

    shifts = shifts.filter((s) => s.id !== id);
    saveShifts();
    renderAll();
    clearMessage();
    return;
  }

  if (action === "edit") {
    editingId = id;
    setFormFromShift(shift);
    showMessage("Modifica in corso: aggiorna i campi e salva.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function exportJson() {
  const payload = JSON.stringify(shifts, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `turni-servizio-${isoDate(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importJson(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("Formato non valido");
    }

    const valid = parsed.filter(isValidShift).map((s) => ({
      id: s.id || uid(),
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      person: s.person.trim(),
      service: s.service.trim(),
      location: typeof s.location === "string" ? s.location.trim() : "",
      notes: typeof s.notes === "string" ? s.notes.trim() : "",
    }));

    shifts = valid.sort(sortByDateTime);
    saveShifts();
    renderAll();
    showMessage(`Import completato: ${valid.length} turni caricati.`);
  } catch (error) {
    showMessage("Impossibile importare il file JSON.", "error");
  } finally {
    importFileInput.value = "";
  }
}

function resetFilters() {
  searchInput.value = "";
  personFilter.value = "";
  serviceFilter.value = "";
  fromDateInput.value = "";
  toDateInput.value = "";
  renderTable();
}

function onRepeatToggle() {
  repeatCountWrapper.classList.toggle("hidden", !repeatWeeklyInput.checked);
}

function onClearAll() {
  if (!shifts.length) return;
  const confirmed = window.confirm(
    "Sei sicuro di voler cancellare tutti i turni? L'operazione non è reversibile.",
  );
  if (!confirmed) return;

  shifts = [];
  saveShifts();
  renderAll();
  clearMessage();
}

function setupEvents() {
  shiftForm.addEventListener("submit", onSubmit);
  repeatWeeklyInput.addEventListener("change", onRepeatToggle);
  shiftTableBody.addEventListener("click", onTableClick);
  searchInput.addEventListener("input", renderTable);
  personFilter.addEventListener("change", renderTable);
  serviceFilter.addEventListener("change", renderTable);
  fromDateInput.addEventListener("change", renderTable);
  toDateInput.addEventListener("change", renderTable);
  resetFiltersBtn.addEventListener("click", resetFilters);
  exportBtn.addEventListener("click", exportJson);
  clearAllBtn.addEventListener("click", onClearAll);
  importFileInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    importJson(file);
  });
}

setupEvents();
renderAll();
