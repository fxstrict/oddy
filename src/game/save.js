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
  };
}

const int = (n, min, max) => (Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : min);

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
