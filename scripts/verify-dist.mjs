// Post-build sanity check: every precached file exists, sw has no placeholders, manifest icons exist.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const fail = (m) => { console.error('verify FAIL:', m); process.exit(1); };

const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
if (sw.includes('__VERSION__') || sw.includes('__PRECACHE__')) fail('sw.js placeholders not replaced');
const list = JSON.parse(sw.match(/const PRECACHE = (\[.*\]);/)[1]);
for (const f of list) if (f !== './' && !existsSync(join(DIST, f))) fail(`precache missing ${f}`);
for (const must of ['index.html', 'src/main.js', 'css/styles.css', 'assets/img/sky-islands.webp']) if (!list.includes(must)) fail(`not precached: ${must}`);
const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'));
for (const i of manifest.icons) if (!existsSync(join(DIST, i.src))) fail(`icon missing ${i.src}`);
if (!existsSync(join(DIST, '.nojekyll'))) fail('.nojekyll missing');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
if (html.includes('__SITE_URL__')) fail('index.html still has __SITE_URL__ placeholder');
if (!/<meta property="og:image" content="https:\/\/[^"]+\/assets\/img\/og-image\.jpg"/.test(html)) fail('og:image must be an absolute https URL ending in /assets/img/og-image.jpg');
for (const must of ['og:title', 'og:image', 'twitter:card', 'splash-start']) if (!html.includes(must)) fail(`index.html missing ${must}`);
if (!existsSync(join(DIST, 'assets/img/og-image.jpg'))) fail('og-image.jpg missing');
// Share preview checks (WhatsApp/Facebook/Google): absolute https image URL, small image, credits, valid JSON-LD.
const og = (name) => html.match(new RegExp(`<meta property="${name}" content="([^"]*)"`))?.[1];
if (!/^https:\/\//.test(og('og:image') || '')) console.warn('verify: WARNING - og:image is not an absolute https URL (set KQ_SITE_URL); link previews will not work until it is.');
if (statSync(join(DIST, 'assets/img/og-image.jpg')).size > 300 * 1024) fail('og-image.jpg is larger than 300 KB (WhatsApp may skip it)');
for (const must of ['هدى محمد', 'فاطمة سعد', 'og:image:secure_url', 'application/ld+json']) if (!html.includes(must)) fail(`index.html missing ${must}`);
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
try { JSON.parse(ld); } catch { fail('JSON-LD is not valid JSON'); }
if (!existsSync(join(DIST, 'robots.txt'))) fail('robots.txt missing');
// Update prompt: the baked-in version, version.json and the service worker must all agree.
const swVersion = sw.match(/const VERSION = \"([0-9a-f]+)\";/)?.[1];
if (!swVersion) fail('could not read VERSION from sw.js');
if (!existsSync(join(DIST, 'version.json'))) fail('version.json missing');
if (JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8')).version !== swVersion) fail('version.json does not match sw.js VERSION');
if (!readFileSync(join(DIST, 'src/version.js'), 'utf8').includes(`\"${swVersion}\"`)) fail('src/version.js does not match sw.js VERSION');
if (!list.includes('src/version.js') || !list.includes('src/ui/update.js')) fail('version.js / update.js not precached');
if (list.includes('version.json')) fail('version.json must not be precached');
if (!sw.includes('/version.json') || !sw.includes('SKIP_WAITING')) fail('sw.js does not bypass version.json / handle SKIP_WAITING');
if (!html.includes('id=\"dlg-update\"')) fail('index.html missing the update dialog');
// What's new + invite/challenge: version.json describes the published game; the share/challenge UI exists.
const vj = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8'));
if (!Array.isArray(vj.worlds) || !vj.worlds.length || !vj.worlds.every((w) => w.id && w.icon && w.name?.ar && w.name?.en)) fail('version.json must list worlds with ar/en names');
if (!(vj.levels >= 1) || !(vj.questions >= 1)) fail('version.json must carry levels and questions counts');
for (const must of ['dlg-share', 'dlg-challenge', 'btn-invite', 'btn-q-share', 'result-share', 'update-news', 'menu-news']) if (!html.includes(`id=\"${must}\"`)) fail(`index.html missing #${must}`);
for (const must of ['src/ui/share.js', 'src/game/release.js']) if (!list.includes(must)) fail(`not precached: ${must}`);
console.log(`verify: OK (${list.length} precached entries)`);
