/* The homepage work grid was serving the untouched JPEG originals while
   optimize-images.mjs had already built WebP variants of every one of them —
   563 KB of images where 204 KB was sitting unused in opt/.

   Rewrites those four <img> tags to a srcset over the 640/1400 variants,
   keeping the JPEG nowhere: WebP has been universal for years and the rest of
   the site already ships .webp with no fallback.

   `sizes` comes from measuring the real layout, not guesswork: the card
   renders 338px wide at a 375px viewport (one column, ~90vw) and 276px at
   1280px (four columns, ~23vw).

   width/height are read off the 1400 variant so the intrinsic ratio is exact
   and nothing shifts while the image loads. */
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = resolve(root, 'index.html');
const SIZES = '(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 23vw';

let html = await readFile(page, 'utf8');
const before = html;

/* Only the work grid: hero art and the benchy render are left alone. */
const IMG = /<img src="assets\/img\/work\/([^"/]+)\.jpg" alt="([^"]*)" width="\d+" height="\d+" loading="lazy">/g;

const jobs = [...html.matchAll(IMG)];
if (!jobs.length) {
  console.log('  nothing to do — no raw work JPEGs left in the grid');
  process.exit(0);
}

for (const [tag, name, alt] of jobs) {
  const big = `assets/img/work/opt/${name}-1400.webp`;
  const small = `assets/img/work/opt/${name}-640.webp`;
  try {
    await access(resolve(root, big));
    await access(resolve(root, small));
  } catch {
    console.log(`  ${name}: SKIPPED — no optimised variant, left on the JPEG`);
    continue;
  }

  /* Both descriptors are measured, never assumed from the filename. sharp
     only ever downscales, so a source narrower than 1400 comes out of the
     "-1400" pass at its own width — mannequin-coasters is 900px wide in a file
     called -1400. Declaring 1400w there would hand the browser a false number
     and it picks the wrong file from it. */
  const big1 = await sharp(resolve(root, big)).metadata();
  const small1 = await sharp(resolve(root, small)).metadata();
  const set = big1.width === small1.width
    ? `${big} ${big1.width}w`          /* identical widths: one candidate, not two */
    : `${small} ${small1.width}w, ${big} ${big1.width}w`;

  const replacement =
    `<img src="${big}"\n` +
    `               srcset="${set}"\n` +
    `               sizes="${SIZES}"\n` +
    `               alt="${alt}" width="${big1.width}" height="${big1.height}" loading="lazy" decoding="async">`;
  console.log(`    srcset: ${set}`);

  html = html.replace(tag, replacement);
  console.log(`  ${name}: ${big1.width}x${big1.height}`);
}

await writeFile(page, html, 'utf8');
console.log(html === before ? '\n  index.html unchanged' : '\n  index.html rewritten');
