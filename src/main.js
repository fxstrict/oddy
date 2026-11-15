import { CONFIG } from './config.js';
import { applyLanguage, t, tf } from './i18n/index.js';
import { loadPrefs, savePrefs, ageOf } from './ui/prefs.js';
import { createRouter } from './ui/router.js';
import { createGame } from './ui/game.js';
import { playSound } from './ui/sound.js';
import { runSplash } from './ui/splash.js';
import { runIntro } from './ui/intro.js';
import { createUpdatePrompt } from './ui/update.js';
import { createShare, parseChallenge } from './ui/share.js';
import { ACHIEVEMENTS, loadSave, writeSave, totalStars, baselineSeen, newWorldIds, hasNewContent } from './game/save.js';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

const storage = getStorage();
const prefs = loadPrefs(storage);
let save = baselineSeen(loadSave(storage)); // first run: everything that exists now counts as seen
const incoming = parseChallenge(window.location.hash); // challenge link from a friend (#q=... / #w=...)
let hasStoredPrefs = false;
try {
  hasStoredPrefs = storage?.getItem(CONFIG.PREFS_KEY) != null;
} catch {
  hasStoredPrefs = false;
}
if (!hasStoredPrefs) {
  // First visit: honour the OS reduced-motion setting.
  prefs.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const $ = (id) => document.getElementById(id);
const SCENES = { menu: 'menu', play: 'tree', game: 'swamp', achievements: 'tree', settings: 'tree', help: 'tree' };

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  $('toasts').append(el);
  setTimeout(() => el.remove(), 3500);
}

const router = createRouter(document, {
  onChange(name) {
    document.body.dataset.scene = SCENES[name] || 'menu';
    if (name === 'play') game.renderMap();
    if (name === 'menu') game.renderDaily();
    if (name === 'achievements') renderAchievements();
  },
  onEscape: (name) => game.handleEscape(name),
});

const game = createGame({
  doc: document,
  router,
  getPrefs: () => prefs,
  getSave: () => save,
  setSave(next) {
    save = next;
    writeSave(storage, save);
    renderStatic();
  },
  toast,
});

// "New update available - press Update": asked on every open (after the splash), on returning to the
// game and when the connection comes back; never in the middle of a round.
const share = createShare({
  doc: document,
  getLang: () => prefs.lang,
  getSave: () => save,
  toast,
  startChallenge: (world, level, opts) => game.startChallenge(world, level, opts),
  goMap: () => router.show('play'),
});
game.setSharer(share);

const updater = createUpdatePrompt({
  doc: document,
  getLang: () => prefs.lang,
  canShow: () => !game.isPlaying() && document.body.dataset.splash === 'off',
});

function renderAchievements() {
  const list = $('ach-list');
  const done = ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length;
  $('ach-count').textContent = tf(prefs.lang, 'ach.count', { a: done, b: ACHIEVEMENTS.length });
  list.replaceChildren(
    ...ACHIEVEMENTS.map((a) => {
      const on = !!save.achievements[a.id];
      const li = document.createElement('li');
      li.className = 'ach' + (on ? ' ach--on' : '');
      li.innerHTML = '<span class="ach__icon" aria-hidden="true"></span><span><strong class="ach__name"></strong><br><span class="ach__desc"></span></span>';
      li.querySelector('.ach__icon').textContent = on ? '🏆' : '🔒';
      li.querySelector('.ach__name').textContent = t(prefs.lang, `ach.${a.id}.name`);
      li.querySelector('.ach__desc').textContent = t(prefs.lang, `ach.${a.id}.desc`) + (on ? '' : ` (${t(prefs.lang, 'ach.locked')})`);
      return li;
    }),
  );
}

function renderAvatars() {
  const wrap = $('avatar-list');
  wrap.replaceChildren(
    ...CONFIG.AVATARS.map((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'avatar';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(save.profile.avatar === a));
      b.textContent = a;
      b.addEventListener('click', () => updateProfile({ avatar: a }));
      return b;
    }),
  );
}

function updateProfile(patch) {
  save = { ...save, profile: { ...save.profile, ...patch } };
  writeSave(storage, save);
  renderStatic();
  renderAvatars();
}

function renderNews() {
  const btn = $('menu-news');
  const ids = newWorldIds(save);
  const any = hasNewContent(save);
  btn.hidden = !any;
  if (!any) return;
  btn.textContent = ids.length === 1 ? tf(prefs.lang, 'new.menuWorld', { name: t(prefs.lang, `world.${ids[0]}`) })
    : ids.length > 1 ? tf(prefs.lang, 'new.menuWorlds', { n: ids.length })
    : t(prefs.lang, 'new.menuLevels');
}

function renderStatic() {
  renderNews();
  $('chip-coins').textContent = `${save.profile.avatar} 🪙 ${save.coins} · ★ ${totalStars(save)}`;
  $('chip-coins').setAttribute('aria-label', `${t(prefs.lang, 'top.coins')}: ${save.coins}`);
  const hello = $('menu-hello');
  hello.hidden = !save.profile.name;
  hello.textContent = save.profile.name ? tf(prefs.lang, 'menu.hello', { name: save.profile.name }) : '';
}

function render() {
  applyLanguage(document, prefs.lang);
  document.documentElement.dataset.reducedMotion = String(prefs.reducedMotion);

  const muteLabel = t(prefs.lang, prefs.muted ? 'top.unmute' : 'top.mute');
  $('btn-mute').setAttribute('aria-pressed', String(prefs.muted));
  $('btn-mute').setAttribute('aria-label', muteLabel);
  $('btn-mute').textContent = prefs.muted ? '🔇' : '🔊';

  $('btn-lang').textContent = t(prefs.lang, 'top.lang');
  $('btn-lang').setAttribute('aria-label', t(prefs.lang, 'top.langLabel'));

  $('opt-lang-' + prefs.lang).checked = true;
  $('opt-difficulty').value = prefs.difficulty;
  $('opt-age').value = String(ageOf(prefs));
  document.body.dataset.age = String(ageOf(prefs));
  $('opt-sound').checked = !prefs.muted;
  $('opt-read').checked = prefs.read;
  $('opt-motion').checked = prefs.reducedMotion;
  if (document.activeElement !== $('opt-name')) $('opt-name').value = save.profile.name;
  renderStatic();
  renderAvatars();
  if (router.current === 'play') game.renderMap();
  if (router.current === 'achievements') renderAchievements();
  game.renderDaily();
  game.refresh();
}

function update(patch) {
  Object.assign(prefs, patch);
  savePrefs(storage, prefs);
  render();
}

router.show('menu', { focus: false });
if (incoming) {
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); // a refresh must not reopen it
  } catch {
    /* ignore */
  }
}
$('menu-news').addEventListener('click', () => router.show('play'));
render();
// "Who is playing?" is asked once. Kids get the relaxed difficulty (no timer); it can be changed in Settings.
function askAge() {
  return new Promise((resolve) => {
    const dlg = $('dlg-age');
    const done = (age) => {
      dlg.close();
      if (age) update({ age, ...(age === 1 ? { difficulty: 'easy', read: true } : {}) });
      resolve();
    };
    dlg.querySelectorAll('[data-age]').forEach((b) => (b.onclick = () => done(Number(b.dataset.age))));
    dlg.oncancel = (e) => {
      e.preventDefault();
      done(0);
    };
    dlg.showModal();
    $('age-title').focus();
  });
}
async function showIntro() {
  await runIntro(document, () => prefs.lang);
  if (!save.seenIntro) {
    save = { ...save, seenIntro: true };
    writeSave(storage, save);
  }
}
runSplash(document, () => prefs.lang).then(async () => {
  playSound('click', prefs.muted);
  if (!save.seenIntro) await showIntro(); // never stack the update dialog on top of the intro
  if (!prefs.age) await askAge();
  // The update prompt comes first (it lists what is new); a friend's challenge opens right after it is dismissed.
  const shown = await Promise.race([updater.check({ force: true }), new Promise((r) => setTimeout(() => r(false), 3000))]);
  const openChallenge = () => incoming && share.open(incoming);
  if (shown) $('dlg-update').addEventListener('close', openChallenge, { once: true });
  else openChallenge();
});
$('btn-intro-replay').addEventListener('click', showIntro);

$('btn-lang').addEventListener('click', () => update({ lang: prefs.lang === 'ar' ? 'en' : 'ar' }));
$('btn-mute').addEventListener('click', () => update({ muted: !prefs.muted }));
document.querySelectorAll('input[name="opt-lang"]').forEach((input) => {
  input.addEventListener('change', () => update({ lang: input.value }));
});
$('opt-difficulty').addEventListener('change', (e) => {
  if (CONFIG.DIFFICULTIES.includes(e.target.value)) update({ difficulty: e.target.value });
});
$('opt-age').addEventListener('change', (e) => {
  const age = Number(e.target.value);
  if (CONFIG.AGES.includes(age)) update({ age });
});
$('opt-sound').addEventListener('change', (e) => update({ muted: !e.target.checked }));
$('opt-read').addEventListener('change', (e) => update({ read: e.target.checked }));
$('opt-motion').addEventListener('change', (e) => update({ reducedMotion: e.target.checked }));
$('opt-name').addEventListener('input', (e) => {
  save = { ...save, profile: { ...save.profile, name: e.target.value.replace(/[<>]/g, '').slice(0, 20) } };
  writeSave(storage, save);
  renderStatic();
});
$('btn-reset').addEventListener('click', async () => {
  if (!(await game.confirmDialog(t(prefs.lang, 'settings.resetConfirm')))) return;
  const keep = save.profile;
  save = loadSave(null);
  save.profile = keep;
  save.seenIntro = true;
  save = baselineSeen(save);
  writeSave(storage, save);
  render();
});
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn, .node, .world-card')) playSound('click', prefs.muted);
});

// ---------- PWA: install prompt + service worker ----------
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  $('btn-install').hidden = false;
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  $('btn-install').hidden = true;
});
$('btn-install').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice.catch(() => {});
  installEvent = null;
  $('btn-install').hidden = true;
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state !== 'installed') return;
            if (!navigator.serviceWorker.controller) toast(t(prefs.lang, 'sw.ready'));
            else updater.check({ force: true }); // a newer version finished downloading: offer it now
          });
        });
      })
      .catch(() => {});
  });
}
