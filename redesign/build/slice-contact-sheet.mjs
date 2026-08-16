/* Cuts a Higgsfield contact sheet (a grid of shots in one big PNG) into
   individual images.

   node build/slice-contact-sheet.mjs <sheet.png> <project-id> [cols] [rows]

   Writes assets/img/work/shots/<project-id>-01.jpg … and prints what it made.
   Wiring them into projects.json is a separate, deliberate step. */
import { mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [sheetPath, projectId, colsArg, rowsArg] = process.argv.slice(2);

if (!sheetPath || !projectId) {
  console.error('usage: node build/slice-contact-sheet.mjs <sheet.png> <project-id> [cols] [rows]');
  process.exit(1);
}

const cols = Number(colsArg || 3);
const rows = Number(rowsArg || 3);
const GUTTER = 8;              // trim the black seam between tiles

const outDir = resolve(root, 'assets/img/work/shots');
await mkdir(outDir, { recursive: true });

const meta = await sharp(sheetPath).metadata();
const tileW = Math.floor(meta.width / cols);
const tileH = Math.floor(meta.height / rows);

console.log(`sheet ${meta.width}x${meta.height} -> ${cols}x${rows} tiles of ${tileW}x${tileH}`);

let n = 0;
for (let r = 0; r < rows; r += 1) {
  for (let c = 0; c < cols; c += 1) {
    n += 1;
    const name = `${projectId}-${String(n).padStart(2, '0')}.jpg`;
    const info = await sharp(sheetPath)
      .extract({
        left: c * tileW + GUTTER,
        top: r * tileH + GUTTER,
        width: tileW - GUTTER * 2,
        height: tileH - GUTTER * 2,
      })
      .jpeg({ quality: 92 })
      .toFile(join(outDir, name));
    console.log(`  ${name}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
  }
}

console.log(`\n${n} tiles -> assets/img/work/shots/`);
