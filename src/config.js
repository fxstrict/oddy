// Central configuration. Pure data, no DOM access, safe to import from tests.

export const CONFIG = Object.freeze({
  APP_NAME: 'Knowledge Quest',
  SAVE_VERSION: 2,
  SAVE_KEY: 'knowledgeQuest.save',
  PREFS_KEY: 'knowledgeQuest.prefs',
  DEFAULT_LANG: 'ar',
  LANGS: Object.freeze(['ar', 'en']),
  DIFFICULTIES: Object.freeze(['easy', 'normal', 'challenge']),
  DEFAULT_DIFFICULTY: 'normal',
  LEVELS_PER_WORLD: 2,
  ROUND_SIZE: 5,
  AGES: Object.freeze([1, 2, 3]), // 1 = kids 6-9, 2 = juniors 10-14, 3 = teens/adults 15+
  DEFAULT_AGE: 2,
  NEXT_AGE_MIX: 1, // questions per round borrowed from the next age group
  REVIEW_DAYS: Object.freeze([1, 3]), // spaced repetition: a missed question returns after 1 day, then after 3
  MAX_ASKED: 600,
  AVATARS: Object.freeze(['🦊', '🐼', '🦉', '🐯', '🐸', '🦄', '🐙', '🚀']),
});

// x / y are percentages on the sky-islands map image (720x439). Order = unlock order (follows the ladders).
export const WORLDS = Object.freeze([
  { id: 'math', color: '#f4b942', icon: '➗', x: 14, y: 29 },
  { id: 'history', color: '#8e7dbe', icon: '🏛️', x: 37, y: 17 },
  { id: 'science', color: '#3fb8af', icon: '🔬', x: 60, y: 29 },
  { id: 'languages', color: '#ef6f6c', icon: '🔤', x: 86, y: 21 },
  { id: 'general', color: '#5aa9e6', icon: '💡', x: 86, y: 64 },
  { id: 'tech', color: '#e07b39', icon: '💻', x: 61, y: 77 },
  { id: 'nature', color: '#4cae6a', icon: '🌴', x: 37, y: 62 },
  { id: 'health', color: '#e0607e', icon: '🍎', x: 10, y: 72 },
]);

// All eight islands of the map are playable now; kept (empty) so new "coming soon" islands can be added later.
export const FUTURE_ISLANDS = Object.freeze([]);

export const RTL_LANGS = Object.freeze(['ar']);
