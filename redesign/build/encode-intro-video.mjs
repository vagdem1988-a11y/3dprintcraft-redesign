/* Re-encodes the raw Higgsfield intro clip into the web asset the portfolio
   page actually loads.

   node build/encode-intro-video.mjs [source] [width]

   The source comes back as HEVC, which most browsers refuse to play, so h264
   is not an optimisation here — it is what makes it play at all. */
import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = resolve(root, 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');

const [srcArg, widthArg] = process.argv.slice(2);
const source = resolve(root, srcArg || 'assets/video/intro-source.mp4');
const width = Number(widthArg || 720);          // fills a phone screen
const out = resolve(root, 'assets/video/portfolio-intro.mp4');

const kb = async (p) => Math.round((await stat(p)).size / 1024);

console.log(`h264 ${width}px …`);
execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error',
  '-i', source,
  '-an',                                        // silent, always
  '-vf', `scale=${width}:-2`,
  '-c:v', 'libx264',
  '-crf', '30',
  '-preset', 'slow',
  '-profile:v', 'main',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',                    // starts playing before fully loaded
  out,
]);

console.log(`\nsource   ${await kb(source)} KB (HEVC, unplayable in most browsers)`);
console.log(`intro    ${await kb(out)} KB (h264)`);
