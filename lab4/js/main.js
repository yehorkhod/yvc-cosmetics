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
  el.dateTime = now.toISOString().slice(0, 10);
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
    if (event.target.closest('input, textarea, select, [contenteditable]')) return;

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
