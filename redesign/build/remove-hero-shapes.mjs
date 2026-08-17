/* Removes the cube (.o2) and sphere (.o3) decorative SVGs from every hero,
   owner request 2026-08-17. The torus (.o1) stays — it is the fallback the
   masthead video replaces, and hero-video.css hides it only once the video is
   actually live. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['index.html', '404.html']) {
  const path = resolve(root, file);
  let html = await readFile(path, 'utf8');
  const before = html.length;

  /* The blocks hold an <svg> and nothing else, so the first </div> after the
     opening tag is always the matching close. */
  const done = [];
  for (const cls of ['o2', 'o3']) {
    const re = new RegExp(`\\n\\s*<div class="float-obj ${cls}"[\\s\\S]*?<\\/div>`);
    done.push(`${cls}: ${re.test(html) ? 'removed' : 'already gone'}`);
    html = html.replace(re, '');
  }

  await writeFile(path, html, 'utf8');

  const left = (html.match(/class="float-obj ([a-z0-9-]+)"/g) || [])
    .map((m) => m.split(' ')[1].replace('"', '')).join(' ');
  console.log(`  ${file.padEnd(12)} ${done.join(', ').padEnd(34)} -${before - html.length}b   left: ${left}`);
}
