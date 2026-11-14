import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/questions.js';
import { WORLDS, CONFIG } from '../src/config.js';

test('every world has at least 10 questions per level tier (20+ per world)', () => {
  for (const w of WORLDS) {
    assert.ok((QUESTIONS[w.id] || []).length >= 20, `${w.id} has fewer than 20 questions`);
    for (let d = 1; d <= CONFIG.LEVELS_PER_WORLD; d++) {
      const n = (QUESTIONS[w.id] || []).filter((q) => q.d === d).length;
      assert.ok(n >= 10 && n >= CONFIG.ROUND_SIZE, `${w.id} tier ${d} has only ${n}`);
    }
  }
});

test('no question bank for an unknown world and no duplicate question texts', () => {
  const worlds = new Set(WORLDS.map((w) => w.id));
  for (const id of Object.keys(QUESTIONS)) assert.ok(worlds.has(id), `unknown world bank: ${id}`);
  for (const lang of CONFIG.LANGS) {
    const seen = new Set();
    for (const list of Object.values(QUESTIONS)) {
      for (const q of list) {
        const key = q.q[lang];
        assert.ok(!seen.has(key), `duplicate ${lang} question text: ${key}`);
        seen.add(key);
      }
    }
  }
});

test('correct answers are spread over the option positions', () => {
  for (const [id, list] of Object.entries(QUESTIONS)) {
    assert.ok(new Set(list.map((q) => q.c)).size >= 2, `${id}: correct index never varies`);
  }
});

test('questions are well formed in both languages', () => {
  const ids = new Set();
  for (const list of Object.values(QUESTIONS)) {
    for (const q of list) {
      assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
      ids.add(q.id);
      assert.equal(q.o.length, 4, `${q.id} needs 4 options`);
      assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < 4, `${q.id} bad correct index`);
      for (const lang of CONFIG.LANGS) {
        assert.ok(q.q[lang]?.trim(), `${q.id} missing ${lang} text`);
        const texts = q.o.map((o) => o[lang]);
        assert.ok(texts.every((x) => x?.trim()), `${q.id} empty ${lang} option`);
        assert.equal(new Set(texts).size, 4, `${q.id} duplicate ${lang} options`);
      }
    }
  }
});
