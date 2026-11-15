import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ar from '../src/i18n/ar.js';
import en from '../src/i18n/en.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('credit lines exist in both languages and name the student and supervisor', () => {
  assert.match(ar['credit.by'], /هدى محمد/);
  assert.match(ar['credit.sup'], /فاطمة سعد/);
  assert.match(en['credit.by'], /Huda Mohamed/);
  assert.match(en['credit.sup'], /Fatima Saad/);
});

test('index.html has splash with credit and Open Graph / Twitter tags', () => {
  for (const needle of ['id="splash"', 'splash-start', 'og:title', 'og:description', 'og:image', 'og:image:width', 'twitter:card', 'og:image:secure_url', 'application/ld+json', 'هدى محمد', 'فاطمة سعد']) {
    assert.ok(html.includes(needle), `missing ${needle}`);
  }
});

test('share image and icons exist', () => {
  for (const f of ['assets/img/og-image.jpg', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/icon-maskable-512.png']) {
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
  }
});

test('JSON-LD is valid and names the student and supervisor', () => {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replaceAll('__SITE_URL__', 'https://example.com/'));
  assert.equal(ld['@type'], 'VideoGame');
  assert.match(ld.creator.name, /هدى محمد/);
  assert.match(ld.contributor.name, /فاطمة سعد/);
});

test('source index.html has an absolute https og:image even without a build (raw Pages deploy)', () => {
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  assert.match(m[1], /^https:\/\/[^/]+\/.*assets\/img\/og-image\.jpg$/);
  assert.ok(!html.includes('__SITE_URL__'));
});

test('Android icon/splash sources exist for @capacitor/assets', () => {
  for (const f of ['icon-only', 'icon-foreground', 'icon-background', 'splash', 'splash-dark']) {
    assert.ok(existsSync(new URL(`../resources/${f}.png`, import.meta.url)), f);
  }
});
