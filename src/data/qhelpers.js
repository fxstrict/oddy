// Shared builders for question files. o = option { ar, en }. Q = question. c = index of the correct option.
export const o = (ar, en = ar) => ({ ar, en });
export const Q = (id, d, ar, en, opts, c) => ({ id, d, q: { ar, en }, o: opts, c });

// QA = question with an age group (1 kids, 2 juniors, 3 teens/adults) and a short explanation shown after answering.
export const QA = (id, d, age, ar, en, opts, c, exAr, exEn) => ({ id, d, age, q: { ar, en }, o: opts, c, e: { ar: exAr, en: exEn } });
// T = tag a group of questions with a topic (for teacher review / future filtering).
export const T = (topic, list) => list.map((q) => ({ ...q, topic }));
