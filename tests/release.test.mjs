import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeBuild, diffRelease, sanitizeRelease } from '../src/game/release.js';
import { newsLines, localRelease } from '../src/ui/update.js';
import * as s from '../src/game/save.js';
import { CONFIG, WORLDS } from '../src/config.js';

const names = (id) => ({ ar: `ع-${id}`, en: `W-${id}` });
const local = describeBuild({ worlds: WORLDS.slice(0, 2), levels: 2, questions: 40, names });

test('same release: nothing to announce', () => {
  assert.equal(diffRelease(local, describeBuild({ worlds: WORLDS.slice(0, 2), levels: 2, questions: 40, names })), null);
});

test('a new world, new stages and new questions are all detected', () => {
  const remote = describeBuild({ worlds: [...WORLDS.slice(0, 2), { id: 'geo', icon: '🌍' }], levels: 3, questions: 70, names });
  const d = diffRelease(local, remote);
  assert.deepEqual(d.newWorlds.map((w) => w.id), ['geo']);
  assert.equal(d.newLevels, 1);
  assert.equal(d.newQuestions, 30);
});

test('news lines are written in the player language, with the new world name and icon', () => {
  const remote = describeBuild({ worlds: [...WORLDS.slice(0, 2), { id: 'geo', icon: '🌍' }], levels: 3, questions: 70, names, notes: { ar: 'تحسينات', en: 'Improvements' } });
  const ar = newsLines(remote, 'ar', local);
  const en = newsLines(remote, 'en', local);
  assert.equal(ar.length, 4);
  assert.ok(ar[0].includes('🌍') && ar[0].includes('ع-geo'));
  assert.ok(en[0].includes('W-geo'));
  assert.ok(ar.at(-1).includes('تحسينات') && en.at(-1).includes('Improvements'));
});

test('older/odd version.json (only {version}) or garbage gives no news and never throws', () => {
  for (const bad of [{ version: 'x' }, null, 'str', { worlds: 'no' }, { worlds: [null, 5, { id: '<b>' }] }]) {
    assert.deepEqual(newsLines(bad, 'ar', local), []);
  }
});

test('remote text is sanitized (no markup, capped)', () => {
  const r = sanitizeRelease({ worlds: [{ id: 'geo', icon: '<i>', name: { ar: '<b>x</b>'.repeat(50), en: 'ok' } }], levels: 2, questions: 1, notes: { ar: '<u>n</u>', en: '' } });
  assert.ok(!/[<>]/.test(JSON.stringify(r)));
  assert.ok(r.worlds[0].name.ar.length <= 40);
});

test('the running build describes itself consistently', () => {
  const l = localRelease();
  assert.equal(l.worlds.length, WORLDS.length);
  assert.equal(l.levels, CONFIG.LEVELS_PER_WORLD);
  assert.ok(l.questions >= 160);
  assert.equal(diffRelease(l, l), null);
});

test('save: baseline marks everything seen; later additions are flagged and cleared when opened', () => {
  let save = s.defaultSave();
  assert.equal(s.hasNewContent(save), false); // not recorded yet: no markers for brand-new players
  save = s.baselineSeen(save);
  assert.equal(s.hasNewContent(save), false);
  assert.equal(s.baselineSeen(save), save);
  // simulate an update that adds a world the save has never seen
  const without = { ...save, seenWorlds: Object.fromEntries(Object.entries(save.seenWorlds).filter(([id]) => id !== 'health')) };
  assert.equal(s.newMark(without, 'health'), 'world');
  assert.deepEqual(s.newWorldIds(without), ['health']);
  const opened = s.markSeen(without, 'health');
  assert.equal(s.newMark(opened, 'health'), null);
  assert.equal(s.hasNewContent(opened), false);
  // simulate an update that adds stages
  const fewer = { ...save, seenWorlds: { ...save.seenWorlds, math: CONFIG.LEVELS_PER_WORLD - 1 } };
  assert.equal(s.newMark(fewer, 'math'), 'levels');
  assert.equal(s.newMark(s.markSeen(fewer, 'math'), 'math'), null);
});

test('save: seenWorlds survives sanitize and garbage is dropped', () => {
  const base = s.baselineSeen(s.defaultSave());
  assert.deepEqual(s.sanitizeSave(JSON.parse(JSON.stringify(base))).seenWorlds, base.seenWorlds);
  assert.equal(s.sanitizeSave({ ...base, seenWorlds: 'x' }).seenWorlds, null);
  assert.equal(s.sanitizeSave({ ...base, seenWorlds: [1] }).seenWorlds, null);
  assert.deepEqual(s.sanitizeSave({ ...base, seenWorlds: { math: 99999, fake: 1 } }).seenWorlds, { math: 99 });
});
