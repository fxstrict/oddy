import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as s from '../src/game/save.js';
import { CONFIG } from '../src/config.js';

const win = (save, world, level, stars) => s.applyRoundResult(save, { world, level, correct: 5, total: 5, stars });

test('fresh save: only math level 1 is unlocked', () => {
  const save = s.defaultSave();
  assert.equal(s.isLevelUnlocked(save, 'math', 1), true);
  assert.equal(s.isLevelUnlocked(save, 'math', 2), false);
  assert.equal(s.isWorldUnlocked(save, 'history'), false);
});

test('clearing levels unlocks the next level and the next world', () => {
  let { save } = win(s.defaultSave(), 'math', 1, 1);
  assert.equal(s.isLevelUnlocked(save, 'math', 2), true);
  assert.equal(s.isWorldUnlocked(save, 'history'), true);
  assert.equal(s.isWorldUnlocked(save, 'science'), false);
});

test('anti-farming: coins only for new stars', () => {
  let r = win(s.defaultSave(), 'math', 1, 2);
  assert.equal(r.reward.coins, 25);
  r = win(r.save, 'math', 1, 2);
  assert.equal(r.reward.coins, 0);
  r = win(r.save, 'math', 1, 3);
  assert.equal(r.reward.coins, 10);
  assert.equal(r.save.coins, 35);
});

test('a worse replay never lowers best stars; failed rounds give nothing', () => {
  let r = win(s.defaultSave(), 'math', 1, 3);
  r = s.applyRoundResult(r.save, { world: 'math', level: 1, correct: 1, total: 5, stars: 0 });
  assert.equal(s.bestStars(r.save, 'math', 1), 3);
  assert.equal(r.reward.coins, 0);
});

test('applyRoundResult does not mutate its input', () => {
  const before = s.defaultSave();
  win(before, 'math', 1, 3);
  assert.deepEqual(before, s.defaultSave());
});

test('achievements unlock once', () => {
  let r = win(s.defaultSave(), 'math', 1, 3);
  assert.ok(r.newAchievements.includes('first_win') && r.newAchievements.includes('perfect'));
  r = win(r.save, 'math', 1, 3);
  assert.deepEqual(r.newAchievements, []);
});

test('sanitizeSave rejects corrupt, tampered and unknown-version data', () => {
  assert.deepEqual(s.sanitizeSave(null), s.defaultSave());
  assert.deepEqual(s.sanitizeSave({ v: 99, coins: 9999 }), s.defaultSave());
  const t = s.sanitizeSave({ v: CONFIG.SAVE_VERSION, coins: -5, progress: { math: { 1: 99, 7: 3 }, hack: { 1: 3 } }, profile: { name: '<b>x</b>', avatar: 'nope' }, achievements: { first_win: 'yes' } });
  assert.equal(t.coins, 0);
  assert.equal(t.progress.math[1], 3);
  assert.equal(t.progress.math[7], undefined);
  assert.equal(t.progress.hack, undefined);
  assert.ok(!t.profile.name.includes('<'));
  assert.equal(t.profile.avatar, CONFIG.AVATARS[0]);
  assert.deepEqual(t.achievements, {});
});

test('save/load round trip and broken storage', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const { save } = win(s.defaultSave(), 'math', 1, 3);
  assert.equal(s.writeSave(storage, save), true);
  assert.deepEqual(s.loadSave(storage), save);
  assert.deepEqual(s.loadSave({ getItem: () => '{bad json' }), s.defaultSave());
  assert.equal(s.writeSave({ setItem() { throw new Error('quota'); } }, save), false);
});

test('v1 saves migrate to the current version and keep progress', () => {
  const old = { v: 1, profile: { name: 'هدى', avatar: CONFIG.AVATARS[1] }, progress: { math: { 1: 2 } }, coins: 25, stats: { answered: 5, correct: 4, rounds: 1 }, achievements: { first_win: true } };
  const m = s.sanitizeSave(old);
  assert.equal(m.v, CONFIG.SAVE_VERSION);
  assert.equal(m.progress.math[1], 2);
  assert.equal(m.coins, 25);
  assert.equal(m.profile.name, 'هدى');
  assert.equal(m.seenIntro, true, 'a returning player should not see the intro again');
  assert.equal(s.sanitizeSave({ v: 1, stats: { rounds: 0 } }).seenIntro, false);
});

test('seenIntro defaults to false and only true is kept', () => {
  assert.equal(s.defaultSave().seenIntro, false);
  assert.equal(s.sanitizeSave({ v: CONFIG.SAVE_VERSION, seenIntro: 'yes' }).seenIntro, false);
  assert.equal(s.sanitizeSave({ v: CONFIG.SAVE_VERSION, seenIntro: true }).seenIntro, true);
});

test('all eight worlds unlock in sequence', () => {
  let { save } = win(s.defaultSave(), 'math', 1, 1);
  const ids = ['math', 'history', 'science', 'languages', 'general', 'tech', 'nature', 'health'];
  for (let i = 1; i < ids.length; i++) {
    assert.equal(s.isWorldUnlocked(save, ids[i]), true, ids[i]);
    save = win(save, ids[i], 1, 1).save;
  }
  assert.equal(s.isWorldUnlocked(save, 'health'), true);
});
