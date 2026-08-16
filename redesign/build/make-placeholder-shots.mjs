/* TEMPORARY. Derives extra "shots" for a project by cropping its single real
   photo, purely so the hover-cycle / gallery mechanics can be demonstrated
   before the real multi-shot photography exists. Delete the placeholder/
   folder and the extra shots from projects.json once real images land. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workDir = resolve(root, 'assets/img/work');
const outDir = join(workDir, 'placeholder');

const TARGETS = ['12-logo-bag-tag', '15-zeta-heart-keychain'];

// left/right/top framings plus a tighter centre crop
const CROPS = [
  { tag: 's2', zoom: 1.35, ax: 0.2, ay: 0.5 },
  { tag: 's3', zoom: 1.35, ax: 0.8, ay: 0.5 },
  { tag: 's4', zoom: 1.6, ax: 0.5, ay: 0.35 },
];

await mkdir(outDir, { recursive: true });

const projects = JSON.parse(await readFile(resolve(root, 'data/projects.json'), 'utf8'));

for (const id of TARGETS) {
  const project = projects.find((p) => p.id === id);
  if (!project) { console.log(`  skip ${id} — not in projects.json`); continue; }

  const srcRel = project.shots[0].src;
  const src = resolve(root, srcRel);
  const meta = await sharp(src).metadata();

  // keep only the real photo, then re-add fresh placeholders
  project.shots = [project.shots[0]];

  for (const crop of CROPS) {
    const w = Math.round(meta.width / crop.zoom);
    const h = Math.round(meta.height / crop.zoom);
    const left = Math.round((meta.width - w) * crop.ax);
    const top = Math.round((meta.height - h) * crop.ay);
    const rel = `assets/img/work/placeholder/${id}-${crop.tag}.jpg`;

    await sharp(src)
      .extract({ left, top, width: w, height: h })
      .jpeg({ quality: 88 })
      .toFile(resolve(root, rel));

    project.shots.push({
      src: rel,
      alt: `${project.title} — εναλλακτική λήψη`,
      width: w,
      height: h,
      placeholder: true,
    });
  }

  console.log(`  ${id}: 1 real + ${CROPS.length} placeholder shots`);
}

await writeFile(resolve(root, 'data/projects.json'), JSON.stringify(projects, null, 2) + '\n', 'utf8');
console.log('projects.json updated');
