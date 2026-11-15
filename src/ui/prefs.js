import { CONFIG } from '../config.js';

// Lightweight UI preferences. The full versioned save system arrives in Phase 5
// and will absorb these values.

export function defaultPrefs() {
  return {
    lang: CONFIG.DEFAULT_LANG,
    difficulty: CONFIG.DEFAULT_DIFFICULTY,
    reducedMotion: false,
    muted: false,
    age: 0, // 0 = not chosen yet (the game then uses CONFIG.DEFAULT_AGE and asks once)
  };
}

export const ageOf = (prefs) => (CONFIG.AGES.includes(prefs?.age) ? prefs.age : CONFIG.DEFAULT_AGE);

export function sanitizePrefs(raw) {
  const base = defaultPrefs();
  if (!raw || typeof raw !== 'object') return base;
  return {
    lang: CONFIG.LANGS.includes(raw.lang) ? raw.lang : base.lang,
    difficulty: CONFIG.DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : base.difficulty,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : base.reducedMotion,
    muted: typeof raw.muted === 'boolean' ? raw.muted : base.muted,
    age: CONFIG.AGES.includes(raw.age) ? raw.age : 0,
  };
}

export function loadPrefs(storage) {
  try {
    const text = storage?.getItem(CONFIG.PREFS_KEY);
    return sanitizePrefs(text ? JSON.parse(text) : null);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(storage, prefs) {
  try {
    storage?.setItem(CONFIG.PREFS_KEY, JSON.stringify(sanitizePrefs(prefs)));
    return true;
  } catch {
    return false;
  }
}
