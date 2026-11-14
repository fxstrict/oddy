// Minimal screen router for the semantic HTML shell.
// Screens are <section data-screen="name" hidden>. Buttons use data-nav="name".

export const SCREENS = Object.freeze(['menu', 'play', 'game', 'achievements', 'settings', 'help']);

export function createRouter(doc, { onChange, onEscape } = {}) {
  let current = null;
  // Back button / back gesture (Android, browsers): every screen except the menu owns ONE history entry, so
  // Back returns to the menu instead of leaving the app, and Back during a round pauses it.
  const win = doc.defaultView;
  const hist = win?.history;
  let guarded = false; // true while a non-menu screen has its own history entry
  let skipPops = 0; // popstate events caused by our own history.back()

  function syncHistory(name, first) {
    if (!hist) return;
    try {
      if (first) {
        hist.replaceState({ kq: name }, '');
      } else if (name === 'menu') {
        if (guarded) {
          guarded = false;
          skipPops += 1;
          hist.back();
          setTimeout(() => { skipPops = 0; }, 500); // never swallow a real Back press if no popstate came
        }
      } else if (guarded) {
        hist.replaceState({ kq: name }, '');
      } else {
        guarded = true;
        hist.pushState({ kq: name }, '');
      }
    } catch {
      /* history unavailable (sandboxed frame, file://): Back simply keeps the browser default */
    }
  }

  function show(name, { focus = true } = {}) {
    if (!SCREENS.includes(name)) name = 'menu';
    syncHistory(name, current === null);
    doc.querySelectorAll('[data-screen]').forEach((el) => {
      el.hidden = el.dataset.screen !== name;
    });
    current = name;
    if (focus) {
      const heading = doc.querySelector(`[data-screen="${name}"] [data-focus-target]`);
      heading?.focus({ preventScroll: false });
    }
    doc.defaultView?.scrollTo?.(0, 0);
    onChange?.(name);
  }

  doc.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-nav]');
    if (target) show(target.dataset.nav);
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !current || current === 'menu') return;
    if (doc.querySelector('dialog[open]')) return; // dialogs handle Escape themselves
    if (onEscape?.(current)) return;
    show(current === 'play' ? 'menu' : 'menu');
  });

  win?.addEventListener?.('popstate', () => {
    if (skipPops > 0) {
      skipPops -= 1;
      return;
    }
    if (!guarded) return; // already at the menu entry: Back leaves the app as usual
    const openDialog = [...doc.querySelectorAll('dialog[open]')].pop();
    const stay = () => {
      try {
        hist.pushState({ kq: current }, '');
      } catch {
        guarded = false;
      }
    };
    if (openDialog) {
      // Back closes the top dialog (same as Escape) and keeps the player on the current screen.
      stay();
      if (openDialog.dispatchEvent(new Event('cancel', { cancelable: true })) && openDialog.open) openDialog.close();
      return;
    }
    if (current === 'game' && onEscape?.('game')) {
      stay(); // a round is on: pause it instead of abandoning it
      return;
    }
    guarded = false; // the browser has just popped this screen's entry
    show('menu');
  });

  return { show, get current() { return current; } };
}
