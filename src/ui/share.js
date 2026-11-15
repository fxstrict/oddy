// Invite a friend / challenge a friend. Links carry the challenge in the URL hash (#q=... or #w=...), so no
// server is needed and the hash is never sent over the network. Everything read from a link is validated.
import { CONFIG, WORLDS } from '../config.js';
import { QUESTIONS } from '../data/questions.js';
import { tf } from '../i18n/index.js';
import { shuffle } from '../game/engine.js';

const cleanName = (v) => (typeof v === 'string' ? v.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '');

/** The game's address without any hash/query (the link friends open). */
export function baseUrl(loc) {
  return `${loc.origin}${loc.pathname}`;
}

export function findQuestion(bank, id) {
  for (const worldId of Object.keys(bank)) {
    const q = bank[worldId].find((x) => x.id === id);
    if (q) return { world: worldId, q };
  }
  return null;
}

export function questionLink(base, qid, from) {
  const p = new URLSearchParams({ q: qid });
  if (cleanName(from)) p.set('f', cleanName(from));
  return `${base}#${p}`;
}

export function levelLink(base, world, level, stars, from) {
  const p = new URLSearchParams({ w: world, l: String(level), s: String(stars) });
  if (cleanName(from)) p.set('f', cleanName(from));
  return `${base}#${p}`;
}

/**
 * Reads a challenge from location.hash. Returns null for anything missing/unknown/malformed:
 *  { type: 'question', id, from } | { type: 'level', world, level, stars, from }
 */
export function parseChallenge(hash, bank = QUESTIONS) {
  if (typeof hash !== 'string' || hash.length < 3 || hash.length > 200) return null;
  let p;
  try {
    p = new URLSearchParams(hash.replace(/^#/, ''));
  } catch {
    return null;
  }
  const from = cleanName(p.get('f') || '');
  const qid = p.get('q');
  if (qid) return /^[a-z0-9_-]{1,12}$/i.test(qid) && findQuestion(bank, qid) ? { type: 'question', id: qid, from } : null;
  const world = p.get('w');
  const level = Number(p.get('l'));
  const stars = Number(p.get('s'));
  if (!world || !WORLDS.some((w) => w.id === world)) return null;
  if (!Number.isInteger(level) || level < 1 || level > CONFIG.LEVELS_PER_WORLD) return null;
  if (!Number.isInteger(stars) || stars < 1 || stars > 3) return null;
  return { type: 'level', world, level, stars, from };
}

export const waLink = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const tgLink = (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

/**
 * @param {{doc: Document, win?: Window, nav?: Navigator, getLang: () => string, getSave: () => any,
 *          toast: (m: string) => void, startChallenge: (world: string, level: number, o: object) => void,
 *          goMap: () => void}} o
 */
export function createShare({ doc, win = window, nav = navigator, getLang, getSave, toast, startChallenge, goMap }) {
  const $ = (id) => doc.getElementById(id);
  const tr = (key, p) => tf(getLang(), key, p);
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  const myName = () => getSave().profile.name;
  const base = () => baseUrl(win.location);

  // ---------- sending ----------
  let pending = null; // { text, url }
  async function send({ title, text, url }) {
    pending = { text: `${text}\n${url}`, url, rawText: text };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title, text, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // the player closed the system sheet: nothing to do
      }
    }
    openShareDialog();
  }

  function openShareDialog() {
    const dlg = $('dlg-share');
    $('share-text').value = pending.text;
    $('share-wa').href = waLink(pending.text);
    $('share-tg').href = tgLink(pending.url, pending.rawText);
    if (!dlg.open) dlg.showModal();
    $('share-wa').focus();
  }

  async function copy() {
    const text = pending?.text || '';
    try {
      await nav.clipboard.writeText(text);
    } catch {
      const area = $('share-text');
      area.focus();
      area.select();
      try {
        doc.execCommand('copy');
      } catch {
        /* the text stays selected so the player can copy it by hand */
      }
    }
    toast(tr('share.copied'));
  }

  const invite = () => send({ title: tr('app.title'), text: tr('share.inviteText'), url: base() });

  function shareQuestion(qid) {
    const hit = findQuestion(QUESTIONS, qid);
    if (!hit) return;
    return send({
      title: tr('app.title'),
      text: tr('share.questionText', { q: hit.q.q[getLang()] }),
      url: questionLink(base(), qid, myName()),
    });
  }

  function shareLevel(world, level, starCount) {
    if (starCount < 1) return;
    return send({
      title: tr('app.title'),
      text: tr('share.levelText', { stars: stars(starCount), world: tr(`world.${world}`), n: level }),
      url: levelLink(base(), world, level, starCount, myName()),
    });
  }

  // ---------- receiving a challenge ----------
  const friend = (c) => c.from || tr('challenge.friend');

  function openQuestionChallenge(c) {
    const hit = findQuestion(QUESTIONS, c.id);
    if (!hit) return false;
    const l = getLang();
    const dlg = $('dlg-challenge');
    $('ch-title').textContent = tr('challenge.title', { name: friend(c) });
    $('ch-text').textContent = hit.q.q[l];
    $('ch-result').textContent = '';
    $('ch-result').dataset.state = '';
    $('ch-actions').hidden = true;
    $('ch-accept').hidden = true;
    const box = $('ch-options');
    box.hidden = false;
    const opts = shuffle(hit.q.o.map((text, i) => ({ text, ok: i === hit.q.c })));
    box.replaceChildren(
      ...opts.map((opt) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'option';
        b.innerHTML = '<span class="option__text"></span>';
        b.querySelector('.option__text').textContent = opt.text[l];
        b.addEventListener('click', () => {
          box.querySelectorAll('button').forEach((x) => (x.disabled = true));
          b.classList.add(opt.ok ? 'option--right' : 'option--wrong');
          if (!opt.ok) box.children[opts.findIndex((x) => x.ok)]?.classList.add('option--right');
          $('ch-result').textContent = tr(opt.ok ? 'challenge.right' : 'challenge.wrong');
          $('ch-result').dataset.state = opt.ok ? 'ok' : 'bad';
          $('ch-actions').hidden = false;
          $('ch-share').onclick = () => shareQuestion(c.id);
          $('ch-play').focus();
        });
        return b;
      }),
    );
    if (!dlg.open) dlg.showModal();
    box.firstElementChild?.focus();
    return true;
  }

  function openLevelChallenge(c) {
    const dlg = $('dlg-challenge');
    $('ch-title').textContent = tr('challenge.title', { name: friend(c) });
    $('ch-text').textContent = tr('challenge.levelText', { stars: stars(c.stars), world: tr(`world.${c.world}`), n: c.level });
    $('ch-result').textContent = '';
    $('ch-result').dataset.state = '';
    $('ch-options').hidden = true;
    $('ch-options').replaceChildren();
    $('ch-actions').hidden = true;
    const accept = $('ch-accept');
    accept.hidden = false;
    accept.onclick = () => {
      dlg.close();
      startChallenge(c.world, c.level, { friendStars: c.stars, from: friend(c) });
    };
    if (!dlg.open) dlg.showModal();
    accept.focus();
    return true;
  }

  /** Opens the dialog for a parsed challenge. */
  function open(c) {
    if (!c) return false;
    return c.type === 'question' ? openQuestionChallenge(c) : openLevelChallenge(c);
  }

  $('btn-invite')?.addEventListener('click', invite);
  $('share-copy').addEventListener('click', copy);
  $('ch-play').addEventListener('click', () => {
    $('dlg-challenge').close();
    goMap();
  });
  $('ch-close').addEventListener('click', () => $('dlg-challenge').close());

  return { invite, shareQuestion, shareLevel, open };
}
