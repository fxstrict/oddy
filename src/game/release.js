// "What's new" data. Pure: no DOM, no network. The build writes a description of the published game into
// version.json (worlds with names, stages per world, question count, optional notes); the running game compares it
// with its own description and tells the player what the update brings.
import { CONFIG, WORLDS } from '../config.js';

const str = (v, max) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : '');
const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1e6, Math.trunc(v))) : 0);

/** Description of a build. `names(id)` -> { ar, en } gives each world's display name. */
export function describeBuild({ worlds = WORLDS, levels = CONFIG.LEVELS_PER_WORLD, questions = 0, names, notes } = {}) {
  const out = {
    worlds: worlds.map((w) => ({ id: w.id, icon: w.icon, name: names ? names(w.id) : { ar: w.id, en: w.id } })),
    levels,
    questions,
  };
  if (notes && (notes.ar || notes.en)) out.notes = { ar: notes.ar || '', en: notes.en || '' };
  return out;
}

/** Validates a description coming from the network (version.json). Returns null if it has no usable part. */
export function sanitizeRelease(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.worlds)) return null;
  const worlds = raw.worlds
    .filter((w) => w && typeof w.id === 'string' && /^[a-z0-9_-]{1,24}$/.test(w.id))
    .slice(0, 64)
    .map((w) => ({
      id: w.id,
      icon: str(w.icon, 8) || '🗺️',
      name: { ar: str(w.name?.ar, 40) || w.id, en: str(w.name?.en, 40) || w.id },
    }));
  const notes = raw.notes ? { ar: str(raw.notes.ar, 200), en: str(raw.notes.en, 200) } : null;
  return { worlds, levels: num(raw.levels), questions: num(raw.questions), notes: notes && (notes.ar || notes.en) ? notes : null };
}

/**
 * What the published build adds on top of the running one.
 * Returns { newWorlds, newLevels, newQuestions, notes } or null when there is nothing to announce.
 */
export function diffRelease(local, remote) {
  const r = sanitizeRelease(remote);
  if (!r || !local) return null;
  const have = new Set(local.worlds.map((w) => w.id));
  const newWorlds = r.worlds.filter((w) => !have.has(w.id));
  const newLevels = Math.max(0, r.levels - num(local.levels));
  const newQuestions = Math.max(0, r.questions - num(local.questions));
  if (!newWorlds.length && !newLevels && !newQuestions && !r.notes) return null;
  return { newWorlds, newLevels, newQuestions, notes: r.notes };
}
