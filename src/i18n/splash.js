// Loading splash: really preloads the game's images, shows progress, then waits for "tap to start".
import { t } from '../i18n/index.js';

const IMAGES = [
  'assets/img/forest-library.webp',
  'assets/img/tree-hall.webp',
  'assets/img/puzzle-swamp.webp',
  'assets/img/sky-islands.webp',
];
const MIN_MS = 1400; // keep the splash visible long enough to read the credit

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

/** @param {Document} doc @param {() => string} getLang @returns {Promise<void>} resolves when dismissed */
export function runSplash(doc, getLang) {
  const root = doc.getElementById('splash');
  if (!root) return Promise.resolve();
  const fill = doc.getElementById('splash-fill');
  const pct = doc.getElementById('splash-pct');
  const status = doc.getElementById('splash-status');
  const tip = doc.getElementById('splash-tip');
  const start = doc.getElementById('splash-start');
  const bar = root.querySelector('[role="progressbar"]');
  const tips = ['splash.tip1', 'splash.tip2', 'splash.tip3'];
  let tipIndex = 0;
  const showTip = () => { tip.textContent = t(getLang(), tips[tipIndex % tips.length]); tipIndex++; };
  showTip();
  const tipTimer = setInterval(showTip, 2200);

  let done = 0;
  const total = IMAGES.length;
  const set = (value) => {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    fill.style.width = `${v}%`;
    pct.textContent = `${v}%`;
    bar.setAttribute('aria-valuenow', String(v));
  };
  set(4);

  const startedAt = Date.now();
  const loads = IMAGES.map((src) => loadImage(src).then(() => { done++; set(4 + (done / total) * 96); }));
  const fonts = doc.fonts?.ready ?? Promise.resolve();

  return new Promise((resolve) => {
    Promise.all([...loads, fonts]).then(() => {
      const wait = Math.max(0, MIN_MS - (Date.now() - startedAt));
      setTimeout(() => {
        clearInterval(tipTimer);
        set(100);
        status.textContent = t(getLang(), 'splash.ready');
        tip.textContent = '';
        start.hidden = false;
        start.focus({ preventScroll: true });
        const dismiss = () => {
          start.removeEventListener('click', dismiss);
          root.classList.add('splash--hide');
          doc.body.dataset.splash = 'off';
          setTimeout(() => root.remove(), 600);
          resolve();
        };
        start.addEventListener('click', dismiss);
      }, wait);
    });
  });
}
