/* Makes two WebP sizes for every project photo:
     assets/img/work/opt/<name>-640.webp   grid thumbnail
     assets/img/work/opt/<name>-1400.webp  fullscreen gallery
   The original JPEGs stay untouched as the fallback. Re-runnable: files that
   already exist and are newer than their source are skipped. */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(root, 'assets/img/work');
const outDir = join(srcDir, 'opt');

const SIZES = [
  { w: 640, quality: 76 },
  { w: 1400, quality: 82 },
];

await mkdir(outDir, { recursive: true });

/* Walks assets/img/work/ and every subfolder (shots/, placeholder/, …) but
   never opt/ itself, and mirrors the folder structure into opt/. */
async function collect(dir, prefix = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'opt') continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await collect(join(dir, entry.name), rel)));
    else if (/\.(jpe?g|png)$/i.test(entry.name)) found.push(rel);
  }
  return found;
}

const files = await collect(srcDir);

let before = 0;
let after = 0;
let made = 0;
let skipped = 0;

for (const name of files) {
  const src = join(srcDir, name);
  const srcStat = await stat(src);
  before += srcStat.size;

  for (const { w, quality } of SIZES) {
    const dest = join(outDir, dirname(name), `${parse(name).name}-${w}.webp`);
    await mkdir(dirname(dest), { recursive: true });

    try {
      const destStat = await stat(dest);
      if (destStat.mtimeMs >= srcStat.mtimeMs) {
        after += w === 640 ? destStat.size : 0;
        skipped += 1;
        continue;
      }
    } catch { /* not built yet */ }

    const info = await sharp(src)
      .rotate()                                        // honour EXIF orientation
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(dest);

    if (w === 640) after += info.size;
    made += 1;
  }

  process.stdout.write('.');
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log('\n');
console.log(`sources        ${files.length} files, ${kb(before)}`);
console.log(`grid webp      ${kb(after)}  (${Math.round((1 - after / before) * 100)}% smaller)`);
console.log(`written ${made}, skipped ${skipped} -> ${outDir}`);
