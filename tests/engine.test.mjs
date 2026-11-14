import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/questions.js';
import * as e from '../src/game/engine.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function play(state, pattern) {
  for (const ok of pattern) {
    if (state.done) break;
    const q = e.current(state);
    e.answer(state, q.options.findIndex((o) => o.ok === ok));
    e.advance(state);
  }
  return state;
}

test('buildRound returns 5 questions of the right tier with one correct option each', () => {
  const r = e.buildRound(QUESTIONS, 'math', 2, seeded());
  assert.equal(r.length, 5);
  for (const q of r) assert.equal(q.options.filter((o) => o.ok).length, 1);
  assert.ok(r.every((q) => QUESTIONS.math.find((x) => x.id === q.id).d === 2));
});

test('stars: 5/5 = 3, 4/5 = 2, 3/5 = 1, below = 0', () => {
  assert.deepEqual([5, 4, 3, 2, 0].map((c) => e.starsFor(c, 5)), [3, 2, 1, 0, 0]);
});

test('perfect round wins with 3 stars', () => {
  const s = play(e.newRound(e.buildRound(QUESTIONS, 'math', 1, seeded()), 'normal'), [true, true, true, true, true]);
  assert.equal(s.done, true);
  assert.deepEqual(e.roundResult(s), { correct: 5, total: 5, won: true, stars: 3 });
});

test('losing all lives ends the round as a loss', () => {
  const s = play(e.newRound(e.buildRound(QUESTIONS, 'math', 1, seeded()), 'challenge'), [false, false, true, true, true]);
  assert.equal(s.done, true);
  assert.equal(s.lives, 0);
  assert.equal(e.roundResult(s).won, false);
  assert.equal(e.roundResult(s).stars, 0);
});

test('timeout costs a life, double answers are ignored', () => {
  const s = e.newRound(e.buildRound(QUESTIONS, 'science', 1, seeded()), 'normal');
  e.timeout(s);
  e.timeout(s);
  assert.equal(s.lives, 2);
  assert.equal(s.chosen, -1);
});

test('hints remove a wrong option only, limited by difficulty', () => {
  const easy = e.newRound(e.buildRound(QUESTIONS, 'math', 1, seeded()), 'easy');
  const idx = e.useHint(easy);
  assert.ok(idx >= 0 && !e.current(easy).options[idx].ok);
  assert.equal(easy.hints, 1);
  const hard = e.newRound(e.buildRound(QUESTIONS, 'math', 1, seeded()), 'challenge');
  assert.equal(e.useHint(hard), -1);
});
