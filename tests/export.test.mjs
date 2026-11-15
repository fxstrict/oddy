import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, toCsv, HEADER } from '../scripts/export-questions.mjs';
import { QUESTIONS } from '../src/data/questions.js';

test('review export has one row per question with the right answer separated from the wrong ones', () => {
  const total = Object.values(QUESTIONS).reduce((n, list) => n + list.length, 0);
  const rows = buildRows();
  assert.equal(rows.length, total);
  const col = (name) => HEADER.indexOf(name);
  const [qAr, rightAr, wrongAr, qEn, rightEn, wrongEn, exAr, exEn] = ['السؤال', 'الإجابة الصحيحة', 'الخيارات الخاطئة', 'Question (EN)', 'Correct answer (EN)', 'Wrong options (EN)', 'الشرح', 'Explanation (EN)'].map(col);
  assert.ok([qAr, rightAr, wrongAr, qEn, rightEn, wrongEn, exAr, exEn, col('الفئة العمرية'), col('التصنيف'), col('المصدر')].every((i) => i >= 0));
  for (const r of rows) {
    assert.equal(r.length, HEADER.length);
    const typ = r[col('النوع')];
    assert.ok(r[qAr] && r[rightAr] && r[qEn] && r[rightEn], `incomplete row ${r[0]}`);
    assert.ok(r[exAr] && r[exEn] && r[col('الفئة العمرية')], `${r[0]} needs an explanation and an age group`);
    const wantWrong = { mc: 3, tf: 1 }[typ] ?? 0;
    assert.equal(r[wrongAr] ? r[wrongAr].split(' | ').length : 0, wantWrong, `${r[0]} (${typ}) wrong options`);
    assert.equal(r[wrongEn] ? r[wrongEn].split(' | ').length : 0, wantWrong, `${r[0]} (${typ}) wrong options EN`);
    assert.ok(!r[wrongAr].split(' | ').includes(r[rightAr]), `${r[0]} wrong options contain the answer`);
  }
});

test('review CSV starts with a BOM (Arabic in Excel) and escapes quotes', () => {
  const csv = toCsv();
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(csv.trimEnd().split('\r\n').length, buildRows().length + 1);
});
