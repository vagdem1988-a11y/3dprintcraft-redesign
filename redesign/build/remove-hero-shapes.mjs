/* Removes the cube (.o2) and sphere (.o3) decorative SVGs from the homepage
   hero, owner request 2026-08-17. The torus (.o1) stays — it is the fallback
   the masthead video replaces, and hero-video.css hides it only once the
   video is actually live.

   404.html carries the same three shapes and is deliberately left alone; the
   request was about the homepage. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'index.html');

let html = await readFile(file, 'utf8');
const before = html.length;

/* The blocks hold an <svg> and nothing else, so the first </div> after the
   opening tag is always the matching close. */
for (const cls of ['o2', 'o3']) {
  const re = new RegExp(`\\n\\s*<div class="float-obj ${cls}"[\\s\\S]*?<\\/div>`);
  console.log(`  ${cls}: ${re.test(html) ? 'removed' : 'NOT FOUND'}`);
  html = html.replace(re, '');
}

await writeFile(file, html, 'utf8');

const left = (html.match(/class="float-obj ([a-z0-9-]+)"/g) || []).join('  ');
console.log(`\n  remaining in index.html: ${left}`);
console.log(`  bytes removed: ${before - html.length}`);

const stray = /\bo2\b|\bo3\b/.test(html.replace(/o2|o3/g, (m, i) =>
  /float-obj/.test(html.slice(Math.max(0, i - 40), i)) ? m : ''));
console.log(`  stray o2/o3 references left in markup: ${stray ? 'YES — check' : 'none'}`);
