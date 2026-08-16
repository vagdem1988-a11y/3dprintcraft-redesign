/* Renders the portfolio grid from data/projects.json into portfolio.html,
   between the BUILD:GRID markers. Adding a project = adding a JSON entry,
   then re-running this. Also emits <picture> sources only for WebP files that
   actually exist on disk, so a half-finished image pass can never 404. */
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const exists = async (rel) => {
  try { await access(resolve(root, rel)); return true; } catch { return false; }
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attr = (list) => esc(JSON.stringify(list));

const projects = JSON.parse(await readFile(resolve(root, 'data/projects.json'), 'utf8'));

/* Each shot may have a resized/WebP twin produced by optimize-images.mjs:
   assets/img/work/<id>.jpg  ->  assets/img/work/opt/<id>-640.webp (grid)
                                 assets/img/work/opt/<id>-1400.webp (gallery) */
const variant = (src, size) =>
  src.replace(/^assets\/img\/work\//, 'assets/img/work/opt/').replace(/\.(jpe?g|png)$/i, `-${size}.webp`);

const cards = [];
for (const p of projects) {
  const gridShots = [];
  const fullShots = [];

  for (const shot of p.shots) {
    if (shot.type === 'video') {
      /* A video shot travels as "poster|video": the card and the gallery both
         need the still to show before anything plays, and splitting on the pipe
         is cheaper than a second pair of data attributes. */
      const poster640 = variant(shot.poster, 640);
      const poster1400 = variant(shot.poster, 1400);
      gridShots.push(`${(await exists(poster640)) ? poster640 : shot.poster}|${shot.src}`);
      fullShots.push(`${(await exists(poster1400)) ? poster1400 : shot.poster}|${shot.src}`);
      continue;
    }
    const small = variant(shot.src, 640);
    const large = variant(shot.src, 1400);
    gridShots.push((await exists(small)) ? small : shot.src);
    fullShots.push((await exists(large)) ? large : shot.src);
  }

  const first = p.shots[0];
  const firstGrid = gridShots[0];
  const multi = p.shots.length > 1;
  const eager = cards.length < 4;   // the four cards above the fold load immediately

  const dots = multi
    ? `\n            <span class="pf-dots" aria-hidden="true">${p.shots
        .map((_, i) => `<i${i === 0 ? ' class="is-active"' : ''}></i>`)
        .join('')}</span>`
    : '';

  cards.push(`          <a class="pf-card" href="${esc(fullShots[0])}"
             data-cat="${esc(p.cat)}"
             data-title="${esc(p.title)}"
             data-shots='${attr(gridShots)}'
             data-full='${attr(fullShots)}'
             aria-label="${esc(p.title)} — άνοιγμα σε πλήρη οθόνη${multi ? ` (${p.shots.length} λήψεις)` : ''}">
            <span class="pf-frame">
              <img class="pf-shot is-active" src="${esc(firstGrid)}" alt="${esc(first.alt)}"
                   width="${first.width}" height="${first.height}"
                   ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
              <span class="pf-badge">${esc(p.tag)}</span>${dots}
            </span>
            <span class="pf-cap">${esc(p.title)}</span>
          </a>`);
}

const grid = `        <div class="pf-grid" id="pf-grid">
${cards.join('\n')}
        </div>`;

const file = resolve(root, 'portfolio.html');
let html = await readFile(file, 'utf8');

const START = '<!-- BUILD:GRID:START -->';
const END = '<!-- BUILD:GRID:END -->';
const from = html.indexOf(START);
const to = html.indexOf(END);

if (from === -1 || to === -1) {
  console.error(`Markers ${START} / ${END} not found in portfolio.html — nothing written.`);
  process.exit(1);
}

html = html.slice(0, from + START.length) + '\n' + grid + '\n        ' + html.slice(to);
await writeFile(file, html, 'utf8');

const shotTotal = projects.reduce((n, p) => n + p.shots.length, 0);
console.log(`built ${projects.length} cards, ${shotTotal} shots -> portfolio.html`);
