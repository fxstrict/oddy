import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNewVersion, fetchRemoteVersion, applyUpdate } from '../src/ui/update.js';
import { BUILD_VERSION } from '../src/version.js';
import ar from '../src/i18n/ar.js';
import en from '../src/i18n/en.js';

test('source build is the dev version (no update prompt while developing)', () => {
  assert.equal(BUILD_VERSION, 'dev');
  assert.equal(isNewVersion('dev', 'abc123'), false);
});

test('isNewVersion: only a different, non-empty published version counts', () => {
  assert.equal(isNewVersion('aaa', 'bbb'), true);
  assert.equal(isNewVersion('aaa', 'aaa'), false);
  assert.equal(isNewVersion('aaa', null), false);
  assert.equal(isNewVersion('aaa', ''), false);
  assert.equal(isNewVersion('', 'bbb'), false);
  assert.equal(isNewVersion(undefined, 'bbb'), false);
});

test('fetchRemoteVersion: reads the version, bypasses caches, and returns null on any failure', async () => {
  let seen;
  const ok = async (url, opts) => {
    seen = { url, opts };
    return { ok: true, json: async () => ({ version: 'v2' }) };
  };
  assert.equal(await fetchRemoteVersion(ok), 'v2');
  assert.match(seen.url, /^version\.json\?t=\d+$/);
  assert.equal(seen.opts.cache, 'no-store');
  assert.equal(await fetchRemoteVersion(async () => ({ ok: false })), null);
  assert.equal(await fetchRemoteVersion(async () => { throw new Error('offline'); }), null);
  assert.equal(await fetchRemoteVersion(async () => ({ ok: true, json: async () => ({ version: 5 }) })), null);
  assert.equal(await fetchRemoteVersion(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } })), null);
});

// ---- fakes for navigator.serviceWorker ----
function makeEnv({ waiting = null, installing = null, active = {}, updateFn } = {}) {
  const swEvents = new EventTarget();
  const reg = { waiting, installing, active, update: updateFn || (async () => {}) };
  const reloads = [];
  const nav = {
    serviceWorker: {
      getRegistration: async () => reg,
      addEventListener: (type, fn, opts) => swEvents.addEventListener(type, fn, opts),
    },
  };
  const win = { location: { reload: () => reloads.push(1) } };
  return { reg, nav, win, reloads, fireControllerChange: () => swEvents.dispatchEvent(new Event('controllerchange')) };
}

test('applyUpdate: a waiting worker is told to SKIP_WAITING and the page reloads on controllerchange', async () => {
  const messages = [];
  const env = makeEnv();
  env.reg.waiting = { postMessage: (m) => { messages.push(m); setTimeout(env.fireControllerChange, 0); } };
  assert.equal(await applyUpdate({ nav: env.nav, win: env.win, timeoutMs: 500 }), 'updated');
  assert.deepEqual(messages, [{ type: 'SKIP_WAITING' }]);
  assert.equal(env.reloads.length, 1);
});

test('applyUpdate: waits for an installing worker to finish, then activates it', async () => {
  const messages = [];
  const installing = new EventTarget();
  installing.state = 'installing';
  installing.postMessage = (m) => { messages.push(m); setTimeout(env.fireControllerChange, 0); };
  const env = makeEnv({ installing });
  setTimeout(() => {
    installing.state = 'installed';
    env.reg.waiting = installing;
    env.reg.installing = null;
    installing.dispatchEvent(new Event('statechange'));
  }, 5);
  assert.equal(await applyUpdate({ nav: env.nav, win: env.win, timeoutMs: 500 }), 'updated');
  assert.deepEqual(messages, [{ type: 'SKIP_WAITING' }]);
  assert.equal(env.reloads.length, 1);
});

test('applyUpdate: if the newest worker is already active it just reloads', async () => {
  const env = makeEnv({ active: {} });
  assert.equal(await applyUpdate({ nav: env.nav, win: env.win, timeoutMs: 100 }), 'reloaded');
  assert.equal(env.reloads.length, 1);
});

test('applyUpdate: a failed download rejects, does not reload, and leaves the offline copy alone', async () => {
  const installing = new EventTarget();
  installing.state = 'installing';
  const env = makeEnv({ installing, active: {} });
  setTimeout(() => {
    installing.state = 'redundant';
    installing.dispatchEvent(new Event('statechange'));
  }, 5);
  await assert.rejects(() => applyUpdate({ nav: env.nav, win: env.win, timeoutMs: 200 }), /update-unavailable/);
  assert.equal(env.reloads.length, 0);
});

test('applyUpdate: without a service worker registration it falls back to a reload', async () => {
  const reloads = [];
  const nav = { serviceWorker: { getRegistration: async () => undefined } };
  const win = { location: { reload: () => reloads.push(1) } };
  assert.equal(await applyUpdate({ nav, win }), 'reloaded');
  assert.equal(reloads.length, 1);
});

test('applyUpdate: rejects when the new worker never takes control', async () => {
  const env = makeEnv();
  env.reg.waiting = { postMessage: () => {} };
  await assert.rejects(() => applyUpdate({ nav: env.nav, win: env.win, timeoutMs: 30 }), /update-timeout/);
  assert.equal(env.reloads.length, 0);
});

test('update dialog texts exist in both languages', () => {
  for (const k of ['update.title', 'update.text', 'update.now', 'update.later', 'update.working', 'update.failed']) {
    assert.ok(ar[k] && en[k], k);
  }
});
