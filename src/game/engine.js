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

const toRound = (picked, rng) =>
  picked.map((q) => ({
    id: q.id,
    q: q.q,
    e: q.e || null,
    options: shuffle(q.o.map((text, i) => ({ text, ok: i === q.c })), rng),
  }));

/** Take n questions from a group, preferring ones not asked yet. When the group runs dry it starts a new cycle. */
function takeFresh(group, n, asked, rng) {
  if (n <= 0 || !group.length) return { picks: [], reset: false };
  const fresh = group.filter((q) => !asked.has(q.id));
  if (fresh.length >= n) return { picks: shuffle(fresh, rng).slice(0, n), reset: false };
  const used = group.filter((q) => asked.has(q.id));
  return { picks: [...fresh, ...shuffle(used, rng).slice(0, n - fresh.length)], reset: true };
}

/**
 * Build a round without repeating questions until the player's group is used up.
 * age = 1..3 draws mostly from that age group (plus NEXT_AGE_MIX from the next one); 0 = every age.
 * asked = ids already shown. Returns { questions, asked } where `asked` is the updated list to store.
 */
export function planRound(bank, worldId, level, { age = 0, asked = [], rng = Math.random } = {}) {
  const size = CONFIG.ROUND_SIZE;
  const all = (bank[worldId] || []).filter((q) => q.d === level);
  const seen = new Set(asked);
  let plan = [[all, size]];
  if (age) {
    const own = all.filter((q) => q.age === age);
    const next = all.filter((q) => q.age === age + 1);
    const mix = own.length >= size && next.length ? Math.min(CONFIG.NEXT_AGE_MIX, next.length) : 0;
    plan = [[own, size - mix], [next, mix]];
  }
  const picked = [];
  for (const [group, n] of plan) {
    const r = takeFresh(group, n, seen, rng);
    if (r.reset) for (const q of group) seen.delete(q.id);
    picked.push(...r.picks);
  }
  if (picked.length < size) {
    const have = new Set(picked.map((q) => q.id));
    const rest = all.filter((q) => !have.has(q.id));
    const extra = [...shuffle(rest.filter((q) => !seen.has(q.id)), rng), ...shuffle(rest.filter((q) => seen.has(q.id)), rng)];
    picked.push(...extra.slice(0, size - picked.length));
  }
  for (const q of picked) seen.add(q.id);
  return { questions: toRound(shuffle(picked, rng), rng), asked: [...seen].slice(-CONFIG.MAX_ASKED) };
}

/** Pick ROUND_SIZE questions of the level's tier and shuffle options (no memory of earlier rounds). */
export function buildRound(bank, worldId, level, rng = Math.random, opts = {}) {
  return planRound(bank, worldId, level, { ...opts, rng }).questions;
}

/** Practice round made of specific question ids (looked up in every world), at most ROUND_SIZE. */
export function buildReview(bank, ids, rng = Math.random) {
  const byId = new Map();
  for (const list of Object.values(bank)) for (const q of list) byId.set(q.id, q);
  const picked = ids.map((id) => byId.get(id)).filter(Boolean).slice(0, CONFIG.ROUND_SIZE);
  return toRound(shuffle(picked, rng), rng);
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
    log: [], // [{ id, ok }] in answer order
  };
}

export const current = (s) => s.questions[s.index];

/** Record an answer (mutates and returns state). Ignored if already answered. */
export function answer(s, optionIndex) {
  if (s.done || s.chosen !== null) return s;
  const opt = current(s).options[optionIndex];
  s.chosen = opt ? optionIndex : -1;
  s.log.push({ id: current(s).id, ok: !!opt?.ok });
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
