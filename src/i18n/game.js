// Gameplay UI: world map, level dialog, question screen, pause and result dialogs.
import { CONFIG, WORLDS, FUTURE_ISLANDS } from '../config.js';
import { QUESTIONS } from '../data/questions.js';
import { FACTS } from '../data/facts.js';
import { ageOf } from './prefs.js';
import { tf } from '../i18n/index.js';
import * as engine from '../game/engine.js';
import * as store from '../game/save.js';
import { playSound } from './sound.js';
import { createSpeech, speakableText } from './speech.js';
import { dailyQuestions } from '../game/daily.js';

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
  let sharer = null; // set by main.js once the share module exists
  const speech = createSpeech(doc.defaultView);
  let widget = { round: null, index: -1, typed: '', order: [], pairs: [], sel: -1 }; // in-progress answer for fill/order/match
  let spoken = null; // `${roundId}:${index}` already read aloud automatically

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
      const mark = store.newMark(save, w.id);
      if (mark) {
        const tag = doc.createElement('span');
        tag.className = 'badge-new';
        tag.setAttribute('aria-hidden', 'true');
        tag.textContent = tr(mark === 'world' ? 'new.badge' : 'new.badgeLevels');
        b.append(tag);
      }
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
    renderReviewButton();

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
        const mark = store.newMark(save, w.id);
        if (mark) {
          const tag = doc.createElement('span');
          tag.className = 'badge-new badge-new--inline';
          tag.textContent = tr(mark === 'world' ? 'new.badge' : 'new.badgeLevels');
          b.querySelector('.world-card__name').append(' ', tag);
        }
        b.addEventListener('click', () => openWorld(w.id));
        li.append(b);
        return li;
      }),
    );
  }

  function renderReviewButton() {
    const btn = $('btn-review');
    if (!btn) return;
    const save = getSave();
    const n = Object.keys(save.review).length;
    btn.hidden = n === 0;
    if (!n) return;
    const due = store.reviewDue(save, store.dayNumber());
    btn.textContent = tr('review.btn', { n }) + (due > 0 ? tr('review.due', { d: due }) : '');
  }

  function renderDaily() {
    const btn = $('btn-daily');
    if (!btn) return;
    const save = getSave();
    const day = store.dayNumber();
    const streak = store.dailyStreak(save, day);
    const done = store.dailyDone(save, day);
    btn.dataset.done = String(done);
    btn.textContent = done
      ? tr('daily.done', { c: save.daily.today.correct, t: save.daily.today.total, n: streak })
      : `${tr('daily.btn')} · ${streak > 0 ? tr('daily.streak', { n: streak }) : tr('daily.fresh')}`;
  }

  function startDaily() {
    const day = store.dayNumber();
    const questions = dailyQuestions(QUESTIONS, day, ageOf(getPrefs()));
    ctx = { daily: true, day, world: 'daily', level: 0, replay: store.dailyDone(getSave(), day) };
    round = engine.newRound(questions, getPrefs().difficulty);
    paused = false;
    router.show('game');
    renderQuestion();
    startTimer();
  }

  function startReview() {
    const ids = store.reviewQueue(getSave(), store.dayNumber());
    const questions = engine.buildReview(QUESTIONS, ids);
    if (!questions.length) {
      toast(tr('review.none'));
      return;
    }
    ctx = { review: true, world: 'review', level: 0 };
    round = engine.newRound(questions, 'easy'); // practice is relaxed: no timer, many lives
    paused = false;
    router.show('game');
    renderQuestion();
    startTimer();
  }

  function openWorld(worldId) {
    let save = getSave();
    if (!store.isWorldUnlocked(save, worldId)) {
      toast(tr('play.locked'));
      playSound('wrong', getPrefs().muted);
      return;
    }
    const w = WORLDS.find((x) => x.id === worldId);
    if (store.newMark(save, worldId)) {
      setSave(store.markSeen(save, worldId));
      renderMap();
    }
    $('dlg-world-story').textContent = tr(`story.${worldId}`) === `story.${worldId}` ? '' : tr(`story.${worldId}`);
    $('dlg-world-title').textContent = `${w.icon} ${tr(`world.${worldId}`)}`;
    save = getSave();
    $('dlg-world-stars').textContent = tr('play.stars', { n: store.worldStars(save, worldId), max: store.maxWorldStars() });
    const wrap = $('dlg-world-levels');
    const m = store.worldMastery(save, QUESTIONS, worldId, ageOf(getPrefs()));
    $('dlg-world-mastery').textContent = tr('mastery.label', { p: m.pct });
    $('dlg-world-mastery-bar').value = m.pct;
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
  function start(worldId, level, opts = {}) {
    ctx = { world: worldId, level };
    if (opts.friendStars) {
      // Friend challenge: play the same level. Without that level unlocked it is a guest game (nothing is saved).
      ctx.friendStars = opts.friendStars;
      ctx.from = opts.from;
      ctx.guest = !store.isLevelUnlocked(getSave(), worldId, level);
    }
    const plan = engine.planRound(QUESTIONS, worldId, level, { age: ageOf(getPrefs()), asked: getSave().asked });
    if (!ctx.guest) setSave({ ...getSave(), asked: plan.asked });
    round = engine.newRound(plan.questions, getPrefs().difficulty);
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
    $('game-title').textContent = ctx.daily ? tr('daily.title') : ctx.review ? tr('review.title') : `${tr(`world.${ctx.world}`)} · ${tr('level.label', { n: ctx.level })}`;
    $('hud-progress').textContent = tr('game.question', { a: round.index + 1, b: round.questions.length });
    $('hud-lives').textContent = '❤'.repeat(Math.max(0, round.lives)) + '🖤'.repeat(Math.max(0, round.maxLives - round.lives));
    $('hud-lives').setAttribute('aria-label', tr('game.lives', { n: round.lives }));
    $('q-text').textContent = q.q[l];
    if (widget.round !== round || widget.index !== round.index) widget = { round, index: round.index, typed: '', order: [], pairs: q.left ? q.left.map(() => -1) : [], sel: -1 };
    const choice = engine.isChoice(q);
    $('q-options').hidden = !choice;
    $('q-widget').hidden = choice;
    const box = $('q-options');
    if (choice) renderChoices(q, l, box);
    else renderWidget(q, l);

    const answered = round.chosen !== null;
    const hint = $('btn-hint');
    hint.textContent = tr('game.hint', { n: round.hints });
    hint.hidden = answered || !choice || engine.DIFFICULTY_RULES[getPrefs().difficulty]?.hints === 0;
    hint.disabled = round.hints <= 0;
    const next = $('btn-next');
    next.hidden = !answered;
    next.textContent = tr(engine.isOver(round) ? 'game.finish' : 'game.next');
    const qs = $('btn-q-share');
    qs.hidden = !answered || !sharer || !choice || !!ctx.daily;
    qs.textContent = tr('share.question');
    const fb = $('q-feedback');
    fb.textContent = !answered ? '' : round.timedOut ? tr('game.timeout') : round.ok ? tr('game.correct') : tr('game.wrong');
    fb.dataset.state = !answered ? '' : round.ok ? 'ok' : 'bad';
    const why = answered ? q.e?.[l] : '';
    $('q-explain').hidden = !why;
    $('q-explain').textContent = why ? `${tr('game.explain')} ${why}` : '';
    $('btn-speak').hidden = !speech.available();
    $('btn-speak').setAttribute('aria-label', tr('speech.btn'));
    $('btn-speak').title = tr('speech.btn');
    if (!answered) {
      const key = `${ctx.world}:${round.index}:${round.questions.length}:${q.id}`;
      if (getPrefs().read && !getPrefs().muted && spoken !== key && speech.hasVoice(l)) {
        spoken = key;
        speech.speak(speakableText(q, l), l);
      }
      if (choice) box.firstElementChild?.focus?.({ preventScroll: true });
    }
  }

  function renderChoices(q, l, box) {
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
  }

  const mk = (tag, cls, text) => {
    const el = doc.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const wbtn = (cls, text, onClick, disabled = false) => {
    const b = mk('button', cls, text);
    b.type = 'button';
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  };

  // Types answered by typing / ordering / matching. `widget` keeps the player's work until they confirm.
  function renderWidget(q, l) {
    const box = $('q-widget');
    const answered = round.chosen !== null;
    const parts = [];
    if (q.type === 'fill') {
      const input = mk('input', 'input');
      input.type = 'text';
      input.id = 'fill-input';
      input.value = widget.typed;
      input.disabled = answered;
      input.placeholder = tr('type.fill.placeholder');
      input.autocomplete = 'off';
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocorrect', 'off');
      input.spellcheck = false;
      input.dir = 'auto';
      input.lang = l;
      if (answered) input.classList.add(round.ok ? 'option--right' : 'option--wrong');
      input.addEventListener('input', () => (widget.typed = input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitWidget(q);
      });
      const row = mk('div', 'fill-row');
      row.append(input, wbtn('btn btn--primary', tr('type.fill.check'), () => submitWidget(q), answered));
      parts.push(row);
      if (answered && !round.ok) parts.push(mk('p', 'wsolution', tr('type.answerWas', { a: q.accept[l][0] })));
      if (!answered) queueMicrotask(() => input.focus({ preventScroll: true }));
    } else if (q.type === 'order') {
      if (answered) {
        const sol = mk('div', 'wsolution');
        sol.append(mk('strong', '', tr('type.solution')));
        const ol = mk('ol');
        [...q.items].sort((a, b) => a.pos - b.pos).forEach((it) => ol.append(mk('li', '', it.text[l])));
        sol.append(ol);
        parts.push(sol);
      } else {
        parts.push(mk('p', 'widget__hint', tr('type.order.hint')));
        const list = mk('div', 'wlist');
        q.items.forEach((it, idx) => {
          const at = widget.order.indexOf(idx);
          const b = wbtn('wopt' + (at >= 0 ? ' wopt--on' : ''), '', () => {
            const k = widget.order.indexOf(idx);
            if (k >= 0) widget.order.splice(k, 1);
            else widget.order.push(idx);
            renderQuestion();
          });
          b.append(mk('span', 'wopt__text', it.text[l]), mk('span', 'wopt__badge', at >= 0 ? String(at + 1) : ''));
          list.append(b);
        });
        parts.push(list);
        const actions = mk('div', 'actions');
        actions.append(
          wbtn('btn btn--primary', tr('type.order.confirm'), () => submitWidget(q), widget.order.length !== q.items.length),
          wbtn('btn btn--small', tr('type.reset'), () => ((widget.order = []), renderQuestion()), widget.order.length === 0),
        );
        parts.push(actions);
      }
    } else if (q.type === 'match') {
      if (answered) {
        const sol = mk('div', 'wsolution');
        sol.append(mk('strong', '', tr('type.solution')));
        const ul = mk('ul');
        q.left.forEach((lt, i) => ul.append(mk('li', '', `${lt[l]} ↔ ${q.right.find((r) => r.forLeft === i).text[l]}`)));
        sol.append(ul);
        parts.push(sol);
      } else {
        parts.push(mk('p', 'widget__hint', tr('type.match.hint')));
        const cols = mk('div', 'wcols');
        const leftCol = mk('div', 'wlist');
        const rightCol = mk('div', 'wlist');
        q.left.forEach((lt, i) => {
          const linked = widget.pairs[i];
          const b = wbtn('wopt' + (widget.sel === i ? ' wopt--sel' : '') + (linked >= 0 ? ' wopt--on' : ''), '', () => {
            if (linked >= 0) widget.pairs[i] = -1;
            else widget.sel = widget.sel === i ? -1 : i;
            renderQuestion();
          });
          b.append(mk('span', 'wopt__text', lt[l]), mk('span', 'wopt__badge', linked >= 0 ? String(i + 1) : ''));
          leftCol.append(b);
        });
        q.right.forEach((rt, r) => {
          const owner = widget.pairs.indexOf(r);
          const b = wbtn('wopt' + (owner >= 0 ? ' wopt--on' : ''), '', () => {
            if (widget.sel < 0) {
              if (owner >= 0) widget.pairs[owner] = -1; // tap a linked answer to unlink it
            } else {
              if (owner >= 0) widget.pairs[owner] = -1;
              widget.pairs[widget.sel] = r;
              widget.sel = -1;
            }
            renderQuestion();
          });
          b.append(mk('span', 'wopt__text', rt.text[l]), mk('span', 'wopt__badge', owner >= 0 ? String(owner + 1) : ''));
          rightCol.append(b);
        });
        cols.append(leftCol, rightCol);
        parts.push(cols);
        const actions = mk('div', 'actions');
        actions.append(
          wbtn('btn btn--primary', tr('type.match.confirm'), () => submitWidget(q), widget.pairs.some((p) => p < 0)),
          wbtn('btn btn--small', tr('type.reset'), () => ((widget.pairs = q.left.map(() => -1)), (widget.sel = -1), renderQuestion()), widget.pairs.every((p) => p < 0)),
        );
        parts.push(actions);
      }
    }
    box.replaceChildren(...parts);
  }

  function submitWidget(q) {
    if (!round || paused || round.chosen !== null) return;
    if (q.type === 'fill') {
      if (!widget.typed.trim()) return;
      commit(() => engine.answerText(round, widget.typed, lang()));
    } else if (q.type === 'order') {
      if (widget.order.length !== q.items.length) return;
      commit(() => engine.answerOrder(round, widget.order.map((i) => q.items[i].pos)));
    } else if (q.type === 'match') {
      if (widget.pairs.some((p) => p < 0)) return;
      commit(() => engine.answerMatch(round, widget.pairs));
    }
  }

  function speakCurrent() {
    if (!round) return;
    const l = lang();
    if (!speech.available()) return toast(tr('speech.unsupported'));
    if (!speech.hasVoice(l)) return toast(tr('speech.noVoice'));
    const q = engine.current(round);
    speech.speak(round.chosen !== null && q.e?.[l] ? q.e[l] : speakableText(q, l), l);
  }


  function choose(i) {
    commit(() => engine.answer(round, i));
  }

  function commit(apply) {
    if (!round || paused || round.chosen !== null) return;
    stopTimer();
    apply();
    const ok = round.ok;
    playSound(ok ? 'correct' : 'wrong', getPrefs().muted);
    if (!ctx.guest) setSave(store.recordAnswer(getSave(), engine.current(round).id, ok, store.dayNumber()));
    renderQuestion();
    $('btn-next').focus();
  }

  function next() {
    if (!round || round.chosen === null) return;
    speech.stop();
    engine.advance(round);
    if (round.done) return finish();
    renderQuestion();
    startTimer();
  }

  function finish() {
    stopTimer();
    speech.stop();
    const res = engine.roundResult(round);
    let reward = { coins: 0 };
    let newAchievements = [];
    let dailyReward = null;
    if (ctx.daily) {
      const done = store.completeDaily(getSave(), ctx.day, res.correct, res.total);
      dailyReward = done.reward;
      reward = { coins: done.reward.coins };
      setSave(done.save);
    } else if (!ctx.guest && !ctx.review) {
      const applied = store.applyRoundResult(getSave(), { world: ctx.world, level: ctx.level, ...res });
      reward = applied.reward;
      newAchievements = applied.newAchievements;
      setSave(applied.save);
    }
    playSound(res.won ? 'win' : 'lose', getPrefs().muted);

    const plain = ctx.review || ctx.daily;
    $('result-title').textContent = ctx.daily ? tr('daily.result') : ctx.review ? tr('review.done') : tr(res.won ? 'result.win' : 'result.fail');
    $('result-stars').textContent = plain ? '' : stars(res.stars);
    $('result-score').textContent = tr('result.score', { c: res.correct, t: res.total });
    $('result-coins').textContent = ctx.daily ? (dailyReward?.first ? tr('daily.reward', { n: dailyReward.coins }) + (dailyReward.bonus ? tr('daily.bonus', { b: dailyReward.bonus }) : '') : tr('daily.replay')) : ctx.review ? tr('review.left', { n: Object.keys(getSave().review).length }) : reward.coins > 0 ? tr('result.coins', { n: reward.coins }) : res.won ? tr('result.noCoins') : '';
    $('result-ach').replaceChildren(
      ...newAchievements.map((id) => {
        const li = doc.createElement('li');
        li.textContent = `🏆 ${tr('result.newAch', { name: tr(`ach.${id}.name`) })}`;
        return li;
      }),
    );
    const vs = $('result-vs');
    vs.textContent = '';
    if (ctx.friendStars) {
      const key = res.stars > ctx.friendStars ? 'challenge.beat' : res.stars === ctx.friendStars ? 'challenge.tie' : 'challenge.lose';
      vs.textContent = tr(key, { name: ctx.from, a: res.stars, b: ctx.friendStars }) + (ctx.guest ? ` ${tr('challenge.guest')}` : '');
    }
    if (ctx.daily && dailyReward?.first) vs.textContent = tr('daily.streakLine', { n: dailyReward.streak });
    const pool = plain ? Object.values(FACTS).flat() : FACTS[ctx.world] || [];
    const fact = pool.length ? pool[Math.floor(Math.random() * pool.length)][lang()] : '';
    $('result-fact').hidden = !fact;
    $('result-fact').textContent = fact ? `${tr('fact.title')} ${fact}` : '';
    $('result-share').hidden = !(res.won && sharer && !plain);
    const hasNext = res.won && ctx.level < CONFIG.LEVELS_PER_WORLD && !ctx.guest && !plain;
    $('result-next').hidden = !hasNext;
    openDialog($('dlg-result'));
    (hasNext ? $('result-next') : $('result-again')).focus();
    round.result = res;
  }

  // ---------- pause ----------
  function pause() {
    if (!round || round.done || paused) return;
    paused = true;
    speech.stop();
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
    if (ctx?.daily) startDaily();
    else if (ctx?.review) startReview();
    else if (ctx) start(ctx.world, ctx.level, ctx.friendStars ? { friendStars: ctx.friendStars, from: ctx.from } : {});
  }

  function quit() {
    stopTimer();
    speech.stop();
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
  $('btn-review').addEventListener('click', startReview);
  $('btn-daily').addEventListener('click', startDaily);
  $('btn-speak').addEventListener('click', speakCurrent);
  $('btn-hint').addEventListener('click', () => {
    if (engine.useHint(round) >= 0) renderQuestion();
  });
  $('result-again').addEventListener('click', restart);
  $('result-share').addEventListener('click', () => sharer?.shareLevel(ctx.world, ctx.level, round?.result?.stars ?? 0));
  $('btn-q-share').addEventListener('click', () => sharer?.shareQuestion(engine.current(round).id));
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
    renderDaily,
    setSharer(s) {
      sharer = s;
    },
    startChallenge: start,
    goMap: () => router.show('play'),
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
