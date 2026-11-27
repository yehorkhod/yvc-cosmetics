'use strict';

/* ==========================================================
   YVC Cosmetics — main.js (ЛР4)
   Скрипт підключено в кінці <body> на всіх сторінках,
   тому DOM уже побудовано і чекати DOMContentLoaded не потрібно.
   ========================================================== */

/* ---------- Допоміжні функції ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Обгортка над localStorage: у приватному режимі сховище може бути недоступне
const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* сховище недоступне — просто не зберігаємо */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ігноруємо */
    }
  },
};

const shortDate = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
const longDate = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- 2.2 Поточна дата у футері ---------- */
function showCurrentDate() {
  const el = $('#current-date');
  if (!el) return;
  const now = new Date();
  el.textContent = longDate.format(now);
}

/* ---------- 2.1 Маніпуляція елементами ----------
   Знаходимо всі акційні рядки прайсу (.price-row--promo), змінюємо їм стиль
   і додаємо новий абзац у кінець <main> через createElement() + append(). */
function highlightPromotions() {
  const rows = $$('.price-row--promo');
  if (rows.length === 0) return;

  rows.forEach((row) => {
    row.style.backgroundColor = 'rgba(225, 202, 141, 0.3)';
    row.style.fontWeight = '500';
  });

  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const note = document.createElement('p');
  note.className = 'container note';
  note.style.marginBottom = '48px';
  note.textContent = `Ціни з позначкою «Акція» діють до ${shortDate.format(monthEnd)} включно. ` +
    `Акційних процедур на сторінці: ${rows.length}.`;
  $('main').append(note);
}

/* ---------- 2.2 Акордеон «Показати більше» ---------- */
function initAccordion() {
  const button = $('#more-toggle');
  const block = $('#about-more');
  if (!button || !block) return;

  button.addEventListener('click', () => {
    const willOpen = block.hidden;
    block.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
    button.textContent = willOpen ? 'Показати менше' : 'Показати більше';
  });
}

showCurrentDate();
highlightPromotions();
initAccordion();

/* ---------- 3.1 Перемикач теми (клас dark-theme + localStorage) ---------- */
const THEME_KEY = 'yvc-theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark-theme', isDark);
  const button = $('#theme-toggle');
  if (button) {
    button.setAttribute('aria-pressed', String(isDark));
    button.textContent = isDark ? 'Світла тема' : 'Темна тема';
  }
}

function initTheme() {
  applyTheme(storage.get(THEME_KEY, 'light'));
  const button = $('#theme-toggle');
  if (!button) return;
  button.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark';
    applyTheme(next);
    storage.set(THEME_KEY, next);
  });
}

/* ---------- 3.2 Підсвітка меню при наведенні (JS-класи, не :hover) ---------- */
function initMenuHover() {
  $$('.nav-list a').forEach((link) => {
    const on = () => link.classList.add('is-hovered');
    const off = () => link.classList.remove('is-hovered');
    link.addEventListener('mouseenter', on);
    link.addEventListener('mouseleave', off);
    // те саме для клавіатури, щоб підсвітка працювала й без миші
    link.addEventListener('focus', on);
    link.addEventListener('blur', off);
  });
}

/* ---------- 3.2 Розмір шрифту стрілками ↑ / ↓ ---------- */
const FONT_KEY = 'yvc-font-size';
const FONT_MIN = 12;
const FONT_MAX = 24;
const FONT_STEP = 2;

function showToast(text) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('p');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1500);
}

function setFontSize(size) {
  document.documentElement.style.fontSize = `${size}px`;
}

function initFontSize() {
  let size = storage.get(FONT_KEY, 16);
  setFontSize(size);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // у полях форм стрілки мають працювати як звичайно
    const target = event.target instanceof Element ? event.target : null;
    if (target && target.closest('input, textarea, select, [contenteditable]')) return;

    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? FONT_STEP : -FONT_STEP;
    size = Math.min(FONT_MAX, Math.max(FONT_MIN, size + delta));
    setFontSize(size);
    storage.set(FONT_KEY, size);
    showToast(`Розмір шрифту: ${size}px`);
  });
}

initTheme();
initMenuHover();
initFontSize();

/* ==========================================================
   4. Форми: обробка submit і власна валідація
   ========================================================== */
const USER_KEY = 'yvc-user';
const GUEST_NAME_KEY = 'yvc-guest-name';
const BOOKINGS_KEY = 'yvc-bookings';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;   // є @ і домен із зоною
const PHONE_RE = /^\+?380\d{9}$/;

const getUser = () => storage.get(USER_KEY);
const getBookings = () => storage.get(BOOKINGS_KEY, []);
const saveBookings = (list) => storage.set(BOOKINGS_KEY, list);

// Дата й час у форматі "YYYY-MM-DDTHH:MM" за місцевим часом
function toLocalIso(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fieldValue(field) {
  return field.type === 'checkbox' ? field.checked : field.value.trim();
}

function setError(field, message) {
  const wrap = field.closest('.field');
  wrap.classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');
  const error = $('.field-error', wrap);
  if (error) {
    error.textContent = message;
    field.setAttribute('aria-describedby', error.id);
  }
}

function clearError(field) {
  const wrap = field.closest('.field');
  wrap.classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
}

function showFormMessage(form, text, isError = false) {
  const box = $('.form-message', form);
  if (!box) return;
  box.textContent = text;
  box.classList.toggle('is-error', isError);
}

/**
 * Підключає валідацію до форми.
 * rules: { idПоля: (значення, форма) => 'текст помилки' або '' }
 * onSuccess(data, form) викликається, коли всі поля коректні.
 */
function attachValidation(form, rules, onSuccess) {
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // 4.1 забороняємо стандартну відправку

    let firstInvalid = null;
    for (const [id, check] of Object.entries(rules)) {
      const field = $(`#${id}`, form);
      const message = check(fieldValue(field), form);
      if (message) {
        setError(field, message);
        firstInvalid = firstInvalid || field;
      } else {
        clearError(field);
      }
    }

    if (firstInvalid) {
      showFormMessage(form, 'Перевірте виділені поля.', true);
      firstInvalid.focus();
      return;
    }

    // 4.1 зчитуємо всі поля форми й виводимо в консоль
    const data = Object.fromEntries(new FormData(form));
    console.log(`Форма #${form.id}:`, data);
    onSuccess(data, form);
  });

  // Після першої помилки перевіряємо поле одразу під час введення
  form.addEventListener('input', (event) => {
    const field = event.target;
    const check = rules[field.id];
    if (!check || !field.closest('.field').classList.contains('is-invalid')) return;
    const message = check(fieldValue(field), form);
    if (message) setError(field, message);
    else clearError(field);
  });
}

const minLength = (n, message) => (value) => (value.length >= n ? '' : message);
const emailRule = (message) => (value) => (EMAIL_RE.test(value) ? '' : message);

/* ---------- Контактна форма (вимоги ЛР4: ім'я ≥ 3, email, повідомлення ≥ 10) ---------- */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const savedName = getUser()?.name || storage.get(GUEST_NAME_KEY, '');
  if (savedName) $('#c-name', form).value = savedName;

  attachValidation(form, {
    'c-name': minLength(3, "Ім'я має містити щонайменше 3 символи."),
    'c-email': emailRule('Email має містити @ і домен, наприклад name@mail.com.'),
    'c-message': minLength(10, 'Повідомлення має містити щонайменше 10 символів.'),
  }, (data) => {
    storage.set(GUEST_NAME_KEY, data.name); // бонус: запам'ятовуємо ім'я
    form.reset();
    showFormMessage(form, 'Форма успішно надіслана!');
  });
}

/* ---------- Онлайн-запис (+ перенесення існуючого запису) ---------- */
function initBookingForm() {
  const form = $('#booking-form');
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const dateInput = $('#date', form);
  dateInput.min = toLocalIso(new Date()).slice(0, 10);

  // Переходи зі сторінки лікаря: booking.html?doctor=...
  const doctor = params.get('doctor');
  if (doctor) $('#doctor', form).value = doctor;

  // Перенесення: booking.html?reschedule=<id>
  const rescheduleId = params.get('reschedule');
  let original = rescheduleId ? getBookings().find((b) => b.id === rescheduleId) : null;
  if (original && (new Date(original.start) - Date.now()) / 3600000 < 24) {
    showFormMessage(form, 'До цього візиту менше 24 годин — перенести його можна лише телефоном. Нижче можна створити новий запис.', true);
    original = null;
  }
  if (original) {
    $('h1').textContent = 'Перенесення запису';
    $('#service', form).value = original.service;
    $('#doctor', form).value = original.doctor;
    $('button[type="submit"]', form).textContent = 'Перенести запис';
  }

  // Контактні дані підставляємо з облікового запису
  const user = getUser();
  const savedName = user?.name || storage.get(GUEST_NAME_KEY, '');
  if (savedName) $('#name', form).value = savedName;
  if (user?.email) $('#email', form).value = user.email;

  attachValidation(form, {
    service: (v) => (v ? '' : 'Оберіть послугу.'),
    date: (v) => {
      if (!v) return 'Оберіть дату візиту.';
      return v < dateInput.min ? 'Дата не може бути в минулому.' : '';
    },
    time: (v, f) => {
      if (!v) return 'Оберіть час.';
      const start = new Date(`${$('#date', f).value}T${v}`);
      return start <= new Date() ? 'Цей час уже минув — оберіть пізніший.' : '';
    },
    name: minLength(3, "Вкажіть ім'я (мінімум 3 символи)."),
    phone: (v) => (PHONE_RE.test(v.replace(/[\s()-]/g, '')) ? '' : 'Вкажіть телефон у форматі +380XXXXXXXXX.'),
    email: (v) => (v === '' || EMAIL_RE.test(v) ? '' : 'Вкажіть коректний email, наприклад name@mail.com.'),
    consent: (checked) => (checked ? '' : 'Потрібна ваша згода.'),
  }, (data) => {
    const option = $('#service', form).selectedOptions[0];
    const start = `${data.date}T${data.time}`;
    const bookings = getBookings();

    if (original) {
      const target = bookings.find((b) => b.id === original.id);
      Object.assign(target, { start, service: data.service, doctor: data.doctor, price: Number(option.dataset.price), status: 'new' });
    } else {
      bookings.push({
        id: Date.now().toString(36),
        start,
        service: data.service,
        doctor: data.doctor,
        price: Number(option.dataset.price),
        status: 'new',
      });
    }
    saveBookings(bookings);
    storage.set(GUEST_NAME_KEY, data.name);
    form.reset();

    const when = `${shortDate.format(new Date(start))}, ${data.time}`;
    showFormMessage(form, original
      ? `Запис перенесено на ${when}. Адміністратор підтвердить новий час.`
      : `Форма успішно надіслана! Запис на ${when} створено — його видно в особистому кабінеті.`);
  });
}

/* ---------- Вхід і реєстрація (демо: дані лише в localStorage) ---------- */
function initAuthForms() {
  const login = $('#login-form');
  const register = $('#register-form');

  if (login) {
    attachValidation(login, {
      'login-email': emailRule('Вкажіть email, з яким ви реєструвалися.'),
      'login-password': minLength(8, 'Пароль містить щонайменше 8 символів.'),
    }, (data) => {
      const known = getUser();
      const name = known && known.email === data.email ? known.name : data.email.split('@')[0];
      storage.set(USER_KEY, { name, email: data.email });
      location.href = 'account.html';
    });
  }

  if (register) {
    attachValidation(register, {
      'reg-name': minLength(3, "Вкажіть ім'я (мінімум 3 символи)."),
      'reg-email': emailRule('Вкажіть коректний email.'),
      'reg-password': minLength(8, 'Пароль має містити щонайменше 8 символів.'),
    }, (data) => {
      storage.set(USER_KEY, { name: data.name, email: data.email });
      location.href = 'account.html';
    });
  }
}

initContactForm();
initBookingForm();
initAuthForms();

/* ==========================================================
   Особистий кабінет: список записів, скасування, перенесення
   Правило з ЛР1 (ФВ-17, ФВ-18): скасувати чи перенести запис
   можна не пізніше ніж за 24 години до візиту.
   ========================================================== */
const CANCEL_LIMIT_HOURS = 24;
const HOUR = 60 * 60 * 1000;
const STATUS_LABELS = {
  new: 'Нове',
  confirmed: 'Підтверджене',
  cancelled: 'Скасоване',
  done: 'Завершене',
};

const formatPrice = (n) => `${n.toLocaleString('uk-UA')} грн`;
const formatWhen = (iso) => `${shortDate.format(new Date(iso))}, ${iso.slice(11, 16)}`;
const hoursUntil = (iso) => (new Date(iso) - Date.now()) / HOUR;

// Демо-дані для першого входу: дати рахуються від поточного моменту,
// тож завжди є запис, який уже не можна скасувати (< 24 год).
function seedBookings() {
  if (storage.get(BOOKINGS_KEY)) return;
  const at = (days, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return toLocalIso(d);
  };
  const soon = new Date().getHours() < 18 ? at(0, 19) : at(1, 10);
  saveBookings([
    { id: 'demo1', start: soon, service: 'Ультразвукова чистка обличчя', doctor: 'Марія Ткаченко', price: 1200, status: 'confirmed' },
    { id: 'demo2', start: at(3, 14), service: 'Біоревіталізація', doctor: 'Ірина Мельник', price: 3800, status: 'confirmed' },
    { id: 'demo3', start: at(10, 11), service: 'RF-ліфтинг обличчя', doctor: 'Андрій Бондар', price: 2200, status: 'new' },
    { id: 'demo4', start: at(-37, 10), service: 'Консультація лікаря-косметолога', doctor: 'Олена Коваль', price: 500, status: 'done' },
    { id: 'demo5', start: at(-80, 16), service: 'Мигдальний пілінг', doctor: 'Олена Коваль', price: 1100, status: 'cancelled' },
  ]);
}

function cell(content) {
  const td = document.createElement('td');
  if (content instanceof Node) td.append(content);
  else td.textContent = content;
  return td;
}

function statusBadge(status) {
  const span = document.createElement('span');
  span.className = `status status--${status}`;
  span.textContent = STATUS_LABELS[status];
  return span;
}

function bookingRow(booking, withActions) {
  const tr = document.createElement('tr');
  const time = document.createElement('time');
  time.dateTime = booking.start;
  time.textContent = formatWhen(booking.start);

  tr.append(
    cell(time),
    cell(booking.service),
    cell(booking.doctor),
    cell(formatPrice(booking.price)),
    cell(statusBadge(booking.status)),
  );

  if (withActions) {
    const td = document.createElement('td');
    td.className = 'actions';
    const locked = hoursUntil(booking.start) < CANCEL_LIMIT_HOURS;

    const move = document.createElement('a');
    move.className = 'btn btn-small btn-secondary';
    move.textContent = 'Перенести';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn-small btn-danger';
    cancel.textContent = 'Скасувати';
    cancel.dataset.id = booking.id;

    if (locked) {
      const hint = 'До візиту менше 24 годин — зателефонуйте в клініку';
      cancel.disabled = true;
      cancel.title = hint;
      move.setAttribute('aria-disabled', 'true');
      move.title = hint;
    } else {
      move.href = `booking.html?reschedule=${encodeURIComponent(booking.id)}`;
    }
    td.append(move, cancel);
    tr.append(td);
  }
  return tr;
}

function emptyRow(colspan, text, link) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colspan;
  td.textContent = `${text} `;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    td.append(a);
  }
  tr.append(td);
  return tr;
}

function renderBookings() {
  const upcomingBody = $('#upcoming-body');
  const pastBody = $('#past-body');
  const now = Date.now();
  const all = getBookings();

  const isUpcoming = (b) => new Date(b.start) > now && (b.status === 'new' || b.status === 'confirmed');
  const upcoming = all.filter(isUpcoming).sort((a, b) => a.start.localeCompare(b.start));
  const past = all.filter((b) => !isUpcoming(b)).sort((a, b) => b.start.localeCompare(a.start));

  upcomingBody.replaceChildren(...(upcoming.length
    ? upcoming.map((b) => bookingRow(b, true))
    : [emptyRow(6, 'Майбутніх записів немає.', { href: 'booking.html', text: 'Записатися на процедуру' })]));
  pastBody.replaceChildren(...(past.length
    ? past.map((b) => bookingRow(b, false))
    : [emptyRow(5, 'Історія візитів порожня.')]));
}

function cancelBooking(id) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === id);
  const message = $('#account-message');
  if (!booking) return;

  // Повторна перевірка: сторінка могла бути відкрита довго
  if (hoursUntil(booking.start) < CANCEL_LIMIT_HOURS) {
    message.textContent = 'До візиту залишилося менше 24 годин — скасування можливе лише телефоном.';
    message.classList.add('is-error');
    renderBookings();
    return;
  }

  const ok = window.confirm(`Скасувати запис «${booking.service}» на ${formatWhen(booking.start)}?`);
  if (!ok) return;

  booking.status = 'cancelled';
  saveBookings(bookings);
  renderBookings();
  message.classList.remove('is-error');
  message.textContent = `Запис «${booking.service}» скасовано. Час звільнено, підтвердження надіслано на email.`;
}

function initAccount() {
  if (!$('#upcoming-body')) return;

  const user = getUser();
  if (!user) {
    location.replace('login.html');
    return;
  }
  $('#user-name').textContent = user.name;
  $('#user-email').textContent = user.email;

  seedBookings();
  renderBookings();

  // Делегування подій: один обробник на всю таблицю
  $('#upcoming-body').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button) cancelBooking(button.dataset.id);
  });

  $('#logout').addEventListener('click', () => {
    storage.remove(USER_KEY);
    location.href = 'login.html';
  });
}

// У шапці: «Увійти» → «Кабінет» для авторизованого користувача
function updateHeaderForUser() {
  const user = getUser();
  const link = $('.link-login');
  if (!user || !link) return;
  link.textContent = 'Кабінет';
  link.href = 'account.html';
}

updateHeaderForUser();
initAccount();
