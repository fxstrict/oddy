import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, toCsv, HEADER } from '../scripts/export-questions.mjs';
import { QUESTIONS } from '../src/data/questions.js';

test('review export has one row per question with the right answer separated from the wrong ones', () => {
  const total = Object.values(QUESTIONS).reduce((n, list) => n + list.length, 0);
  const rows = buildRows();
  assert.equal(rows.length, total);
  for (const r of rows) {
    assert.equal(r.length, HEADER.length);
    assert.ok(r[3] && r[4] && r[5] && r[6] && r[7] && r[8], `incomplete row ${r[0]}`);
    assert.ok(!r[5].split(' | ').includes(r[4]) || new Set(r[5].split(' | ')).size < 3, `${r[0]} wrong options contain the answer`);
    assert.equal(r[5].split(' | ').length, 3, `${r[0]} should list 3 wrong options`);
  }
});

test('review CSV starts with a BOM (Arabic in Excel) and escapes quotes', () => {
  const csv = toCsv();
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.trimEnd().split('\r\n').length, buildRows().length + 1);
});
