import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCREENS } from '../src/ui/router.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('every router screen exists in index.html', () => {
  for (const name of SCREENS) {
    assert.match(html, new RegExp(`data-screen="${name}"`), `missing screen: ${name}`);
  }
});

test('every data-nav target points to an existing screen (no dead navigation)', () => {
  const targets = [...html.matchAll(/data-nav="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(targets.length > 0);
  for (const target of targets) assert.ok(SCREENS.includes(target), `dead nav: ${target}`);
});

test('every data-i18n key used in index.html exists in both dictionaries', async () => {
  const { default: ar } = await import('../src/i18n/ar.js');
  const { default: en } = await import('../src/i18n/en.js');
  const keys = [...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1]);
  for (const key of keys) {
    assert.ok(key in ar, `ar missing ${key}`);
    assert.ok(key in en, `en missing ${key}`);
  }
});

test('html has no remote resources (offline-first)', () => {
  // The canonical link is metadata for crawlers, not a resource the page loads.
  assert.doesNotMatch(html.replace(/<link rel="canonical"[^>]*>/, ''), /(?:src|href)="https?:\/\//);
});
