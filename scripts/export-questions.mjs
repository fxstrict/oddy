// Exports the whole question bank to review/questions-review.csv for a teacher's linguistic/scientific review.
// Opens in Excel/Sheets (UTF-8 with BOM so Arabic displays correctly). Does not modify any game file.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { QUESTIONS } from '../src/data/questions.js';
import { WORLDS } from '../src/config.js';
import ar from '../src/i18n/ar.js';

export const HEADER = [
  'المعرّف', 'العالم', 'المستوى',
  'السؤال', 'الإجابة الصحيحة', 'الخيارات الخاطئة',
  'Question (EN)', 'Correct answer (EN)', 'Wrong options (EN)',
  'ملاحظات المعلم', 'الحالة (صحيح / يحتاج تعديل)',
];

const cell = (v) => `"${String(v).replaceAll('"', '""')}"`;

/** One row per question, in world order. */
export function buildRows() {
  const rows = [];
  for (const w of WORLDS) {
    for (const q of QUESTIONS[w.id] || []) {
      const right = q.o[q.c];
      const wrong = q.o.filter((_, i) => i !== q.c);
      rows.push([
        q.id, ar[`world.${w.id}`], q.d,
        q.q.ar, right.ar, wrong.map((x) => x.ar).join(' | '),
        q.q.en, right.en, wrong.map((x) => x.en).join(' | '),
        '', '',
      ]);
    }
  }
  return rows;
}

export function toCsv() {
  return '\uFEFF' + [HEADER, ...buildRows()].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = resolve(fileURLToPath(new URL('..', import.meta.url)), 'review');
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, 'questions-review.csv');
  writeFileSync(file, toCsv());
  console.log(`export: ${buildRows().length} questions -> ${file}`);
}
