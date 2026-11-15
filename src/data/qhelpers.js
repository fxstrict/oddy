// Shared builders for question files. o = option { ar, en }. Q = question. c = index of the correct option.
export const o = (ar, en = ar) => ({ ar, en });
export const Q = (id, d, ar, en, opts, c) => ({ id, d, q: { ar, en }, o: opts, c });

// QA = question with an age group (1 kids, 2 juniors, 3 teens/adults) and a short explanation shown after answering.
export const QA = (id, d, age, ar, en, opts, c, exAr, exEn) => ({ id, d, age, q: { ar, en }, o: opts, c, e: { ar: exAr, en: exEn } });
// T = tag a group of questions with a topic (for teacher review / future filtering).
export const T = (topic, list) => list.map((q) => ({ ...q, topic }));

// ---- question types (v0.8). `type` defaults to a 4-option multiple choice. ----
const ex = (ar, en) => ({ ar, en });
/** True / false: a statement; `truth` says whether it is right. Two options, so every multiple-choice rule still applies. */
export const TF = (id, d, age, ar, en, truth, exAr, exEn) => ({
  id, d, age, type: 'tf',
  q: { ar: `صح أم خطأ: ${ar}`, en: `True or false: ${en}` },
  o: [o('صح', 'True'), o('خطأ', 'False')], c: truth ? 0 : 1, e: ex(exAr, exEn),
});
/** Type the answer. `accAr` / `accEn` list the accepted spellings (the game ignores case, diacritics, "ال", ة/ه, أ/ا, ى/ي). */
export const FILL = (id, d, age, ar, en, accAr, accEn, exAr, exEn) => ({
  id, d, age, type: 'fill', q: { ar, en }, a: { ar: accAr, en: accEn }, o: [], c: 0, e: ex(exAr, exEn),
});
/** Put the items in order. `items` is the CORRECT order, each an o(ar, en). */
export const ORDER = (id, d, age, ar, en, items, exAr, exEn) => ({
  id, d, age, type: 'order', q: { ar, en }, items, o: [], c: 0, e: ex(exAr, exEn),
});
/** Match pairs. `pairs` is a list of [leftOption, rightOption], each an o(ar, en). */
export const MATCH = (id, d, age, ar, en, pairs, exAr, exEn) => ({
  id, d, age, type: 'match', q: { ar, en }, pairs: pairs.map(([l, r]) => ({ l, r })), o: [], c: 0, e: ex(exAr, exEn),
});
