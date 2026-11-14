// First-run intro: three short steps (story, how to play, rewards). Shown once; replayable from Help.
import { tf } from '../i18n/index.js';

const STEPS = [
  { icon: '🌳', key: 'intro.s1' },
  { icon: '🗺️', key: 'intro.s2' },
  { icon: '⭐', key: 'intro.s3' },
];

/** @returns {Promise<void>} resolves when the player finishes or skips. */
export function runIntro(doc, getLang) {
  const dlg = doc.getElementById('dlg-intro');
  if (!dlg || typeof dlg.showModal !== 'function') return Promise.resolve();
  const $ = (id) => doc.getElementById(id);
  let i = 0;

  return new Promise((resolve) => {
    const render = () => {
      const lang = getLang();
      const s = STEPS[i];
      const last = i === STEPS.length - 1;
      $('intro-icon').textContent = s.icon;
      $('intro-title').textContent = tf(lang, `${s.key}.title`);
      $('intro-text').textContent = tf(lang, `${s.key}.text`);
      $('intro-step').textContent = tf(lang, 'intro.step', { a: i + 1, b: STEPS.length });
      $('intro-next').textContent = tf(lang, last ? 'intro.go' : 'intro.next');
      $('intro-skip').textContent = tf(lang, 'intro.skip');
      $('intro-skip').hidden = last;
    };
    const finish = () => {
      $('intro-next').onclick = $('intro-skip').onclick = dlg.oncancel = null;
      if (dlg.open) dlg.close();
      resolve();
    };
    $('intro-next').onclick = () => {
      if (i >= STEPS.length - 1) return finish();
      i += 1;
      render();
      $('intro-next').focus();
    };
    $('intro-skip').onclick = finish;
    dlg.oncancel = (e) => {
      e.preventDefault();
      finish();
    };
    render();
    dlg.showModal();
    $('intro-next').focus();
  });
}
