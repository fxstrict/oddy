// Dependency-free lint: syntax-checks every JS/MJS file and validates JSON files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKIP = new Set(['node_modules', 'dist', 'android', '.git', 'vendor']);
let failures = 0;
let checked = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else check(full);
  }
}

function check(file) {
  const ext = extname(file);
  try {
    if (ext === '.js' || ext === '.mjs') {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      checked++;
    } else if (ext === '.json' || ext === '.webmanifest') {
      JSON.parse(readFileSync(file, 'utf8'));
      checked++;
    }
  } catch (err) {
    failures++;
    console.error(`FAIL ${file}\n${err.stderr?.toString() || err.message}`);
  }
}

walk(ROOT);
console.log(`lint: ${checked} files checked, ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
