/* ===== Glow Bliss — main JS ===== */

// ---- Nav scroll state ----
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav && nav.classList.toggle('scrolled', window.scrollY > 30);
});

// ---- Mobile menu ----
const hb = document.getElementById('hamburger');
const mm = document.getElementById('mobileMenu');
if (hb && mm) {
  hb.addEventListener('click', () => mm.classList.toggle('open'));
  mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mm.classList.remove('open')));
}

// ---- Reveal on scroll ----
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.10 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---- Year ----
const yr = document.getElementById('year');
if (yr) yr.textContent = new Date().getFullYear();

// ---- Theme switcher ----
const THEME_KEY = 'gb_theme';
const dock = document.getElementById('themeDock');
const toggleBtn = document.getElementById('themeToggleBtn');
const chips = document.querySelectorAll('.tc');

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem(THEME_KEY, name);
  chips.forEach(c => c.classList.toggle('active', c.dataset.theme === name));
}

// Restore saved theme
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme) applyTheme(savedTheme);

// Toggle panel
if (toggleBtn && dock) {
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dock.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!dock.contains(e.target)) dock.classList.remove('open');
  });
}

// Theme chip clicks
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    applyTheme(chip.dataset.theme);
    dock.classList.remove('open');
  });
});

// Also sync theme on booking page
const bookDoc = document.querySelector('html');
if (bookDoc && !document.getElementById('themeDock')) {
  const t = localStorage.getItem(THEME_KEY);
  if (t) bookDoc.setAttribute('data-theme', t);
}
