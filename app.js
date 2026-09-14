/* ═══════════════════════════════════════════════
   Revilist — app.js
   Vanilla JS, no dependencies.
   All data persisted via localStorage.
═══════════════════════════════════════════════ */

'use strict';

/* ─── Storage helpers ───────────────────────── */
const store = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ─── Keys ──────────────────────────────────── */
const KEY = {
  name:       'rvl_name',
  theme:      'rvl_theme',
  tasks:      'rvl_tasks',
  links:      'rvl_links',
  timerFocus: 'rvl_timer_focus',
  timerBreak: 'rvl_timer_break',
};

/* ══════════════════════════════════════════════
   THEME
══════════════════════════════════════════════ */
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon      = document.getElementById('theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set(KEY.theme, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

themeToggleBtn.addEventListener('click', toggleTheme);
applyTheme(store.get(KEY.theme, 'light'));

/* ══════════════════════════════════════════════
   GREETING / NAME
══════════════════════════════════════════════ */
const nameOverlay   = document.getElementById('name-overlay');
const nameInput     = document.getElementById('name-input');
const nameSaveBtn   = document.getElementById('name-save-btn');
const nameError     = document.getElementById('name-error');
const greetingText  = document.getElementById('greeting-text');
const dateDisplay   = document.getElementById('date-display');
const editNameBtn   = document.getElementById('edit-name-btn');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function renderGreeting(name) {
  greetingText.textContent = `${getGreeting()}, ${name}! 👋`;
}

function renderDate() {
  const now = new Date();
  dateDisplay.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function saveName() {
  const name = nameInput.value.trim();
  if (!name) {
    nameError.classList.remove('hidden');
    nameInput.focus();
    return;
  }
  nameError.classList.add('hidden');
  store.set(KEY.name, name);
  renderGreeting(name);
  nameOverlay.classList.add('hidden');
}

nameSaveBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
editNameBtn.addEventListener('click', () => {
  const current = store.get(KEY.name, '');
  nameInput.value = current;
  nameError.classList.add('hidden');
  nameOverlay.classList.remove('hidden');
  nameInput.focus();
});

// Init
(function initGreeting() {
  renderDate();
  const name = store.get(KEY.name);
  if (!name) {
    nameOverlay.classList.remove('hidden');
    nameInput.focus();
  } else {
    renderGreeting(name);
  }
})();

/* ══════════════════════════════════════════════
   FOCUS TIMER
══════════════════════════════════════════════ */
const timerClock        = document.getElementById('timer-clock');
const timerModeLabel    = document.getElementById('timer-mode-label');
const timerToggleBtn    = document.getElementById('timer-toggle-btn');
const timerResetBtn     = document.getElementById('timer-reset-btn');
const timerSettingsBtn  = document.getElementById('timer-settings-btn');
const timerSettingsPanel= document.getElementById('timer-settings');
const pomodoroInput     = document.getElementById('pomodoro-input');
const breakInput        = document.getElementById('break-input');
const timerSettingsSave = document.getElementById('timer-settings-save');

let timerInterval  = null;
let timerRunning   = false;
let timerMode      = 'focus'; // 'focus' | 'break'
let secondsLeft    = 0;

function getFocusMins()  { return store.get(KEY.timerFocus, 25); }
function getBreakMins()  { return store.get(KEY.timerBreak, 5);  }

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updateClockDisplay() {
  timerClock.textContent = formatTime(secondsLeft);
}

function setTimerModeUI(mode) {
  timerMode = mode;
  if (mode === 'focus') {
    timerModeLabel.textContent = 'Focus';
    timerClock.className = 'timer-clock' + (timerRunning ? ' running' : '');
    secondsLeft = getFocusMins() * 60;
  } else {
    timerModeLabel.textContent = 'Break';
    timerClock.className = 'timer-clock break';
    secondsLeft = getBreakMins() * 60;
  }
  updateClockDisplay();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  timerToggleBtn.textContent  = '▶ Start';
  timerToggleBtn.className    = 'btn btn-start';
  timerClock.classList.remove('running');
  if (timerMode === 'focus') timerClock.classList.remove('break');
}

function startTimer() {
  timerRunning = true;
  timerToggleBtn.textContent  = '⏹ Stop';
  timerToggleBtn.className    = 'btn btn-stop';
  timerClock.classList.add('running');

  timerInterval = setInterval(() => {
    secondsLeft--;
    updateClockDisplay();

    if (secondsLeft <= 0) {
      stopTimer();
      // Auto-switch mode and notify
      if (timerMode === 'focus') {
        notifyUser('Focus session done! Take a break 🎉');
        setTimerModeUI('break');
      } else {
        notifyUser('Break over! Back to focus 💪');
        setTimerModeUI('focus');
      }
    }
  }, 1000);
}

function notifyUser(msg) {
  if (Notification && Notification.permission === 'granted') {
    new Notification('Revilist', { body: msg, icon: '' });
  } else {
    // Fallback: brief visual flash
    const banner = document.createElement('div');
    banner.textContent = msg;
    Object.assign(banner.style, {
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--primary)', color: '#fff',
      padding: '.7rem 1.4rem', borderRadius: '999px',
      fontWeight: '700', fontSize: '.9rem',
      boxShadow: '0 4px 20px rgba(0,0,0,.25)',
      zIndex: '999', animation: 'fadeIn .3s ease'
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
  }
}

timerToggleBtn.addEventListener('click', () => {
  if (timerRunning) {
    stopTimer();
  } else {
    if (secondsLeft === 0) setTimerModeUI(timerMode); // re-init if at 0
    startTimer();
  }
});

timerResetBtn.addEventListener('click', () => {
  stopTimer();
  setTimerModeUI('focus');
});

timerSettingsBtn.addEventListener('click', () => {
  pomodoroInput.value = getFocusMins();
  breakInput.value    = getBreakMins();
  timerSettingsPanel.classList.toggle('hidden');
});

timerSettingsSave.addEventListener('click', () => {
  const f = Math.max(1, Math.min(120, parseInt(pomodoroInput.value) || 25));
  const b = Math.max(1, Math.min(30,  parseInt(breakInput.value)    || 5));
  store.set(KEY.timerFocus, f);
  store.set(KEY.timerBreak, b);
  pomodoroInput.value = f;
  breakInput.value    = b;
  timerSettingsPanel.classList.add('hidden');
  // Reset with new duration
  stopTimer();
  setTimerModeUI('focus');
});

// Request notification permission once
if (Notification && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Init timer
setTimerModeUI('focus');

/* ══════════════════════════════════════════════
   TO-DO LIST
══════════════════════════════════════════════ */
const todoForm      = document.getElementById('todo-form');
const todoInput     = document.getElementById('todo-input');
const todoDeadline  = document.getElementById('todo-deadline');
const todoError     = document.getElementById('todo-error');
const todoListEl    = document.getElementById('todo-list');
const todoEmpty     = document.getElementById('todo-empty');
const sortSelect    = document.getElementById('sort-select');

// Edit modal
const editOverlay       = document.getElementById('edit-overlay');
const editTaskInput     = document.getElementById('edit-task-input');
const editTaskDeadline  = document.getElementById('edit-task-deadline');
const editSaveBtn       = document.getElementById('edit-save-btn');
const editCancelBtn     = document.getElementById('edit-cancel-btn');
const editError         = document.getElementById('edit-error');

let tasks       = store.get(KEY.tasks, []);
let editingId   = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveTasks() {
  store.set(KEY.tasks, tasks);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function deadlineLabel(dateStr, done) {
  if (!dateStr) return null;
  const today = todayStr();
  if (dateStr < today && !done) return { text: `⚠ ${formatDeadline(dateStr)} (overdue)`, cls: 'overdue' };
  if (dateStr === today)         return { text: `📅 Today`,                               cls: 'today'  };
  return { text: `📅 ${formatDeadline(dateStr)}`,                                         cls: ''       };
}

function formatDeadline(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSortedTasks() {
  const mode = sortSelect.value;
  const copy = [...tasks];
  if (mode === 'deadline') {
    copy.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
  } else if (mode === 'status') {
    copy.sort((a, b) => Number(a.done) - Number(b.done));
  }
  return copy;
}

function renderTasks() {
  const sorted = getSortedTasks();
  todoListEl.innerHTML = '';

  if (sorted.length === 0) {
    todoEmpty.classList.remove('hidden');
    return;
  }
  todoEmpty.classList.add('hidden');

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    const dl = deadlineLabel(task.deadline, task.done);

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" aria-label="Mark done" ${task.done ? 'checked' : ''} />
      <div class="task-body">
        <span class="task-text">${escapeHtml(task.text)}</span>
        ${dl ? `<div class="task-deadline ${dl.cls}">${dl.text}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="icon-btn edit-btn" title="Edit task" aria-label="Edit task">✏️</button>
        <button class="icon-btn delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector('.todo-checkbox').addEventListener('change', () => {
      const t = tasks.find(t => t.id === task.id);
      if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
    });

    // Edit
    li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));

    // Delete
    li.querySelector('.delete-btn').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    todoListEl.appendChild(li);
  });
}

function isDuplicateTask(text, excludeId = null) {
  const norm = text.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.text.trim().toLowerCase() === norm);
}

todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  if (isDuplicateTask(text)) {
    todoError.textContent = 'Task already exists.';
    todoError.classList.remove('hidden');
    todoInput.focus();
    return;
  }
  todoError.classList.add('hidden');

  tasks.push({ id: generateId(), text, deadline: todoDeadline.value || '', done: false });
  saveTasks();
  renderTasks();
  todoInput.value    = '';
  todoDeadline.value = '';
  todoInput.focus();
});

todoInput.addEventListener('input', () => todoError.classList.add('hidden'));
sortSelect.addEventListener('change', renderTasks);

// Edit modal
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId              = id;
  editTaskInput.value    = task.text;
  editTaskDeadline.value = task.deadline || '';
  editError.classList.add('hidden');
  editOverlay.classList.remove('hidden');
  editTaskInput.focus();
}

function closeEditModal() {
  editOverlay.classList.add('hidden');
  editingId = null;
}

editSaveBtn.addEventListener('click', () => {
  const newText = editTaskInput.value.trim();
  if (!newText) return;

  if (isDuplicateTask(newText, editingId)) {
    editError.classList.remove('hidden');
    editTaskInput.focus();
    return;
  }
  editError.classList.add('hidden');

  const task = tasks.find(t => t.id === editingId);
  if (task) {
    task.text     = newText;
    task.deadline = editTaskDeadline.value || '';
    saveTasks();
    renderTasks();
  }
  closeEditModal();
});

editCancelBtn.addEventListener('click', closeEditModal);

editTaskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') editSaveBtn.click();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal on overlay backdrop click
editOverlay.addEventListener('click', e => { if (e.target === editOverlay) closeEditModal(); });

renderTasks();

/* ══════════════════════════════════════════════
   SAVED LINKS
══════════════════════════════════════════════ */
const linkForm      = document.getElementById('link-form');
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkError     = document.getElementById('link-error');
const linkListEl    = document.getElementById('link-list');
const linkEmpty     = document.getElementById('link-empty');

let links = store.get(KEY.links, []);

function saveLinks() {
  store.set(KEY.links, links);
}

function isValidUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

function renderLinks() {
  linkListEl.innerHTML = '';
  if (links.length === 0) {
    linkEmpty.classList.remove('hidden');
    return;
  }
  linkEmpty.classList.add('hidden');

  links.forEach(link => {
    const li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.id = link.id;

    // Build a short URL preview (hostname only)
    let hostPreview = '';
    try { hostPreview = new URL(link.url).hostname; } catch {}

    li.innerHTML = `
      <a class="link-anchor" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(link.name)}
      </a>
      <span class="link-url-preview">${escapeHtml(hostPreview)}</span>
      <button class="icon-btn delete-link-btn" title="Delete link" aria-label="Delete link">🗑️</button>
    `;

    li.querySelector('.delete-link-btn').addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    linkListEl.appendChild(li);
  });
}

linkForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (!name || !isValidUrl(url)) {
    linkError.classList.remove('hidden');
    return;
  }
  linkError.classList.add('hidden');

  links.push({ id: generateId(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
});

linkNameInput.addEventListener('input', () => linkError.classList.add('hidden'));
linkUrlInput.addEventListener('input',  () => linkError.classList.add('hidden'));

renderLinks();

/* ─── Helpers ───────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  // Only allow http/https to prevent javascript: URIs
  try {
    const u = new URL(str);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '#';
  } catch { return '#'; }
  return escapeHtml(str);
}
