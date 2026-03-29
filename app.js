(function () {
    'use strict';

    const WASTE_TYPES = {
        organico:           { label: 'Organico',           icon: '🍌', color: '#4caf50' },
        plastica:           { label: 'Plastica',           icon: '🧴', color: '#ffc107' },
        carta:              { label: 'Carta',              icon: '📦', color: '#2196f3' },
        vetro:              { label: 'Vetro',              icon: '🍾', color: '#00bcd4' },
        indifferenziato:    { label: 'Indifferenziato',    icon: '🗑️', color: '#9e9e9e' },
        verde:              { label: 'Sfalci / Verde',     icon: '🌿', color: '#66bb6a' },
        raee:               { label: 'RAEE / Elettronici', icon: '🔌', color: '#ff5722' },
        ingombranti:        { label: 'Ingombranti',        icon: '🛋️', color: '#795548' },
    };

    const DAY_NAMES_FULL = [
        'Domenica', 'Lunedì', 'Martedì', 'Mercoledì',
        'Giovedì', 'Venerdì', 'Sabato'
    ];
    const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

    const MONTH_NAMES = [
        'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
        'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
    ];

    const DEFAULT_SCHEDULE = {
        1: ['organico', 'indifferenziato'],
        2: ['plastica'],
        3: ['organico', 'carta'],
        4: ['vetro'],
        5: ['organico', 'plastica'],
        6: ['indifferenziato'],
        0: [],
    };

    const STORAGE_KEY = 'rifiuti-schedule';

    function loadSchedule() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const schedule = {};
                for (let d = 0; d < 7; d++) {
                    schedule[d] = Array.isArray(parsed[d]) ? parsed[d] : (DEFAULT_SCHEDULE[d] || []);
                }
                return schedule;
            }
        } catch (e) { /* ignore */ }
        return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    }

    function saveSchedule(schedule) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    }

    let schedule = loadSchedule();

    function formatDate(date) {
        const day = date.getDate();
        const month = MONTH_NAMES[date.getMonth()];
        const year = date.getFullYear();
        const weekday = DAY_NAMES_FULL[date.getDay()];
        return `${weekday} ${day} ${month} ${year}`;
    }

    function createTag(wasteKey, variant) {
        const info = WASTE_TYPES[wasteKey];
        if (!info) return null;
        const tag = document.createElement('span');
        tag.className = `waste-tag ${variant === 'dark' ? 'waste-tag--dark' : 'waste-tag--light'}`;
        if (variant !== 'dark') {
            tag.style.background = info.color;
            tag.style.color = '#fff';
        }
        tag.innerHTML = `<span class="waste-tag-icon">${info.icon}</span> ${info.label}`;
        return tag;
    }

    function renderTodayCard() {
        const now = new Date();
        const dayIndex = now.getDay();
        const wastes = schedule[dayIndex] || [];

        document.getElementById('today-date').textContent = formatDate(now);

        const container = document.getElementById('today-waste');
        container.innerHTML = '';
        if (wastes.length === 0) {
            const el = document.createElement('span');
            el.className = 'no-waste no-waste--dark';
            el.textContent = 'Nessun rifiuto da conferire oggi 🎉';
            container.appendChild(el);
        } else {
            wastes.forEach(w => {
                const tag = createTag(w, 'dark');
                if (tag) container.appendChild(tag);
            });
        }
    }

    function renderTomorrowCard() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayIndex = tomorrow.getDay();
        const wastes = schedule[dayIndex] || [];

        document.getElementById('tomorrow-date').textContent = formatDate(tomorrow);

        const container = document.getElementById('tomorrow-waste');
        container.innerHTML = '';
        if (wastes.length === 0) {
            const el = document.createElement('span');
            el.className = 'no-waste';
            el.textContent = 'Nessun rifiuto da conferire';
            container.appendChild(el);
        } else {
            wastes.forEach(w => {
                const tag = createTag(w, 'light');
                if (tag) container.appendChild(tag);
            });
        }
    }

    function renderWeekGrid() {
        const now = new Date();
        const todayIndex = now.getDay();
        const grid = document.getElementById('week-grid');
        grid.innerHTML = '';

        const startDay = 1; // Monday
        for (let i = 0; i < 7; i++) {
            const dayIndex = (startDay + i) % 7;
            const wastes = schedule[dayIndex] || [];

            const row = document.createElement('div');
            row.className = 'week-day' + (dayIndex === todayIndex ? ' is-today' : '');

            const nameEl = document.createElement('span');
            nameEl.className = 'week-day-name';
            nameEl.textContent = DAY_NAMES_SHORT[dayIndex];
            row.appendChild(nameEl);

            const tagsEl = document.createElement('div');
            tagsEl.className = 'week-day-tags';
            if (wastes.length === 0) {
                const el = document.createElement('span');
                el.className = 'no-waste';
                el.textContent = '—';
                tagsEl.appendChild(el);
            } else {
                wastes.forEach(w => {
                    const tag = createTag(w, 'light');
                    if (tag) tagsEl.appendChild(tag);
                });
            }
            row.appendChild(tagsEl);
            grid.appendChild(row);
        }
    }

    function renderConfigGrid() {
        const grid = document.getElementById('config-grid');
        grid.innerHTML = '';

        const startDay = 1;
        for (let i = 0; i < 7; i++) {
            const dayIndex = (startDay + i) % 7;
            const wastes = schedule[dayIndex] || [];

            const row = document.createElement('div');
            row.className = 'config-day';
            row.dataset.day = dayIndex;

            const left = document.createElement('div');
            left.className = 'config-day-left';

            const nameEl = document.createElement('span');
            nameEl.className = 'config-day-name';
            nameEl.textContent = DAY_NAMES_SHORT[dayIndex];
            left.appendChild(nameEl);

            const tagsEl = document.createElement('div');
            tagsEl.className = 'config-day-tags';
            if (wastes.length === 0) {
                const el = document.createElement('span');
                el.className = 'no-waste';
                el.textContent = 'Nessuno';
                tagsEl.appendChild(el);
            } else {
                wastes.forEach(w => {
                    const tag = createTag(w, 'light');
                    if (tag) tagsEl.appendChild(tag);
                });
            }
            left.appendChild(tagsEl);
            row.appendChild(left);

            const arrow = document.createElement('span');
            arrow.className = 'config-day-arrow';
            arrow.textContent = '›';
            row.appendChild(arrow);

            row.addEventListener('click', () => openModal(dayIndex));
            grid.appendChild(row);
        }
    }

    /* Modal */
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const btnSave = document.getElementById('btn-save');
    const btnClose = document.getElementById('modal-close');

    let editingDay = null;
    let tempSelection = [];

    function openModal(dayIndex) {
        editingDay = dayIndex;
        tempSelection = [...(schedule[dayIndex] || [])];
        modalTitle.textContent = DAY_NAMES_FULL[dayIndex];
        renderModalOptions();
        overlay.classList.add('active');
    }

    function closeModal() {
        overlay.classList.remove('active');
        editingDay = null;
    }

    function renderModalOptions() {
        modalBody.innerHTML = '';
        Object.entries(WASTE_TYPES).forEach(([key, info]) => {
            const isSelected = tempSelection.includes(key);
            const opt = document.createElement('div');
            opt.className = 'modal-option' + (isSelected ? ' selected' : '');
            opt.innerHTML = `
                <div class="modal-option-check">✓</div>
                <span class="modal-option-icon">${info.icon}</span>
                <span class="modal-option-label">${info.label}</span>
            `;
            opt.addEventListener('click', () => {
                const idx = tempSelection.indexOf(key);
                if (idx >= 0) {
                    tempSelection.splice(idx, 1);
                } else {
                    tempSelection.push(key);
                }
                renderModalOptions();
            });
            modalBody.appendChild(opt);
        });
    }

    btnSave.addEventListener('click', () => {
        if (editingDay !== null) {
            schedule[editingDay] = [...tempSelection];
            saveSchedule(schedule);
            renderAll();
        }
        closeModal();
    });

    btnClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm('Vuoi ripristinare il calendario predefinito?')) {
            schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
            saveSchedule(schedule);
            renderAll();
        }
    });

    function renderAll() {
        renderTodayCard();
        renderTomorrowCard();
        renderWeekGrid();
        renderConfigGrid();
    }

    renderAll();
})();
