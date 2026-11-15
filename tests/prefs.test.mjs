import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultPrefs, sanitizePrefs, loadPrefs, savePrefs } from '../src/ui/prefs.js';
import { CONFIG } from '../src/config.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}

test('defaults: Arabic, normal difficulty', () => {
  const p = defaultPrefs();
  assert.equal(p.lang, 'ar');
  assert.equal(p.difficulty, 'normal');
});

test('sanitize rejects invalid values', () => {
  const p = sanitizePrefs({ lang: 'xx', difficulty: 'insane', muted: 'yes', reducedMotion: 1, age: 9 });
  assert.deepEqual(p, defaultPrefs());
});

test('save then load round-trips', () => {
  const s = fakeStorage();
  savePrefs(s, { lang: 'en', difficulty: 'easy', muted: true, reducedMotion: true, age: 3, read: true });
  assert.deepEqual(loadPrefs(s), { lang: 'en', difficulty: 'easy', muted: true, reducedMotion: true, age: 3, read: true });
});

test('corrupt JSON falls back to defaults without throwing', () => {
  const s = fakeStorage({ [CONFIG.PREFS_KEY]: '{not json' });
  assert.deepEqual(loadPrefs(s), defaultPrefs());
});

test('missing or blocked storage is safe', () => {
  assert.deepEqual(loadPrefs(null), defaultPrefs());
  assert.equal(savePrefs(null, defaultPrefs()), true);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadPrefs(throwing), defaultPrefs());
  assert.equal(savePrefs(throwing, defaultPrefs()), false);
});
