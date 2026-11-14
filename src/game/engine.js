// Pure game rules: round building, answering, hints, scoring. No DOM, no storage.
import { CONFIG } from '../config.js';

export const DIFFICULTY_RULES = Object.freeze({
  easy: Object.freeze({ lives: 5, time: 0, hints: 2 }),
  normal: Object.freeze({ lives: 3, time: 20, hints: 1 }),
  challenge: Object.freeze({ lives: 2, time: 12, hints: 0 }),
});

export function shuffle(list, rng = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick ROUND_SIZE questions of the level's tier and shuffle options. */
export function buildRound(bank, worldId, level, rng = Math.random) {
  const pool = (bank[worldId] || []).filter((q) => q.d === level);
  return shuffle(pool, rng)
    .slice(0, CONFIG.ROUND_SIZE)
    .map((q) => ({
      id: q.id,
      q: q.q,
      options: shuffle(q.o.map((text, i) => ({ text, ok: i === q.c })), rng),
    }));
}

export function newRound(questions, difficulty) {
  const rules = DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES[CONFIG.DEFAULT_DIFFICULTY];
  return {
    questions,
    index: 0,
    correct: 0,
    lives: rules.lives,
    maxLives: rules.lives,
    hints: rules.hints,
    time: rules.time,
    chosen: null, // option index, -1 = timed out, null = unanswered
    eliminated: [],
    done: false,
  };
}

export const current = (s) => s.questions[s.index];

/** Record an answer (mutates and returns state). Ignored if already answered. */
export function answer(s, optionIndex) {
  if (s.done || s.chosen !== null) return s;
  const opt = current(s).options[optionIndex];
  s.chosen = opt ? optionIndex : -1;
  if (opt?.ok) s.correct += 1;
  else s.lives -= 1;
  return s;
}

export const timeout = (s) => answer(s, -1);

export function isOver(s) {
  return s.chosen !== null && (s.lives <= 0 || s.index >= s.questions.length - 1);
}

/** Move to the next question, or mark the round as finished. */
export function advance(s) {
  if (s.chosen === null) return s;
  if (isOver(s)) {
    s.done = true;
    return s;
  }
  s.index += 1;
  s.chosen = null;
  s.eliminated = [];
  return s;
}

/** Remove one wrong option (if hints remain). Returns the removed index or -1. */
export function useHint(s) {
  if (s.done || s.chosen !== null || s.hints <= 0) return -1;
  const wrong = current(s)
    .options.map((o, i) => (o.ok || s.eliminated.includes(i) ? -1 : i))
    .filter((i) => i >= 0);
  if (wrong.length <= 1) return -1;
  const pick = wrong[0];
  s.eliminated.push(pick);
  s.hints -= 1;
  return pick;
}

export function minCorrect(total) {
  return Math.ceil(total * 0.6);
}

export function starsFor(correct, total) {
  if (!total || correct < minCorrect(total)) return 0;
  if (correct >= total) return 3;
  return correct / total >= 0.8 ? 2 : 1;
}

export function roundResult(s) {
  const total = s.questions.length;
  const won = s.lives > 0 && s.correct >= minCorrect(total);
  return { correct: s.correct, total, won, stars: won ? starsFor(s.correct, total) : 0 };
}
