import { test } from 'node:test';
import assert from 'node:assert/strict';
import ar from '../src/i18n/ar.js';
import en from '../src/i18n/en.js';
import { getDirection, t, isSupportedLang } from '../src/i18n/index.js';
import { WORLDS } from '../src/config.js';

test('Arabic is RTL and English is LTR', () => {
  assert.equal(getDirection('ar'), 'rtl');
  assert.equal(getDirection('en'), 'ltr');
});

test('unsupported languages are rejected and fall back to default (Arabic)', () => {
  assert.equal(isSupportedLang('fr'), false);
  assert.equal(t('fr', 'menu.play'), ar['menu.play']);
});

test('Arabic and English dictionaries have identical keys', () => {
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
});

test('no empty translations', () => {
  for (const dict of [ar, en]) {
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(typeof value === 'string' && value.trim().length > 0, `empty: ${key}`);
    }
  }
});

test('every world has a name in both languages', () => {
  for (const world of WORLDS) {
    assert.ok(ar[`world.${world.id}`], `ar missing world.${world.id}`);
    assert.ok(en[`world.${world.id}`], `en missing world.${world.id}`);
  }
});

test('missing key returns the key itself', () => {
  assert.equal(t('en', 'does.not.exist'), 'does.not.exist');
});

test('every achievement has name and description in both languages', async () => {
  const { ACHIEVEMENTS } = await import('../src/game/save.js');
  for (const a of ACHIEVEMENTS) {
    for (const dict of [ar, en]) {
      assert.ok(dict[`ach.${a.id}.name`], `${a.id} name`);
      assert.ok(dict[`ach.${a.id}.desc`], `${a.id} desc`);
    }
  }
});

test('config: eight playable worlds on the map with unique ids and in-range positions', () => {
  assert.equal(WORLDS.length, 8);
  assert.equal(new Set(WORLDS.map((w) => w.id)).size, 8);
  for (const w of WORLDS) {
    assert.ok(w.x > 0 && w.x < 100 && w.y > 0 && w.y < 100, `${w.id} position`);
    assert.match(w.color, /^#[0-9a-f]{6}$/i);
  }
});

test('intro texts exist in both languages', () => {
  for (const k of ['intro.title', 'intro.s1.title', 'intro.s1.text', 'intro.s2.text', 'intro.s3.text', 'intro.next', 'intro.skip', 'intro.go', 'intro.step', 'help.replayIntro']) {
    assert.ok(ar[k] && en[k], k);
  }
});
