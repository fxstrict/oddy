// In-game update prompt. Each time the game is opened (and when it comes back to the foreground or goes
// online) it asks the network for version.json; if the published version differs from the running build
// (or a downloaded update is already waiting), a dialog says "new update - press Update" until the player does.
// Progress lives in localStorage, which the update never touches.
import { BUILD_VERSION } from '../version.js';
import { tf } from '../i18n/index.js';

export const DEV_VERSION = 'dev';
const MIN_GAP_MS = 60 * 1000; // do not hit the network more than once a minute
const SNOOZE_MS = 30 * 60 * 1000; // after "Later", stay quiet for this session for 30 minutes
const APPLY_TIMEOUT_MS = 20 * 1000;

/** True when a published version exists and differs from the running one (never in dev builds). */
export function isNewVersion(current, remote) {
  return typeof current === 'string' && typeof remote === 'string' && current !== '' && remote !== '' && current !== DEV_VERSION && remote !== current;
}

/** Reads the published version from the network (never from a cache). Returns null when offline/unavailable. */
export async function fetchRemoteVersion(fetchFn) {
  try {
    const res = await fetchFn(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res || !res.ok) return null;
    const data = await res.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null;
  }
}

function waitForInstalled(reg, timeoutMs) {
  return new Promise((resolve) => {
    const worker = reg.installing;
    if (!worker) return resolve(reg.waiting || null);
    const timer = setTimeout(() => resolve(null), timeoutMs);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        clearTimeout(timer);
        resolve(reg.waiting || worker);
      } else if (worker.state === 'redundant') {
        clearTimeout(timer);
        resolve(null);
      }
    });
  });
}

/**
 * Activates the newest version and reloads. Resolves only if a reload was triggered; rejects (without
 * touching the caches) when the new version could not be fetched, so the offline copy keeps working.
 */
export async function applyUpdate({ nav, win, timeoutMs = APPLY_TIMEOUT_MS }) {
  const sw = nav.serviceWorker;
  const reg = sw?.getRegistration ? await sw.getRegistration() : null;
  if (!reg) {
    win.location.reload(); // no service worker (plain http, unsupported browser): a reload fetches the latest
    return 'reloaded';
  }
  if (!reg.waiting) await reg.update().catch(() => {});
  const waiting = reg.waiting || (await waitForInstalled(reg, timeoutMs));
  if (!waiting) {
    // Nothing newer to install: either the newest worker is already active (the page just runs old code) or
    // the download failed. Only the first case is fixed by reloading; verify we are not offline-stranded.
    if (reg.active && !reg.installing) {
      win.location.reload();
      return 'reloaded';
    }
    throw new Error('update-unavailable');
  }
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('update-timeout')), timeoutMs);
    sw.addEventListener(
      'controllerchange',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
    waiting.postMessage({ type: 'SKIP_WAITING' });
  });
  win.location.reload();
  return 'updated';
}

/**
 * Wires the #dlg-update dialog.
 * @param {{doc: Document, getLang: () => string, canShow?: () => boolean, nav?: Navigator, win?: Window, fetchFn?: Function, now?: () => number}} o
 * @returns {{check: (opts?: {force?: boolean}) => Promise<boolean>}}
 */
export function createUpdatePrompt({ doc, getLang, canShow = () => true, nav = navigator, win = window, fetchFn, now = Date.now }) {
  const $ = (id) => doc.getElementById(id);
  const dlg = $('dlg-update');
  const supported = !!dlg && typeof dlg.showModal === 'function';
  const doFetch = fetchFn || ((...args) => win.fetch(...args));
  let busy = false;
  let lastCheck = 0;
  let snoozedUntil = 0;

  async function updateAvailable() {
    if (isNewVersion(BUILD_VERSION, await fetchRemoteVersion(doFetch))) return true;
    // An update that was already downloaded in the background and is waiting for the player's OK.
    const reg = await Promise.resolve(nav.serviceWorker?.getRegistration?.()).catch(() => null);
    return !!(reg && reg.waiting && nav.serviceWorker.controller);
  }

  const blocked = () => !canShow() || !!doc.querySelector('dialog[open]');

  function setWorking(on) {
    const now_ = $('update-now');
    now_.disabled = on;
    $('update-later').disabled = on;
    now_.textContent = tf(getLang(), on ? 'update.working' : 'update.now');
  }

  function showError(on) {
    const el = $('update-error');
    el.hidden = !on;
    el.textContent = on ? tf(getLang(), 'update.failed') : '';
  }

  async function check({ force = false } = {}) {
    if (!supported || busy || dlg.open) return false;
    const t = now();
    if (!force && (t - lastCheck < MIN_GAP_MS || t < snoozedUntil)) return false;
    if (blocked()) return false;
    lastCheck = t;
    if (!(await updateAvailable())) return false;
    if (blocked() || dlg.open) return false; // the player may have started a round while we were asking
    showError(false);
    setWorking(false);
    dlg.showModal();
    $('update-now').focus();
    return true;
  }

  if (supported) {
    $('update-now').addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      showError(false);
      setWorking(true);
      try {
        await applyUpdate({ nav, win });
        return; // the page is reloading with the new version
      } catch {
        showError(true);
      }
      busy = false;
      setWorking(false);
    });
    const later = () => {
      if (busy) return;
      snoozedUntil = now() + SNOOZE_MS;
      if (dlg.open) dlg.close();
    };
    $('update-later').addEventListener('click', later);
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      later();
    });
    doc.addEventListener('visibilitychange', () => {
      if (!doc.hidden) check();
    });
    win.addEventListener('online', () => check());
  }

  return { check };
}
