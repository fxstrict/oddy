import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChallenge, questionLink, levelLink, findQuestion, baseUrl, waLink, tgLink } from '../src/ui/share.js';
import { QUESTIONS } from '../src/data/questions.js';
import { CONFIG, WORLDS } from '../src/config.js';
import ar from '../src/i18n/ar.js';
import en from '../src/i18n/en.js';

const BASE = 'https://example.github.io/knowledge-quest/';

test('baseUrl drops hash and query', () => {
  assert.equal(baseUrl({ origin: 'https://a.io', pathname: '/x/' }), 'https://a.io/x/');
});

test('question challenge link round-trips', () => {
  const id = QUESTIONS.math[0].id;
  const c = parseChallenge(new URL(questionLink(BASE, id, 'سارة')).hash);
  assert.deepEqual(c, { type: 'question', id, from: 'سارة' });
  assert.equal(findQuestion(QUESTIONS, id).world, 'math');
});

test('level challenge link round-trips', () => {
  const c = parseChallenge(new URL(levelLink(BASE, 'science', 2, 3, 'Omar')).hash);
  assert.deepEqual(c, { type: 'level', world: 'science', level: 2, stars: 3, from: 'Omar' });
});

test('links without a sender name still work', () => {
  assert.equal(parseChallenge(new URL(questionLink(BASE, QUESTIONS.math[0].id, '')).hash).from, '');
});

test('malformed or hostile hashes are rejected', () => {
  const bad = ['', '#', '#q=zzz_unknown', '#q=', '#w=math&l=9&s=2', '#w=nope&l=1&s=2', '#w=math&l=1&s=0', '#w=math&l=1&s=4', '#w=math&l=1.5&s=2',
    '#w=math&l=abc&s=2', '#random', `#q=${'a'.repeat(300)}`, '#q=<script>', null, undefined, 42];
  for (const h of bad) assert.equal(parseChallenge(h), null, String(h));
});

test('sender name is stripped of markup and capped at 20 chars', () => {
  const id = QUESTIONS.math[0].id;
  const c = parseChallenge(`#q=${id}&f=${encodeURIComponent('<img src=x onerror=1>' + 'x'.repeat(40))}`);
  assert.ok(!/[<>]/.test(c.from));
  assert.ok(c.from.length <= 20);
});

test('share targets are encoded URLs', () => {
  assert.match(waLink('a b&c'), /^https:\/\/wa\.me\/\?text=a%20b%26c$/);
  assert.match(tgLink('https://x.io/#q=1', 't'), /^https:\/\/t\.me\/share\/url\?url=https%3A%2F%2Fx\.io%2F%23q%3D1&text=t$/);
});

test('every share/challenge/story/new text exists in both languages', () => {
  const keys = Object.keys(ar).filter((k) => /^(share|challenge|new|story|menu\.invite|update\.new)/.test(k));
  assert.ok(keys.length >= 30);
  for (const k of keys) assert.ok(en[k], `missing en ${k}`);
  for (const w of WORLDS) {
    assert.ok(ar[`story.${w.id}`] && en[`story.${w.id}`], `story ${w.id}`);
  }
  assert.ok(CONFIG.LEVELS_PER_WORLD >= 1);
});
