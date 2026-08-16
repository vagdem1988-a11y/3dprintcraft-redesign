/* One-off: swaps the old portfolio markup for the v2 scaffold.
   After this runs, build-portfolio.mjs owns everything between the
   BUILD:GRID markers and this script is never needed again. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'portfolio.html');
let html = await readFile(file, 'utf8');

const cut = (from, to, replacement, label) => {
  const a = html.indexOf(from);
  if (a === -1) { console.log(`  skip  ${label} (start not found)`); return; }
  const b = html.indexOf(to, a);
  if (b === -1) { console.log(`  skip  ${label} (end not found)`); return; }
  html = html.slice(0, a) + replacement + html.slice(b + to.length);
  console.log(`  ok    ${label}`);
};

/* 1. filters + grid + empty state */
const scaffold = `<div class="pf-filters" role="group" aria-label="Φίλτρα κατηγορίας" hidden>
          <button class="pf-chip" aria-pressed="true" data-filter="all">Όλα</button>
          <button class="pf-chip" aria-pressed="false" data-filter="nfc">NFC</button>
          <button class="pf-chip" aria-pressed="false" data-filter="keychain">Μπρελόκ</button>
          <button class="pf-chip" aria-pressed="false" data-filter="coaster">Σουβέρ</button>
          <button class="pf-chip" aria-pressed="false" data-filter="lamp">Φωτιστικά</button>
          <button class="pf-chip" aria-pressed="false" data-filter="stand">Stands</button>
          <button class="pf-chip" aria-pressed="false" data-filter="gadget">Gadgets</button>
          <button class="pf-chip" aria-pressed="false" data-filter="gift">Δώρα</button>
        </div>
        <p class="pf-count" id="pf-count" aria-live="polite"></p>

        <!-- BUILD:GRID:START -->
        <!-- BUILD:GRID:END -->

        <p class="pf-empty" id="pf-empty" hidden>Δεν υπάρχουν ακόμα δουλειές σε αυτή την κατηγορία — στείλε μας την ιδέα σου!</p>`;

cut('<div class="filter-row"', '</p>\n', scaffold + '\n', 'grid scaffold');

/* 2. gallery dialog */
const modal = `<dialog class="pv-modal" id="pv-modal" aria-labelledby="pv-title">
    <div class="pv-shell">
      <div class="pv-top">
        <h2 class="pv-title" id="pv-title"></h2>
        <span class="pv-counter" aria-live="polite"></span>
        <button class="pv-close" type="button" aria-label="Κλείσιμο">✕</button>
      </div>
      <div class="pv-stage">
        <button class="pv-nav pv-prev" type="button" aria-label="Προηγούμενη λήψη">‹</button>
        <img src="" alt="">
        <button class="pv-nav pv-next" type="button" aria-label="Επόμενη λήψη">›</button>
      </div>
      <div class="pv-thumbs" role="group" aria-label="Λήψεις έργου"></div>
    </div>
  </dialog>`;

cut('<dialog class="lightbox"', '</dialog>', modal, 'gallery dialog');

/* 3. stylesheet + script wiring */
html = html.replace(
  '<link rel="stylesheet" href="assets/css/site.css">',
  '<link rel="stylesheet" href="assets/css/site.css">\n  <link rel="stylesheet" href="assets/css/portfolio-v2.css">'
);
html = html.replace('assets/js/portfolio.js', 'assets/js/portfolio-v2.js');

/* 4. drop Cloudflare's injected analytics/challenge tags — they came from
      mirroring the live site, they are not part of the source. */
html = html
  .replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?\}\)\(\);<\/script>/g, '')
  .replace(/<script type="module" src="https:\/\/static\.cloudflareinsights\.com[\s\S]*?<\/script>/g, '');

await writeFile(file, html, 'utf8');
console.log('patched portfolio.html');
