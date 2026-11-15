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

/** Question types that are answered by tapping one of `options` (hints and question links work only for these). */
export const isChoice = (q) => !q.type || q.type === 'mc' || q.type === 'tf';

const toRound = (picked, rng) =>
  picked.map((q) => {
    const base = { id: q.id, q: q.q, e: q.e || null, type: q.type || 'mc' };
    if (q.type === 'fill') return { ...base, accept: q.a };
    if (q.type === 'order') return { ...base, items: shuffle(q.items.map((it, pos) => ({ text: it, pos })), rng) };
    if (q.type === 'match') {
      return {
        ...base,
        left: q.pairs.map((p) => p.l),
        right: shuffle(q.pairs.map((p, forLeft) => ({ text: p.r, forLeft })), rng),
      };
    }
    // tf keeps its fixed order (true first); mc options are shuffled
    const options = q.o.map((text, i) => ({ text, ok: i === q.c }));
    return { ...base, options: q.type === 'tf' ? options : shuffle(options, rng) };
  });

/** Round questions made of the given bank questions (used by the daily challenge and practice). */
export const roundFromQuestions = (list, rng = Math.random) => toRound(list, rng);

/** Normalizes a typed answer so spelling variants match: case, Arabic diacritics/tatweel, أإآ→ا, ى→ي, ة→ه, a leading "ال", digits. */
export function normalizeAnswer(text) {
  let t = String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[.,;:!?؟،؛"'«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (/^ال.{2,}/.test(t)) t = t.slice(2);
  return t;
}

export function checkText(q, text, lang) {
  const typed = normalizeAnswer(text);
  return !!typed && (q.accept?.[lang] || []).some((a) => normalizeAnswer(a) === typed);
}

/** `picked` = item positions in the order the player placed them. */
export const checkOrder = (q, picked) => picked.length === q.items.length && picked.every((pos, i) => pos === i);

/** `pairs[leftIndex]` = index in q.right the player linked to that left item (-1 = none). */
export const checkMatch = (q, pairs) => q.left.length === pairs.length && pairs.every((r, l) => r >= 0 && q.right[r]?.forLeft === l);

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
    ok: null, // result of the current answer (true / false), null while unanswered
    timedOut: false,
    log: [], // [{ id, ok }] in answer order
  };
}

export const current = (s) => s.questions[s.index];

/** Records the outcome of the current question (every type ends here). Ignored if already answered. */
function settle(s, ok, chosen) {
  if (s.done || s.chosen !== null) return s;
  s.chosen = chosen;
  s.ok = ok;
  s.timedOut = chosen === -1;
  s.log.push({ id: current(s).id, ok });
  if (ok) s.correct += 1;
  else s.lives -= 1;
  return s;
}

/** Record a tapped option (mutates and returns state). -1 = time ran out. */
export function answer(s, optionIndex) {
  const opt = current(s).options?.[optionIndex];
  return settle(s, !!opt?.ok, opt ? optionIndex : -1);
}

export const answerText = (s, text, lang) => settle(s, checkText(current(s), text, lang), 0);
export const answerOrder = (s, picked) => settle(s, checkOrder(current(s), picked), 0);
export const answerMatch = (s, pairs) => settle(s, checkMatch(current(s), pairs), 0);

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
  s.ok = null;
  s.timedOut = false;
  s.eliminated = [];
  return s;
}

/** Remove one wrong option (if hints remain). Returns the removed index or -1. */
export function useHint(s) {
  if (s.done || s.chosen !== null || s.hints <= 0 || !isChoice(current(s))) return -1;
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
