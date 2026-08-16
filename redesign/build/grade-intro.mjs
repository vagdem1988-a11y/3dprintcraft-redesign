/* Encodes the origami-unfold clip and lifts its last second and a half so the
   final frame matches the page background it hands over to.

   The raw clip ends around RGB 218,217,221 while pattern.png (the page
   background) sits at 244,247,252 — without this the handoff visibly brightens
   at the exact moment it is supposed to be invisible.

   Commas inside an ffmpeg expression must be backslash-escaped or the
   filtergraph parser treats them as filter separators. Keeping the graph in a
   source file avoids the shell eating those backslashes.

   node build/grade-intro.mjs [source] [width] */
import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = resolve(root, 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');

const [srcArg, widthArg] = process.argv.slice(2);
const source = resolve(root, srcArg || '../video-sources/intro2-source.mp4');
const width = Number(widthArg || 720);
const out = resolve(root, 'assets/video/portfolio-intro.mp4');

const RAMP_FROM = 2.6;      // seconds — the unfold is essentially resolved here
const STRENGTH = 0.085;     // per second of ramp

const graph = [
  `scale=${width}:-2`,
  `eq=eval=frame:brightness=if(gt(t\\,${RAMP_FROM})\\,(t-${RAMP_FROM})*${STRENGTH}\\,0)`,
].join(',');

execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error',
  '-i', source,
  '-an',
  '-vf', graph,
  '-c:v', 'libx264',
  '-crf', '30',
  '-preset', 'slow',
  '-profile:v', 'main',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  out,
]);

console.log(`graded + encoded -> assets/video/portfolio-intro.mp4  ${Math.round((await stat(out)).size / 1024)} KB`);
