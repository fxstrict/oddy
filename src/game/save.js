// Versioned save data + progression rules + achievements. Pure: storage is injected.
import { CONFIG, WORLDS } from '../config.js';

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_win', test: (s) => totalClears(s) >= 1 },
  { id: 'perfect', test: (s) => anyStars(s, 3) },
  { id: 'world_clear', test: (s) => WORLDS.some((w) => worldCleared(s, w.id)) },
  { id: 'stars_10', test: (s) => totalStars(s) >= 10 },
  { id: 'correct_50', test: (s) => s.stats.correct >= 50 },
  { id: 'rounds_10', test: (s) => s.stats.rounds >= 10 },
  { id: 'coins_100', test: (s) => s.coins >= 100 },
  { id: 'all_worlds', test: (s) => WORLDS.every((w) => worldCleared(s, w.id)) },
]);

export function defaultSave() {
  return {
    v: CONFIG.SAVE_VERSION,
    profile: { name: '', avatar: CONFIG.AVATARS[0] },
    progress: {},
    coins: 0,
    stats: { answered: 0, correct: 0, rounds: 0 },
    achievements: {},
    seenIntro: false,
    asked: [], // question ids already shown (no repeats until a group is used up)
    mastered: [], // question ids answered correctly (and not missed since)
    review: {}, // missed question id -> { box: 0|1, due: day number } (spaced repetition)
    seenWorlds: null, // world id -> stages the player has already seen; null = not recorded yet (see baselineSeen)
  };
}

const int = (n, min, max) => (Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : min);

const QID = /^[A-Za-z0-9_-]{1,16}$/;

function sanitizeIds(raw, max) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  for (const x of raw) if (typeof x === 'string' && QID.test(x)) seen.add(x);
  return [...seen].slice(-max);
}

function sanitizeReview(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw).slice(0, 600)) {
    if (QID.test(id) && v && typeof v === 'object') out[id] = { box: int(v.box, 0, CONFIG.REVIEW_DAYS.length - 1), due: int(v.due, 0, 1e6) };
  }
  return out;
}

function sanitizeSeen(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const w of WORLDS) if (raw[w.id] !== undefined) out[w.id] = int(raw[w.id], 0, 99);
  return out;
}

/** First run of a build that knows about "new" markers: everything that exists now counts as already seen. */
export function baselineSeen(s) {
  if (s.seenWorlds) return s;
  return { ...s, seenWorlds: Object.fromEntries(WORLDS.map((w) => [w.id, CONFIG.LEVELS_PER_WORLD])) };
}

/** 'world' = island the player has never opened, 'levels' = stages were added since they last opened it, else null. */
export function newMark(s, worldId) {
  if (!s.seenWorlds) return null;
  if (!(worldId in s.seenWorlds)) return 'world';
  return s.seenWorlds[worldId] < CONFIG.LEVELS_PER_WORLD ? 'levels' : null;
}

export const newWorldIds = (s) => WORLDS.map((w) => w.id).filter((id) => newMark(s, id) === 'world');
export const hasNewContent = (s) => WORLDS.some((w) => newMark(s, w.id));

export function markSeen(s, worldId) {
  if (!s.seenWorlds || newMark(s, worldId) === null) return s;
  return { ...s, seenWorlds: { ...s.seenWorlds, [worldId]: CONFIG.LEVELS_PER_WORLD } };
}

/** Validate and migrate unknown data into the current save shape. */
export function sanitizeSave(raw) {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  // Migrations: v1 -> v2 added `seenIntro` (players who already played skip the intro).
  // Unknown/newer versions fall back to defaults.
  if (raw.v === 1) raw = { ...raw, v: 2, seenIntro: Number(raw.stats?.rounds) > 0 };
  if (raw.v !== CONFIG.SAVE_VERSION) return base;

  const name = typeof raw.profile?.name === 'string' ? raw.profile.name.replace(/[<>]/g, '').trim().slice(0, 20) : '';
  const avatar = CONFIG.AVATARS.includes(raw.profile?.avatar) ? raw.profile.avatar : base.profile.avatar;

  const progress = {};
  for (const w of WORLDS) {
    for (let lvl = 1; lvl <= CONFIG.LEVELS_PER_WORLD; lvl++) {
      const stars = int(raw.progress?.[w.id]?.[lvl], 0, 3);
      if (stars > 0) (progress[w.id] ||= {})[lvl] = stars;
    }
  }
  const achievements = {};
  for (const a of ACHIEVEMENTS) if (raw.achievements?.[a.id] === true) achievements[a.id] = true;

  return {
    v: CONFIG.SAVE_VERSION,
    profile: { name, avatar },
    progress,
    coins: int(raw.coins, 0, 1e6),
    stats: {
      answered: int(raw.stats?.answered, 0, 1e7),
      correct: int(raw.stats?.correct, 0, 1e7),
      rounds: int(raw.stats?.rounds, 0, 1e7),
    },
    achievements,
    seenIntro: raw.seenIntro === true,
    asked: sanitizeIds(raw.asked, CONFIG.MAX_ASKED),
    mastered: sanitizeIds(raw.mastered, CONFIG.MAX_ASKED),
    review: sanitizeReview(raw.review),
    seenWorlds: sanitizeSeen(raw.seenWorlds),
  };
}

export function loadSave(storage) {
  try {
    const text = storage?.getItem(CONFIG.SAVE_KEY);
    return sanitizeSave(text ? JSON.parse(text) : null);
  } catch {
    return defaultSave();
  }
}

export function writeSave(storage, save) {
  try {
    storage?.setItem(CONFIG.SAVE_KEY, JSON.stringify(sanitizeSave(save)));
    return true;
  } catch {
    return false;
  }
}

export const bestStars = (s, world, level) => s.progress[world]?.[level] ?? 0;

export function worldStars(s, world) {
  let n = 0;
  for (let l = 1; l <= CONFIG.LEVELS_PER_WORLD; l++) n += bestStars(s, world, l);
  return n;
}

export const maxWorldStars = () => CONFIG.LEVELS_PER_WORLD * 3;

export function worldCleared(s, world) {
  for (let l = 1; l <= CONFIG.LEVELS_PER_WORLD; l++) if (bestStars(s, world, l) < 1) return false;
  return true;
}

export const totalStars = (s) => WORLDS.reduce((n, w) => n + worldStars(s, w.id), 0);
const totalClears = (s) => WORLDS.reduce((n, w) => n + Object.keys(s.progress[w.id] || {}).length, 0);
const anyStars = (s, min) => WORLDS.some((w) => Object.values(s.progress[w.id] || {}).some((v) => v >= min));

/** A world unlocks when the previous world's first level is cleared; level N needs level N-1. */
export function isLevelUnlocked(s, worldId, level) {
  const idx = WORLDS.findIndex((w) => w.id === worldId);
  if (idx < 0 || level < 1 || level > CONFIG.LEVELS_PER_WORLD) return false;
  if (idx > 0 && bestStars(s, WORLDS[idx - 1].id, 1) < 1) return false;
  return level === 1 || bestStars(s, worldId, level - 1) >= 1;
}

export const isWorldUnlocked = (s, worldId) => isLevelUnlocked(s, worldId, 1);

/**
 * Apply a finished round. Returns { save, reward, newAchievements } without mutating the input.
 * Anti-farming: coins are paid only for stars beyond the previous best (+5 for the first clear).
 */
export function applyRoundResult(save, { world, level, correct, total, stars }) {
  const next = structuredClone(save);
  const prev = bestStars(save, world, level);
  const gain = Math.max(0, stars - prev);
  const coins = gain > 0 ? gain * 10 + (prev === 0 ? 5 : 0) : 0;
  if (gain > 0) (next.progress[world] ||= {})[level] = stars;
  next.coins += coins;
  next.stats.answered += total;
  next.stats.correct += correct;
  next.stats.rounds += 1;

  const newAchievements = [];
  for (const a of ACHIEVEMENTS) {
    if (!next.achievements[a.id] && a.test(next)) {
      next.achievements[a.id] = true;
      newAchievements.push(a.id);
    }
  }
  return { save: next, reward: { coins, stars, improved: gain > 0 }, newAchievements };
}

// ---------- learning: mastery + spaced review of mistakes ----------

/** Local calendar day number (so "tomorrow" means the next day on the player's clock). */
export const dayNumber = (now = Date.now()) => Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);

/**
 * Record one answer. Wrong: the question joins the review list (due tomorrow) and stops counting as mastered.
 * Right: it counts as mastered; if it was in the review list and is due, it moves up one step (and leaves the list after the last).
 */
export function recordAnswer(s, id, ok, day) {
  const review = { ...s.review };
  let mastered = s.mastered;
  const cur = review[id];
  if (ok) {
    if (!mastered.includes(id)) mastered = [...mastered, id].slice(-CONFIG.MAX_ASKED);
    if (cur && day >= cur.due) {
      if (cur.box + 1 >= CONFIG.REVIEW_DAYS.length) delete review[id];
      else review[id] = { box: cur.box + 1, due: day + CONFIG.REVIEW_DAYS[cur.box + 1] };
    }
  } else {
    mastered = mastered.filter((x) => x !== id);
    review[id] = { box: 0, due: day + CONFIG.REVIEW_DAYS[0] };
  }
  return { ...s, review, mastered };
}

/** Missed questions, the ones that are due first (oldest due date first). */
export function reviewQueue(s, day) {
  return Object.entries(s.review)
    .sort((a, b) => Number(a[1].due > day) - Number(b[1].due > day) || a[1].due - b[1].due)
    .map(([id]) => id);
}

export const reviewDue = (s, day) => Object.values(s.review).filter((r) => r.due <= day).length;

/** Share of the world's questions (for the player's age group, 0 = all) that are currently mastered. */
export function worldMastery(s, bank, worldId, age = 0) {
  const pool = (bank[worldId] || []).filter((q) => !age || q.age === age);
  const known = pool.filter((q) => s.mastered.includes(q.id)).length;
  return { known, total: pool.length, pct: pool.length ? Math.round((known / pool.length) * 100) : 0 };
}
