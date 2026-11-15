import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/questions.js';
import { FACTS } from '../src/data/facts.js';
import { WORLDS, CONFIG } from '../src/config.js';
import * as e from '../src/game/engine.js';
import * as s from '../src/game/save.js';
import { sanitizePrefs, ageOf, defaultPrefs } from '../src/ui/prefs.js';

const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const ids = (round) => round.map((q) => q.id);

test('every world has 60 questions: 10 per level tier and age group', () => {
  for (const w of WORLDS) {
    const list = QUESTIONS[w.id];
    assert.equal(list.length, 60, `${w.id} has ${list.length}`);
    for (let d = 1; d <= CONFIG.LEVELS_PER_WORLD; d++) {
      for (const age of CONFIG.AGES) {
        const n = list.filter((q) => q.d === d && q.age === age).length;
        assert.equal(n, 10, `${w.id} level ${d} age ${age} has ${n}`);
      }
    }
  }
});

test('every question has a valid age group and a short explanation in both languages', () => {
  for (const list of Object.values(QUESTIONS)) {
    for (const q of list) {
      assert.ok(CONFIG.AGES.includes(q.age), `${q.id} bad age`);
      for (const lang of CONFIG.LANGS) {
        const text = q.e?.[lang];
        assert.ok(text && text.trim().length >= 8, `${q.id} missing ${lang} explanation`);
        assert.ok(text.length <= 260, `${q.id} ${lang} explanation too long (${text.length})`);
      }
    }
  }
});

test('every world has "did you know" facts in both languages', () => {
  for (const w of WORLDS) {
    assert.ok((FACTS[w.id] || []).length >= 5, `${w.id} needs 5 facts`);
    for (const f of FACTS[w.id]) for (const lang of CONFIG.LANGS) assert.ok(f[lang]?.trim(), `${w.id} fact missing ${lang}`);
  }
});

test('a round for an age group draws mostly from that group (plus at most one from the next)', () => {
  for (const age of CONFIG.AGES) {
    const { questions } = e.planRound(QUESTIONS, 'science', 1, { age, rng: seeded(age) });
    assert.equal(questions.length, CONFIG.ROUND_SIZE);
    const ages = ids(questions).map((id) => QUESTIONS.science.find((q) => q.id === id).age);
    assert.ok(ages.filter((a) => a === age).length >= CONFIG.ROUND_SIZE - CONFIG.NEXT_AGE_MIX);
    assert.ok(ages.every((a) => a === age || a === age + 1));
  }
});

test('no question repeats until the group is used up, then a new cycle starts', () => {
  let asked = [];
  const seen = new Set();
  const rng = seeded(3);
  // Age 3 has no "next" group: 10 questions per tier = exactly two rounds without repeats.
  for (let i = 0; i < 2; i++) {
    const plan = e.planRound(QUESTIONS, 'math', 2, { age: 3, asked, rng });
    for (const id of ids(plan.questions)) {
      assert.ok(!seen.has(id), `${id} repeated in round ${i + 1}`);
      seen.add(id);
    }
    asked = plan.asked;
  }
  assert.equal(seen.size, 10);
  const third = e.planRound(QUESTIONS, 'math', 2, { age: 3, asked, rng });
  assert.equal(third.questions.length, CONFIG.ROUND_SIZE);
  assert.equal(new Set(ids(third.questions)).size, CONFIG.ROUND_SIZE);
  assert.ok(third.asked.length <= CONFIG.MAX_ASKED);
});

test('buildRound without options still works for every age (old behaviour)', () => {
  const r = e.buildRound(QUESTIONS, 'history', 1, seeded());
  assert.equal(r.length, 5);
  assert.ok(r.every((q) => q.e?.ar && q.e?.en));
});

test('answers are logged and a practice round is built from missed ids', () => {
  const state = e.newRound(e.buildRound(QUESTIONS, 'math', 1, seeded()), 'easy');
  const first = e.current(state);
  e.answer(state, first.options.findIndex((o) => !o.ok));
  assert.deepEqual(state.log, [{ id: first.id, ok: false }]);
  const review = e.buildReview(QUESTIONS, ['m1', 'h1', 'nope'], seeded());
  assert.deepEqual(ids(review).sort(), ['h1', 'm1']);
});

test('wrong answers enter the review list; correct ones are mastered and leave it step by step', () => {
  let save = s.defaultSave();
  save = s.recordAnswer(save, 'm1', false, 100);
  assert.deepEqual(save.review.m1, { box: 0, due: 101 });
  assert.ok(!save.mastered.includes('m1'));
  assert.deepEqual(s.reviewQueue(save, 100), ['m1']);
  assert.equal(s.reviewDue(save, 100), 0);
  assert.equal(s.reviewDue(save, 101), 1);
  save = s.recordAnswer(save, 'm1', true, 100); // not due yet: stays in the list
  assert.deepEqual(save.review.m1, { box: 0, due: 101 });
  assert.ok(save.mastered.includes('m1'));
  save = s.recordAnswer(save, 'm1', true, 101); // due: moves up, returns after 3 days
  assert.deepEqual(save.review.m1, { box: 1, due: 104 });
  save = s.recordAnswer(save, 'm1', true, 104); // second success: done
  assert.equal(save.review.m1, undefined);
  save = s.recordAnswer(save, 'm1', false, 105);
  assert.ok(!save.mastered.includes('m1'));
});

test('due review questions come first in the queue', () => {
  let save = s.defaultSave();
  save = s.recordAnswer(save, 'a1', false, 10); // due 11
  save = s.recordAnswer(save, 'b2', false, 20); // due 21
  assert.deepEqual(s.reviewQueue(save, 21), ['a1', 'b2']);
  assert.deepEqual(s.reviewQueue(save, 15), ['a1', 'b2']);
  save = s.recordAnswer(save, 'c3', false, 14); // due 15
  assert.deepEqual(s.reviewQueue(save, 15), ['a1', 'c3', 'b2']);
});

test('mastery counts correct answers within the age group of a world', () => {
  const kids = QUESTIONS.math.filter((q) => q.age === 1).slice(0, 5).map((q) => q.id);
  let save = s.defaultSave();
  for (const id of kids) save = s.recordAnswer(save, id, true, 1);
  assert.deepEqual(s.worldMastery(save, QUESTIONS, 'math', 1), { known: 5, total: 20, pct: 25 });
  assert.equal(s.worldMastery(save, QUESTIONS, 'math', 3).known, 0);
});

test('save sanitizing keeps valid learning data and drops junk', () => {
  const raw = { ...s.defaultSave(), asked: ['m1', 'm1', 42, '<x>', 'h2'], mastered: 'nope', review: { m3: { box: 9, due: -5 }, '<bad>': { box: 0, due: 1 }, h1: 5 } };
  const clean = s.sanitizeSave(raw);
  assert.deepEqual(clean.asked, ['m1', 'h2']);
  assert.deepEqual(clean.mastered, []);
  assert.deepEqual(clean.review, { m3: { box: CONFIG.REVIEW_DAYS.length - 1, due: 0 } });
  assert.deepEqual(s.sanitizeSave({ v: CONFIG.SAVE_VERSION }).review, {});
});

test('age preference: only 1-3 are kept, 0 means not chosen and the game uses the default', () => {
  assert.equal(defaultPrefs().age, 0);
  assert.equal(sanitizePrefs({ age: 3 }).age, 3);
  assert.equal(sanitizePrefs({ age: 7 }).age, 0);
  assert.equal(sanitizePrefs({ age: '2' }).age, 0);
  assert.equal(ageOf({ age: 0 }), CONFIG.DEFAULT_AGE);
  assert.equal(ageOf({ age: 1 }), 1);
});
