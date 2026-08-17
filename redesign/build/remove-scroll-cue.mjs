/* Drops the "↓ Κύλιση" hero cue, owner request 2026-08-17.

   It was already hidden below 720px, so removing it on desktop leaves it
   visible nowhere — markup, styles and keyframe go rather than a display:none
   that hides dead weight. motion.js already guards with `if (cue)`, so the
   scroll handler needs no change. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['index.html', '404.html']) {
  const path = resolve(root, file);
  let html = await readFile(path, 'utf8');
  const re = /\n\s*<span class="scroll-cue"[\s\S]*?<\/span>/;
  console.log(`  ${file.padEnd(12)} ${re.test(html) ? 'cue removed' : 'no cue found'}`);
  await writeFile(path, html.replace(re, ''), 'utf8');
}

const cssPath = resolve(root, 'assets/css/site.css');
let css = await readFile(cssPath, 'utf8');
const cuts = [
  /\.scroll-cue \{[\s\S]*?\n\}\n@keyframes cue-bob \{[^}]*\}\n/,   // base block + bob
  /\n\s*\.scroll-cue \{ display: none; \}/,                        // the <=720px hide
  /\n\.scroll-cue\.gone \{[^}]*\}/,                                // the fade-out state
];
cuts.forEach((re, i) => {
  console.log(`  css cut ${i + 1}: ${re.test(css) ? 'ok' : 'NOT FOUND'}`);
  css = css.replace(re, '');
});
await writeFile(cssPath, css, 'utf8');

const left = (css.match(/scroll-cue|cue-bob/g) || []).length;
console.log(`\n  scroll-cue / cue-bob mentions left in site.css: ${left}`);
