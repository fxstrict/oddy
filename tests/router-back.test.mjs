import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../src/ui/router.js';

// Minimal fake browser: a history stack with pushState/replaceState/back and popstate events.
function makeEnv({ openDialogs = [] } = {}) {
  const winHandlers = {};
  const hist = {
    stack: [null],
    idx: 0,
    replaceState(state) { this.stack[this.idx] = state; },
    pushState(state) { this.stack.length = this.idx + 1; this.stack.push(state); this.idx += 1; },
    back() { if (this.idx > 0) { this.idx -= 1; queueMicrotask(() => fire()); } },
  };
  const fire = () => (winHandlers.popstate || []).forEach((fn) => fn({}));
  const win = {
    history: hist,
    scrollTo() {},
    addEventListener(type, fn) { (winHandlers[type] ||= []).push(fn); },
  };
  const doc = {
    defaultView: win,
    dialogs: openDialogs,
    querySelectorAll(sel) { return sel === 'dialog[open]' ? this.dialogs : []; },
    querySelector() { return null; },
    addEventListener() {},
  };
  // What the browser does when the player presses Back / uses the back gesture.
  const userBack = () => { if (hist.idx > 0) { hist.idx -= 1; fire(); } };
  return { doc, hist, userBack };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('Back from a sub-screen returns to the menu (does not leave the app)', () => {
  const { doc, hist, userBack } = makeEnv();
  const router = createRouter(doc, {});
  router.show('menu', { focus: false });
  router.show('play');
  assert.equal(hist.stack.length, 2);
  userBack();
  assert.equal(router.current, 'menu');
  assert.equal(hist.idx, 0);
});

test('moving between sub-screens uses a single history entry', () => {
  const { doc, hist, userBack } = makeEnv();
  const router = createRouter(doc, {});
  router.show('menu', { focus: false });
  router.show('play');
  router.show('settings');
  router.show('help');
  assert.equal(hist.stack.length, 2, 'no entry growth');
  userBack();
  assert.equal(router.current, 'menu');
});

test('going back to the menu with a button consumes its entry and a later Back does nothing extra', async () => {
  const { doc, hist, userBack } = makeEnv();
  const changes = [];
  const router = createRouter(doc, { onChange: (n) => changes.push(n) });
  router.show('menu', { focus: false });
  router.show('play');
  router.show('menu'); // button
  await tick(); // the popstate caused by our own history.back() is ignored
  assert.equal(router.current, 'menu');
  assert.equal(hist.idx, 0);
  const before = changes.length;
  userBack(); // already on the first entry: nothing to pop, no screen change
  assert.equal(changes.length, before);
});

test('Back during a round pauses it and keeps the player on the game screen', () => {
  const { doc, hist, userBack } = makeEnv();
  const escapes = [];
  const router = createRouter(doc, { onEscape: (n) => { escapes.push(n); return true; } });
  router.show('menu', { focus: false });
  router.show('play');
  router.show('game');
  userBack();
  assert.deepEqual(escapes, ['game']);
  assert.equal(router.current, 'game');
  assert.equal(hist.stack.length, 2);
  assert.equal(hist.idx, 1, 'entry restored so the next Back works too');
});

test('Back with a dialog open closes the dialog (like Escape) and stays on the screen', () => {
  const events = [];
  const dialog = {
    open: true,
    dispatchEvent(e) { events.push(e.type); return true; }, // nobody called preventDefault
    close() { this.open = false; },
  };
  const { doc, userBack } = makeEnv({ openDialogs: [dialog] });
  const router = createRouter(doc, {});
  router.show('menu', { focus: false });
  router.show('play');
  userBack();
  assert.deepEqual(events, ['cancel']);
  assert.equal(dialog.open, false);
  assert.equal(router.current, 'play');
});

test('a dialog that handles cancel itself (preventDefault) is left to do so', () => {
  const dialog = { open: true, dispatchEvent() { return false; }, close() { this.open = false; } };
  const { doc, userBack } = makeEnv({ openDialogs: [dialog] });
  const router = createRouter(doc, {});
  router.show('menu', { focus: false });
  router.show('game');
  userBack();
  assert.equal(dialog.open, true);
  assert.equal(router.current, 'game');
});

test('without a window/history the router still works', () => {
  const doc = { querySelectorAll: () => [], querySelector: () => null, addEventListener() {} };
  const router = createRouter(doc, {});
  router.show('menu', { focus: false });
  router.show('play');
  assert.equal(router.current, 'play');
});
