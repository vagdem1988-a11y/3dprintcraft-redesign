/* Sets the shot list for one project in data/projects.json.

   node build/set-shots.mjs <project-id> <file> [file …]

   Paths are relative to redesign/. The project's first existing shot (the real
   photograph) is kept as shot 1 unless --replace is passed. Every added shot is
   marked generated:true so it is always obvious which images are AI renders. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const replace = args.includes('--replace');
const [projectId, ...files] = args.filter((a) => a !== '--replace');

if (!projectId || !files.length) {
  console.error('usage: node build/set-shots.mjs <project-id> <file> [file …] [--replace]');
  process.exit(1);
}

const dataPath = resolve(root, 'data/projects.json');
const projects = JSON.parse(await readFile(dataPath, 'utf8'));
const project = projects.find((p) => p.id === projectId);

if (!project) {
  console.error(`no project with id "${projectId}"`);
  process.exit(1);
}

const real = project.shots.find((s) => !s.placeholder && !s.generated);
const shots = replace || !real ? [] : [real];

for (const file of files) {
  const rel = file.replace(/\\/g, '/');
  const meta = await sharp(resolve(root, rel)).metadata();
  shots.push({
    src: rel,
    alt: `${project.title} — λήψη ${shots.length + 1}`,
    width: meta.width,
    height: meta.height,
    generated: true,
  });
}

project.shots = shots;
await writeFile(dataPath, JSON.stringify(projects, null, 2) + '\n', 'utf8');

console.log(`${project.title}: ${shots.length} shots`);
shots.forEach((s, i) => console.log(`  ${i + 1}. ${s.src}${s.generated ? '  (generated)' : '  (photo)'}`));
