import { CONFIG, RTL_LANGS } from '../config.js';
import ar from './ar.js';
import en from './en.js';

const DICTIONARIES = { ar, en };

export function isSupportedLang(lang) {
  return CONFIG.LANGS.includes(lang);
}

export function getDirection(lang) {
  return RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
}

/** Translate a key. Falls back to English, then to the key itself. */
export function t(lang, key) {
  const dict = DICTIONARIES[isSupportedLang(lang) ? lang : CONFIG.DEFAULT_LANG];
  return dict[key] ?? en[key] ?? key;
}

/** Apply language + direction to the document and translate all data-i18n nodes. */
export function applyLanguage(doc, lang) {
  const safe = isSupportedLang(lang) ? lang : CONFIG.DEFAULT_LANG;
  const root = doc.documentElement;
  root.lang = safe;
  root.dir = getDirection(safe);
  doc.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(safe, el.dataset.i18n);
  });
  doc.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(safe, el.dataset.i18nAria));
  });
  doc.title = `${t(safe, 'app.title')} | ${t('en', 'app.title')}`;
  return safe;
}

/** Translate and substitute {param} placeholders. */
export function tf(lang, key, params = {}) {
  return t(lang, key).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}
