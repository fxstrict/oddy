// Shared builders for question files. o = option { ar, en }. Q = question. c = index of the correct option.
export const o = (ar, en = ar) => ({ ar, en });
export const Q = (id, d, ar, en, opts, c) => ({ id, d, q: { ar, en }, o: opts, c });
