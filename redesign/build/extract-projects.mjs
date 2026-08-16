/* One-off: reads the original portfolio.html and turns its 28 hand-written
   cards into data/projects.json. After this, projects.json is the source of
   truth and build-portfolio.mjs renders the grid from it. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const html = await readFile(resolve(root, 'portfolio.html'), 'utf8');

const cardRe = /<button class="work-card" data-cat="([^"]+)" data-full="([^"]+)"[^>]*>\s*<img src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"[^>]*>\s*<span class="work-cap">([\s\S]*?)<span class="tag">([^<]+)<\/span>\s*<\/span>/g;

const projects = [];
for (const m of html.matchAll(cardRe)) {
  const [, cat, full, src, alt, w, h, capRaw, tag] = m;
  const title = capRaw.replace(/\s+/g, ' ').trim();
  const id = src.split('/').pop().replace(/\.[a-z]+$/i, '');
  projects.push({
    id,
    title,
    cat,
    tag,
    alt,
    // shots[0] is always the real photograph. Extra shots get appended later.
    shots: [{ src, alt, width: Number(w), height: Number(h) }],
    full,
  });
}

await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(
  resolve(root, 'data/projects.json'),
  JSON.stringify(projects, null, 2) + '\n',
  'utf8'
);

console.log(`extracted ${projects.length} projects -> data/projects.json`);
console.log(projects.map((p, i) => `${String(i + 1).padStart(2)} ${p.cat.padEnd(9)} ${p.title}`).join('\n'));
