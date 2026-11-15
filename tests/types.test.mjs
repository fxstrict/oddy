import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/questions.js';
import { WORLDS, CONFIG } from '../src/config.js';
import * as e from '../src/game/engine.js';
import * as s from '../src/game/save.js';
import { dailyQuestions, seededRng } from '../src/game/daily.js';
import { speakableText, createSpeech } from '../src/ui/speech.js';
import { findQuestion } from '../src/ui/share.js';

const seeded = (seed = 5) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const all = Object.values(QUESTIONS).flat();
const ofType = (t) => all.filter((q) => q.type === t);

test('each world has at least two true/false, two typed, one ordering and one matching question', () => {
  for (const w of WORLDS) {
    const list = QUESTIONS[w.id];
    assert.ok(list.filter((q) => q.type === 'tf').length >= 2, `${w.id} tf`);
    assert.ok(list.filter((q) => q.type === 'fill').length >= 2, `${w.id} fill`);
    assert.ok(list.some((q) => q.type === 'order'), `${w.id} order`);
    assert.ok(list.some((q) => q.type === 'match'), `${w.id} match`);
  }
});

test('typed questions are well formed in both languages', () => {
  for (const q of ofType('fill')) for (const l of CONFIG.LANGS) assert.ok(q.a[l].length >= 1 && q.a[l].every((x) => x.trim()), `${q.id} accepted ${l}`);
  for (const q of ofType('order')) {
    assert.ok(q.items.length >= 3 && q.items.length <= 5, `${q.id} items`);
    for (const l of CONFIG.LANGS) assert.equal(new Set(q.items.map((i) => i[l])).size, q.items.length, `${q.id} duplicate ${l} items`);
  }
  for (const q of ofType('match')) {
    assert.ok(q.pairs.length >= 3 && q.pairs.length <= 5, `${q.id} pairs`);
    for (const l of CONFIG.LANGS) {
      assert.equal(new Set(q.pairs.map((p) => p.l[l])).size, q.pairs.length, `${q.id} duplicate ${l} left`);
      assert.equal(new Set(q.pairs.map((p) => p.r[l])).size, q.pairs.length, `${q.id} duplicate ${l} right`);
    }
  }
  for (const q of ofType('tf')) assert.deepEqual(q.o.map((o) => o.en), ['True', 'False']);
});

test('answer normalization accepts spelling variants', () => {
  assert.equal(e.normalizeAnswer('  الإسكندرية! '), e.normalizeAnswer('اسكندرية'));
  assert.equal(e.normalizeAnswer('القاهرة'), e.normalizeAnswer('قاهرة'));
  assert.equal(e.normalizeAnswer('١٠١'), '101');
  assert.equal(e.normalizeAnswer('Vitamin D'), 'vitamin d');
  assert.equal(e.normalizeAnswer('مدرَّسة'), e.normalizeAnswer('مدرسة'));
  assert.equal(e.normalizeAnswer(''), '');
});

test('typed answers: right, wrong and empty', () => {
  const q = { accept: { ar: ['الأكسجين'], en: ['oxygen'] } };
  assert.ok(e.checkText(q, 'اكسجين', 'ar'));
  assert.ok(e.checkText(q, 'الأكسجين', 'ar'));
  assert.ok(e.checkText(q, ' Oxygen ', 'en'));
  assert.ok(!e.checkText(q, 'الهيدروجين', 'ar'));
  assert.ok(!e.checkText(q, 'oxygen', 'ar')); // the English spelling is not accepted in the Arabic game
  assert.ok(!e.checkText(q, '   ', 'en'));
});

test('ordering and matching are checked from the round data', () => {
  const [order] = ofType('order');
  const [match] = ofType('match');
  const r = e.roundFromQuestions([order, match], seeded());
  const [ro, rm] = r;
  assert.equal(ro.items.length, order.items.length);
  assert.ok(e.checkOrder(ro, order.items.map((_, i) => i)));
  assert.ok(!e.checkOrder(ro, [...order.items.keys()].reverse()));
  assert.ok(!e.checkOrder(ro, [0]));
  const right = rm.left.map((_, l) => rm.right.findIndex((x) => x.forLeft === l));
  assert.ok(e.checkMatch(rm, right));
  assert.ok(!e.checkMatch(rm, rm.left.map(() => 0)));
  assert.ok(!e.checkMatch(rm, rm.left.map(() => -1)));
});

test('a round can mix every type and records right/wrong for each', () => {
  const picks = [ofType('tf')[0], ofType('fill')[0], ofType('order')[0], ofType('match')[0], all.find((q) => !q.type)];
  const state = e.newRound(e.roundFromQuestions(picks, seeded()), 'normal');
  // tf: tap the wrong option
  e.answer(state, e.current(state).options.findIndex((o) => !o.ok));
  assert.equal(state.ok, false);
  assert.equal(state.lives, 2);
  e.advance(state);
  // fill: type the accepted answer
  e.answerText(state, picks[1].a.ar[0], 'ar');
  assert.equal(state.ok, true);
  e.advance(state);
  // order: correct
  e.answerOrder(state, picks[2].items.map((_, i) => i));
  assert.equal(state.ok, true);
  e.advance(state);
  // match: time out on a non-choice type
  e.answer(state, -1);
  assert.equal(state.ok, false);
  assert.equal(state.timedOut, true);
  e.advance(state);
  // answering twice is ignored
  e.answer(state, e.current(state).options.findIndex((o) => o.ok));
  e.answer(state, 0);
  assert.equal(state.log.length, 5);
  assert.equal(state.correct, 3);
});

test('hints only work on choice questions', () => {
  const state = e.newRound(e.roundFromQuestions([ofType('fill')[0], ofType('tf')[0]], seeded()), 'easy');
  assert.equal(e.useHint(state), -1);
  e.answerText(state, 'x', 'ar');
  e.advance(state);
  assert.equal(e.useHint(state), -1); // a true/false question has nothing to remove
});

test('only tap-an-option questions can be shared as a link challenge', () => {
  assert.ok(findQuestion(QUESTIONS, 'm1'));
  assert.ok(findQuestion(QUESTIONS, ofType('tf')[0].id));
  assert.equal(findQuestion(QUESTIONS, ofType('fill')[0].id), null);
  assert.equal(findQuestion(QUESTIONS, ofType('order')[0].id), null);
});

test('a planned round for each age can include non-choice types without breaking', () => {
  for (const age of CONFIG.AGES) {
    for (const w of WORLDS) {
      for (let d = 1; d <= CONFIG.LEVELS_PER_WORLD; d++) {
        const { questions } = e.planRound(QUESTIONS, w.id, d, { age, rng: seeded(age + d) });
        assert.equal(questions.length, CONFIG.ROUND_SIZE);
        for (const q of questions) assert.ok(q.type && q.q.ar && q.q.en);
      }
    }
  }
});

test('daily challenge: same day + age gives the same questions, other days differ, one per world', () => {
  const ids = (list) => list.map((q) => q.id);
  const a = dailyQuestions(QUESTIONS, 20000, 2);
  const b = dailyQuestions(QUESTIONS, 20000, 2);
  assert.equal(a.length, CONFIG.DAILY_SIZE);
  assert.deepEqual(ids(a), ids(b));
  assert.deepEqual(a.map((q) => (q.options || []).map((o) => o.text.en)), b.map((q) => (q.options || []).map((o) => o.text.en)));
  assert.notDeepEqual(ids(a), ids(dailyQuestions(QUESTIONS, 20001, 2)));
  const worlds = ids(a).map((id) => Object.keys(QUESTIONS).find((w) => QUESTIONS[w].some((q) => q.id === id)));
  assert.equal(new Set(worlds).size, CONFIG.DAILY_SIZE);
  assert.equal(seededRng(1)(), seededRng(1)());
});

test('daily streak: grows on consecutive days, restarts after a gap, pays once per day with milestone bonuses', () => {
  let save = s.defaultSave();
  let r = s.completeDaily(save, 100, 4, 5);
  assert.deepEqual(r.reward, { first: true, coins: 4, bonus: 0, streak: 1 });
  save = r.save;
  assert.equal(save.coins, 4);
  assert.ok(s.dailyDone(save, 100));
  r = s.completeDaily(save, 100, 5, 5); // same day again: nothing
  assert.equal(r.reward.first, false);
  assert.equal(r.save.coins, 4);
  save = s.completeDaily(save, 101, 5, 5).save;
  save = s.completeDaily(save, 102, 0, 5).save; // third day in a row: +10 bonus
  assert.equal(save.daily.streak, 3);
  assert.equal(save.coins, 4 + 5 + 10);
  assert.equal(s.dailyStreak(save, 103), 3); // still alive the next day
  assert.equal(s.dailyStreak(save, 104), 0); // a missed day ends it
  save = s.completeDaily(save, 105, 5, 5).save;
  assert.equal(save.daily.streak, 1);
  assert.equal(save.daily.best, 3);
});

test('daily data is sanitized when loading a save', () => {
  const clean = s.sanitizeSave({ ...s.defaultSave(), daily: { last: -4, streak: 'x', best: 9, today: { day: 5, correct: 99, total: 5 } } });
  assert.deepEqual(clean.daily, { last: 0, streak: 0, best: 9, today: { day: 5, correct: 20, total: 5 } });
  assert.deepEqual(s.sanitizeSave({ v: CONFIG.SAVE_VERSION }).daily, { last: 0, streak: 0, best: 0, today: { day: 0, correct: 0, total: 0 } });
});

test('speakable text covers every question type', () => {
  const rounds = e.roundFromQuestions([all.find((q) => !q.type), ofType('fill')[0], ofType('order')[0], ofType('match')[0]], seeded());
  for (const r of rounds) for (const l of CONFIG.LANGS) assert.ok(speakableText(r, l).length > r.q[l].length - 1);
  assert.ok(speakableText(rounds[0], 'en').includes(rounds[0].options[0].text.en));
});

test('speech wrapper degrades gracefully and picks a matching voice', () => {
  assert.equal(createSpeech({}).available(), false);
  assert.equal(createSpeech({}).speak('x', 'ar'), false);
  const spoken = [];
  class Utter { constructor(t) { this.text = t; } }
  const fake = {
    SpeechSynthesisUtterance: Utter,
    speechSynthesis: { getVoices: () => [{ lang: 'en-US', name: 'E' }, { lang: 'ar-SA', name: 'A' }], addEventListener() {}, cancel() {}, speak: (u) => spoken.push(u) },
  };
  const sp = createSpeech(fake);
  assert.ok(sp.available() && sp.hasVoice('ar') && sp.hasVoice('en'));
  assert.ok(sp.speak('مرحبا', 'ar'));
  assert.equal(spoken[0].voice.name, 'A');
  const noArabic = createSpeech({ ...fake, speechSynthesis: { ...fake.speechSynthesis, getVoices: () => [{ lang: 'en-US', name: 'E' }] } });
  assert.equal(noArabic.hasVoice('ar'), false);
});
