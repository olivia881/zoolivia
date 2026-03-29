const STORAGE_KEY = "waste-reminder-settings";
const WEEK_DAYS = [
  "domenica",
  "lunedi",
  "martedi",
  "mercoledi",
  "giovedi",
  "venerdi",
  "sabato",
];

const DAY_LABELS = {
  domenica: "Domenica",
  lunedi: "Lunedi",
  martedi: "Martedi",
  mercoledi: "Mercoledi",
  giovedi: "Giovedi",
  venerdi: "Venerdi",
  sabato: "Sabato",
};

const WASTE_TYPES = [
  {
    key: "indifferenziata",
    title: "Indifferenziata",
    description: "Sacchetto del secco residuo.",
    color: "#4f46e5",
    icon: "I",
  },
  {
    key: "organico",
    title: "Organico",
    description: "Scarti alimentari e compostabili.",
    color: "#15803d",
    icon: "O",
  },
  {
    key: "plastica",
    title: "Plastica e lattine",
    description: "Imballaggi in plastica, metalli e lattine.",
    color: "#ea580c",
    icon: "P",
  },
  {
    key: "carta",
    title: "Carta",
    description: "Carta, cartone e cartoncino puliti.",
    color: "#0284c7",
    icon: "C",
  },
  {
    key: "vetro",
    title: "Vetro",
    description: "Bottiglie e contenitori in vetro.",
    color: "#9333ea",
    icon: "V",
  },
];

const DEFAULT_SETTINGS = {
  schedule: {
    lunedi: ["organico"],
    martedi: ["carta"],
    mercoledi: ["organico", "plastica"],
    giovedi: [],
    venerdi: ["organico", "vetro"],
    sabato: ["indifferenziata"],
    domenica: [],
  },
  notificationTime: "20:00",
  notifyOnlyWhenNeeded: true,
  remindersEnabled: false,
  lastNotificationKey: "",
};

const todayLabel = document.querySelector("#todayLabel");
const todayBadge = document.querySelector("#todayBadge");
const todayContent = document.querySelector("#todayContent");
const tomorrowLabel = document.querySelector("#tomorrowLabel");
const tomorrowContent = document.querySelector("#tomorrowContent");
const scheduleForm = document.querySelector("#scheduleForm");
const notificationForm = document.querySelector("#notificationForm");
const notificationTimeInput = document.querySelector("#notificationTime");
const notifyOnlyWhenNeededInput = document.querySelector("#notifyOnlyWhenNeeded");
const notificationStatus = document.querySelector("#notificationStatus");
const enableReminderButton = document.querySelector("#enableReminderButton");
const testNotificationButton = document.querySelector("#testNotificationButton");
const resetScheduleButton = document.querySelector("#resetScheduleButton");
const wasteCardTemplate = document.querySelector("#wasteCardTemplate");

let settings = loadSettings();

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return deepClone(DEFAULT_SETTINGS);
    }

    const parsed = JSON.parse(raw);

    return {
      ...deepClone(DEFAULT_SETTINGS),
      ...parsed,
      schedule: {
        ...deepClone(DEFAULT_SETTINGS).schedule,
        ...(parsed.schedule || {}),
      },
    };
  } catch (error) {
    console.warn("Impossibile leggere le impostazioni salvate.", error);
    return deepClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getDayKey(date) {
  return WEEK_DAYS[date.getDay()];
}

function getLongDateLabel(date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function capitalize(text) {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeWasteItems(items) {
  return items
    .map((key) => WASTE_TYPES.find((item) => item.key === key))
    .filter(Boolean);
}

function renderWasteList(container, dayKey) {
  const wasteItems = normalizeWasteItems(settings.schedule[dayKey] || []);
  container.innerHTML = "";

  if (!wasteItems.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Nessun conferimento previsto.";
    container.append(emptyState);
    return wasteItems;
  }

  wasteItems.forEach((item) => {
    const card = wasteCardTemplate.content.firstElementChild.cloneNode(true);
    const token = card.querySelector(".waste-token");
    const title = card.querySelector("h3");
    const copy = card.querySelector("p");

    token.textContent = item.icon;
    token.style.backgroundColor = item.color;
    title.textContent = item.title;
    copy.textContent = item.description;
    card.style.borderColor = item.color;

    container.append(card);
  });

  return wasteItems;
}

function renderTodayAndTomorrow() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const todayKey = getDayKey(now);
  const tomorrowKey = getDayKey(tomorrow);
  const todayItems = renderWasteList(todayContent, todayKey);

  todayLabel.textContent = capitalize(getLongDateLabel(now));
  tomorrowLabel.textContent = capitalize(getLongDateLabel(tomorrow));
  renderWasteList(tomorrowContent, tomorrowKey);

  if (todayItems.length) {
    todayBadge.textContent =
      todayItems.length === 1 ? "1 raccolta prevista" : `${todayItems.length} raccolte previste`;
    todayBadge.className = "badge success";
  } else {
    todayBadge.textContent = "Nessun rifiuto";
    todayBadge.className = "badge neutral";
  }
}

function updateDaySelection(dayKey, wasteKey, isChecked) {
  const selected = new Set(settings.schedule[dayKey] || []);

  if (isChecked) {
    selected.add(wasteKey);
  } else {
    selected.delete(wasteKey);
  }

  settings.schedule[dayKey] = WASTE_TYPES.map((item) => item.key).filter((key) =>
    selected.has(key)
  );

  saveSettings();
  renderTodayAndTomorrow();
  setStatus(`Programma aggiornato per ${DAY_LABELS[dayKey]}.`, "success");
}

function createWasteCheckbox(dayKey, item) {
  const label = document.createElement("label");
  label.className = "checkbox-card";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = `${dayKey}-${item.key}`;
  input.value = item.key;
  input.checked = (settings.schedule[dayKey] || []).includes(item.key);
  input.addEventListener("change", () => {
    updateDaySelection(dayKey, item.key, input.checked);
  });

  const copy = document.createElement("span");
  copy.className = "checkbox-copy";
  copy.innerHTML = `<strong>${item.title}</strong><span>${item.description}</span>`;

  label.append(input, copy);
  return label;
}

function renderScheduleForm() {
  scheduleForm.innerHTML = "";

  WEEK_DAYS.forEach((dayKey) => {
    const wrapper = document.createElement("section");
    wrapper.className = "day-editor";

    const header = document.createElement("div");
    header.className = "day-editor-header";

    const title = document.createElement("h3");
    title.textContent = DAY_LABELS[dayKey];

    const note = document.createElement("p");
    note.className = "day-note";
    note.textContent = "Seleziona una o piu tipologie di raccolta.";

    header.append(title, note);

    const checklist = document.createElement("div");
    checklist.className = "day-checklist";
    WASTE_TYPES.forEach((item) => {
      checklist.append(createWasteCheckbox(dayKey, item));
    });

    wrapper.append(header, checklist);
    scheduleForm.append(wrapper);
  });
}

function setStatus(message, tone = "info") {
  notificationStatus.textContent = message;
  notificationStatus.dataset.tone = tone;
}

function updateReminderButton() {
  if (!("Notification" in window)) {
    enableReminderButton.disabled = true;
    enableReminderButton.textContent = "Notifiche non supportate";
    return;
  }

  if (settings.remindersEnabled && window.Notification.permission === "granted") {
    enableReminderButton.textContent = "Promemoria attivo";
    enableReminderButton.disabled = true;
    return;
  }

  enableReminderButton.textContent = "Attiva promemoria browser";
  enableReminderButton.disabled = false;
}

function syncNotificationForm() {
  notificationTimeInput.value = settings.notificationTime;
  notifyOnlyWhenNeededInput.checked = settings.notifyOnlyWhenNeeded;
  updateReminderButton();
}

async function enableReminders() {
  if (!("Notification" in window)) {
    setStatus("Questo browser non supporta le notifiche.", "warning");
    return;
  }

  const permission = await window.Notification.requestPermission();
  if (permission !== "granted") {
    settings.remindersEnabled = false;
    saveSettings();
    updateReminderButton();
    setStatus("Permesso notifiche non concesso.", "warning");
    return;
  }

  settings.remindersEnabled = true;
  saveSettings();
  updateReminderButton();
  setStatus(
    "Promemoria attivato. Lascia la pagina aperta per ricevere l'avviso all'orario scelto.",
    "success"
  );
  maybeSendReminder();
}

function sendTestNotification() {
  if (!("Notification" in window)) {
    setStatus("Questo browser non supporta le notifiche.", "warning");
    return;
  }

  if (window.Notification.permission !== "granted") {
    setStatus("Attiva prima i promemoria browser per inviare una prova.", "warning");
    return;
  }

  const todayItems = normalizeWasteItems(settings.schedule[getDayKey(new Date())] || []);
  const body = todayItems.length
    ? `Prova riuscita. Oggi hai: ${todayItems.map((item) => item.title).join(", ")}.`
    : "Prova riuscita. Oggi non ci sono conferimenti previsti.";

  new window.Notification("Notifica di prova", { body });
  setStatus("Notifica di prova inviata.", "success");
}

function buildNotificationPayload(dayKey) {
  const items = normalizeWasteItems(settings.schedule[dayKey] || []);

  if (!items.length) {
    return {
      title: "Promemoria rifiuti",
      body: "Oggi non ci sono conferimenti previsti.",
    };
  }

  return {
    title: "Promemoria rifiuti di oggi",
    body: `Da portare fuori: ${items.map((item) => item.title).join(", ")}.`,
  };
}

function maybeSendReminder() {
  if (!settings.remindersEnabled || !("Notification" in window)) {
    return;
  }

  if (window.Notification.permission !== "granted") {
    return;
  }

  const now = new Date();
  const [hours, minutes] = settings.notificationTime.split(":").map(Number);
  const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const isRightMinute = now.getHours() === hours && now.getMinutes() === minutes;

  if (!isRightMinute || settings.lastNotificationKey === currentKey) {
    return;
  }

  const dayKey = getDayKey(now);
  const items = normalizeWasteItems(settings.schedule[dayKey] || []);

  if (settings.notifyOnlyWhenNeeded && items.length === 0) {
    settings.lastNotificationKey = currentKey;
    saveSettings();
    return;
  }

  const payload = buildNotificationPayload(dayKey);
  new window.Notification(payload.title, { body: payload.body });
  settings.lastNotificationKey = currentKey;
  saveSettings();
}

function resetSchedule() {
  settings = deepClone(DEFAULT_SETTINGS);
  saveSettings();
  renderTodayAndTomorrow();
  renderScheduleForm();
  syncNotificationForm();
  setStatus("Calendario di esempio ripristinato.", "success");
}

notificationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings.notificationTime = notificationTimeInput.value;
  settings.notifyOnlyWhenNeeded = notifyOnlyWhenNeededInput.checked;
  saveSettings();
  setStatus("Preferenze salvate correttamente.", "success");
  maybeSendReminder();
});

enableReminderButton.addEventListener("click", () => {
  enableReminders();
});

testNotificationButton.addEventListener("click", () => {
  sendTestNotification();
});

resetScheduleButton.addEventListener("click", () => {
  resetSchedule();
});

renderTodayAndTomorrow();
renderScheduleForm();
syncNotificationForm();
setStatus(
  "Personalizza il calendario e scegli l'ora in cui vuoi essere avvisato.",
  "info"
);
maybeSendReminder();
window.setInterval(maybeSendReminder, 30 * 1000);
