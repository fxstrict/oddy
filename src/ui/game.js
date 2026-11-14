// Gameplay UI: world map, level dialog, question screen, pause and result dialogs.
import { CONFIG, WORLDS, FUTURE_ISLANDS } from '../config.js';
import { QUESTIONS } from '../data/questions.js';
import { tf } from '../i18n/index.js';
import * as engine from '../game/engine.js';
import * as store from '../game/save.js';
import { playSound } from './sound.js';

const LETTERS = { ar: ['أ', 'ب', 'ج', 'د'], en: ['A', 'B', 'C', 'D'] };

export function createGame({ doc, router, getPrefs, getSave, setSave, toast }) {
  const $ = (id) => doc.getElementById(id);
  const lang = () => getPrefs().lang;
  const tr = (key, p) => tf(lang(), key, p);
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

  let round = null;
  let ctx = null; // { world, level }
  let deadline = 0;
  let remainingMs = 0;
  let timerId = null;
  let paused = false;

  // ---------- dialogs ----------
  function openDialog(dlg) {
    if (!dlg.open) dlg.showModal();
  }
  function closeDialog(dlg) {
    if (dlg.open) dlg.close();
  }
  function confirmDialog(message) {
    return new Promise((resolve) => {
      const dlg = $('dlg-confirm');
      $('dlg-confirm-text').textContent = message;
      const done = (v) => {
        $('confirm-yes').onclick = $('confirm-no').onclick = dlg.oncancel = null;
        closeDialog(dlg);
        resolve(v);
      };
      $('confirm-yes').onclick = () => done(true);
      $('confirm-no').onclick = () => done(false);
      dlg.oncancel = (e) => {
        e.preventDefault();
        done(false);
      };
      openDialog(dlg);
      $('confirm-no').focus();
    });
  }

  // ---------- world map ----------
  function worldLabel(w) {
    const save = getSave();
    const name = tr(`world.${w.id}`);
    if (!store.isWorldUnlocked(save, w.id)) return `${name}: ${tr('play.locked')}`;
    return `${name}: ${tr('play.stars', { n: store.worldStars(save, w.id), max: store.maxWorldStars() })}`;
  }

  function renderMap() {
    const save = getSave();
    const map = $('map');
    const nodes = WORLDS.map((w) => {
      const unlocked = store.isWorldUnlocked(save, w.id);
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'node' + (unlocked ? '' : ' node--locked');
      b.style.cssText = `left:${w.x}%;top:${w.y}%;--world-color:${w.color}`;
      b.setAttribute('aria-label', worldLabel(w));
      if (!unlocked) b.setAttribute('aria-disabled', 'true');
      b.innerHTML = `<span class="node__icon" aria-hidden="true">${unlocked ? w.icon : '🔒'}</span><span class="node__stars" aria-hidden="true">${unlocked ? '★' + store.worldStars(save, w.id) : ''}</span>`;
      b.addEventListener('click', () => openWorld(w.id));
      return b;
    });
    const future = FUTURE_ISLANDS.map((f) => {
      const s = doc.createElement('span');
      s.className = 'node node--future';
      s.style.cssText = `left:${f.x}%;top:${f.y}%`;
      s.setAttribute('role', 'img');
      s.setAttribute('aria-label', tr('play.soon'));
      s.textContent = '🔒';
      return s;
    });
    map.replaceChildren(...nodes, ...future);

    $('world-list').replaceChildren(
      ...WORLDS.map((w) => {
        const unlocked = store.isWorldUnlocked(save, w.id);
        const li = doc.createElement('li');
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'world-card' + (unlocked ? '' : ' world-card--locked');
        b.style.setProperty('--world-color', w.color);
        if (!unlocked) b.setAttribute('aria-disabled', 'true');
        b.innerHTML = `<span class="world-card__icon" aria-hidden="true">${unlocked ? w.icon : '🔒'}</span><span class="world-card__name"></span><span class="world-card__stars"></span>`;
        b.querySelector('.world-card__name').textContent = tr(`world.${w.id}`);
        b.querySelector('.world-card__stars').textContent = unlocked ? `★ ${store.worldStars(save, w.id)}/${store.maxWorldStars()}` : tr('play.locked');
        b.addEventListener('click', () => openWorld(w.id));
        li.append(b);
        return li;
      }),
    );
  }

  function openWorld(worldId) {
    const save = getSave();
    if (!store.isWorldUnlocked(save, worldId)) {
      toast(tr('play.locked'));
      playSound('wrong', getPrefs().muted);
      return;
    }
    const w = WORLDS.find((x) => x.id === worldId);
    $('dlg-world-title').textContent = `${w.icon} ${tr(`world.${worldId}`)}`;
    $('dlg-world-stars').textContent = tr('play.stars', { n: store.worldStars(save, worldId), max: store.maxWorldStars() });
    const wrap = $('dlg-world-levels');
    wrap.replaceChildren();
    for (let lvl = 1; lvl <= CONFIG.LEVELS_PER_WORLD; lvl++) {
      const open = store.isLevelUnlocked(save, worldId, lvl);
      const best = store.bestStars(save, worldId, lvl);
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'btn level-btn' + (open ? ' btn--primary' : '');
      b.disabled = !open;
      b.innerHTML = '<span class="level-btn__name"></span><span class="level-btn__stars" aria-hidden="true"></span>';
      b.querySelector('.level-btn__name').textContent = `${tr('level.label', { n: lvl })} · ${open ? tr(best ? 'level.replay' : 'level.start') : tr('level.locked')}`;
      b.querySelector('.level-btn__stars').textContent = stars(best);
      b.setAttribute('aria-label', `${tr('level.label', { n: lvl })}: ${best}/3`);
      b.addEventListener('click', () => {
        closeDialog($('dlg-world'));
        start(worldId, lvl);
      });
      wrap.append(b);
    }
    openDialog($('dlg-world'));
    wrap.querySelector('button:not(:disabled)')?.focus();
  }

  // ---------- playing ----------
  function start(worldId, level) {
    ctx = { world: worldId, level };
    round = engine.newRound(engine.buildRound(QUESTIONS, worldId, level), getPrefs().difficulty);
    paused = false;
    router.show('game');
    renderQuestion();
    startTimer();
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function startTimer(ms) {
    stopTimer();
    if (!round || round.done || round.chosen !== null || !round.time) {
      updateTimerUi(0);
      return;
    }
    remainingMs = ms ?? round.time * 1000;
    deadline = Date.now() + remainingMs;
    timerId = setInterval(tick, 200);
    tick();
  }

  function tick() {
    remainingMs = Math.max(0, deadline - Date.now());
    updateTimerUi(remainingMs);
    if (remainingMs <= 0) {
      stopTimer();
      choose(-1);
    }
  }

  function updateTimerUi(ms) {
    const on = !!round?.time;
    $('hud-timer').hidden = !on;
    $('timer-bar').hidden = !on;
    if (!on) return;
    $('hud-timer').textContent = tr('game.time', { n: Math.ceil(ms / 1000) });
    const frac = Math.max(0, Math.min(1, ms / (round.time * 1000)));
    $('timer-bar').firstElementChild.style.transform = `scaleX(${frac})`;
    $('timer-bar').classList.toggle('timer-bar--low', frac < 0.3);
  }

  function renderQuestion() {
    if (!round) return;
    const q = engine.current(round);
    const l = lang();
    $('game-title').textContent = `${tr(`world.${ctx.world}`)} · ${tr('level.label', { n: ctx.level })}`;
    $('hud-progress').textContent = tr('game.question', { a: round.index + 1, b: round.questions.length });
    $('hud-lives').textContent = '❤'.repeat(Math.max(0, round.lives)) + '🖤'.repeat(Math.max(0, round.maxLives - round.lives));
    $('hud-lives').setAttribute('aria-label', tr('game.lives', { n: round.lives }));
    $('q-text').textContent = q.q[l];

    const box = $('q-options');
    box.replaceChildren(
      ...q.options.map((opt, i) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'option';
        b.innerHTML = '<span class="option__key" aria-hidden="true"></span><span class="option__text"></span>';
        b.querySelector('.option__key').textContent = LETTERS[l][i];
        b.querySelector('.option__text').textContent = opt.text[l];
        if (round.eliminated.includes(i)) b.classList.add('option--out'), (b.disabled = true);
        if (round.chosen !== null) {
          b.disabled = true;
          if (opt.ok) b.classList.add('option--right');
          else if (i === round.chosen) b.classList.add('option--wrong');
        }
        b.addEventListener('click', () => choose(i));
        return b;
      }),
    );

    const answered = round.chosen !== null;
    const hint = $('btn-hint');
    hint.textContent = tr('game.hint', { n: round.hints });
    hint.hidden = answered || engine.DIFFICULTY_RULES[getPrefs().difficulty]?.hints === 0;
    hint.disabled = round.hints <= 0;
    const next = $('btn-next');
    next.hidden = !answered;
    next.textContent = tr(engine.isOver(round) ? 'game.finish' : 'game.next');
    const fb = $('q-feedback');
    fb.textContent = !answered ? '' : round.chosen === -1 ? tr('game.timeout') : q.options[round.chosen].ok ? tr('game.correct') : tr('game.wrong');
    fb.dataset.state = !answered ? '' : round.chosen >= 0 && q.options[round.chosen].ok ? 'ok' : 'bad';
    if (!answered) box.firstElementChild?.focus?.({ preventScroll: true });
  }

  function choose(i) {
    if (!round || paused || round.chosen !== null) return;
    stopTimer();
    engine.answer(round, i);
    const ok = i >= 0 && engine.current(round).options[i].ok;
    playSound(ok ? 'correct' : 'wrong', getPrefs().muted);
    renderQuestion();
    $('btn-next').focus();
  }

  function next() {
    if (!round || round.chosen === null) return;
    engine.advance(round);
    if (round.done) return finish();
    renderQuestion();
    startTimer();
  }

  function finish() {
    stopTimer();
    const res = engine.roundResult(round);
    const { save, reward, newAchievements } = store.applyRoundResult(getSave(), { world: ctx.world, level: ctx.level, ...res });
    setSave(save);
    playSound(res.won ? 'win' : 'lose', getPrefs().muted);

    $('result-title').textContent = tr(res.won ? 'result.win' : 'result.fail');
    $('result-stars').textContent = stars(res.stars);
    $('result-score').textContent = tr('result.score', { c: res.correct, t: res.total });
    $('result-coins').textContent = reward.coins > 0 ? tr('result.coins', { n: reward.coins }) : res.won ? tr('result.noCoins') : '';
    $('result-ach').replaceChildren(
      ...newAchievements.map((id) => {
        const li = doc.createElement('li');
        li.textContent = `🏆 ${tr('result.newAch', { name: tr(`ach.${id}.name`) })}`;
        return li;
      }),
    );
    const hasNext = res.won && ctx.level < CONFIG.LEVELS_PER_WORLD;
    $('result-next').hidden = !hasNext;
    openDialog($('dlg-result'));
    (hasNext ? $('result-next') : $('result-again')).focus();
    round.result = res;
  }

  // ---------- pause ----------
  function pause() {
    if (!round || round.done || paused) return;
    paused = true;
    if (timerId) remainingMs = Math.max(0, deadline - Date.now());
    stopTimer();
    openDialog($('dlg-pause'));
    $('pause-resume').focus();
  }

  function resume() {
    if (!paused) return;
    paused = false;
    closeDialog($('dlg-pause'));
    if (round && round.chosen === null && round.time) startTimer(remainingMs || round.time * 1000);
  }

  function restart() {
    closeDialog($('dlg-pause'));
    closeDialog($('dlg-result'));
    if (ctx) start(ctx.world, ctx.level);
  }

  function quit() {
    stopTimer();
    paused = false;
    round = null;
    closeDialog($('dlg-pause'));
    closeDialog($('dlg-result'));
    router.show('play');
  }

  $('btn-pause').addEventListener('click', pause);
  $('pause-resume').addEventListener('click', resume);
  $('pause-restart').addEventListener('click', restart);
  $('pause-quit').addEventListener('click', async () => {
    if (await confirmDialog(tr('game.quitConfirm'))) quit();
  });
  $('dlg-pause').addEventListener('cancel', (e) => {
    e.preventDefault();
    resume();
  });
  $('btn-next').addEventListener('click', next);
  $('btn-hint').addEventListener('click', () => {
    if (engine.useHint(round) >= 0) renderQuestion();
  });
  $('result-again').addEventListener('click', restart);
  $('result-map').addEventListener('click', quit);
  $('result-next').addEventListener('click', () => {
    const c = ctx;
    closeDialog($('dlg-result'));
    start(c.world, c.level + 1);
  });
  $('dlg-result').addEventListener('cancel', (e) => {
    e.preventDefault();
    quit();
  });
  doc.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeDialog(b.closest('dialog'))));
  // Auto-pause if the tab is hidden mid-question.
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden && round && !round.done && router.current === 'game') pause();
  });

  return {
    renderMap,
    refresh() {
      if (round && router.current === 'game' && !round.done) renderQuestion();
    },
    handleEscape(screen) {
      if (screen === 'game') {
        pause();
        return true;
      }
      if (screen === 'play') return false;
      return false;
    },
    confirmDialog,
    isPlaying: () => !!round && !round.done,
  };
}
