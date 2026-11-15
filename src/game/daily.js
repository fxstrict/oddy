// Daily challenge: the same 5 questions for everyone of the same age group on the same day, without a server.
// The day number seeds a small deterministic random generator.
import { CONFIG } from '../config.js';
import { shuffle, roundFromQuestions } from './engine.js';

/** Small deterministic PRNG (mulberry32): same seed, same sequence. */
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One question from each of `size` different worlds (the world order and the questions depend only on day + age). */
export function dailyQuestions(bank, day, age, size = CONFIG.DAILY_SIZE) {
  const rng = seededRng(day * 7919 + age * 104729 + 17);
  const worlds = shuffle(Object.keys(bank).sort(), rng);
  const picked = [];
  for (let i = 0; i < size; i++) {
    const list = bank[worlds[i % worlds.length]];
    const pool = list.filter((q) => q.age === age);
    const from = pool.length ? pool : list;
    picked.push(from[Math.floor(rng() * from.length)]);
  }
  return roundFromQuestions(picked, rng);
}
