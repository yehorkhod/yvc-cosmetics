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
