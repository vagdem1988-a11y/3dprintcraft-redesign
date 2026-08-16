/* Turns a raw Higgsfield clip into web-ready hero assets:
     assets/video/hero.mp4    h264, plays everywhere
     assets/video/hero.webm   VP9, smaller, preferred where supported
     assets/img/hero-poster.webp   still frame shown before/instead of the video

   node build/encode-hero-video.mjs <source.mp4> [posterSeconds]

   Audio is stripped (the clip is silent and a hero must never make noise).
   ffmpeg comes from the x64 npm binary — it runs fine under emulation on this
   ARM64 machine, where the native ffmpeg-static package has no build. */
import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = resolve(root, 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');

const [source, posterAt = '4.8'] = process.argv.slice(2);
if (!source) {
  console.error('usage: node build/encode-hero-video.mjs <source.mp4> [posterSeconds]');
  process.exit(1);
}

const videoDir = resolve(root, 'assets/video');
await mkdir(videoDir, { recursive: true });

const WIDTH = 540;   // rendered at ~330px CSS at most, so 540 covers retina
const run = (args) => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...args]);
const kb = async (p) => `${Math.round((await stat(p)).size / 1024)} KB`;

const mp4 = resolve(videoDir, 'hero.mp4');
const webm = resolve(videoDir, 'hero.webm');
const posterPng = resolve(videoDir, 'poster-frame.png');
const poster = resolve(root, 'assets/img/hero-poster.webp');

console.log('h264 …');
run(['-i', source, '-an', '-vf', `scale=${WIDTH}:-2`, '-c:v', 'libx264', '-crf', '30',
     '-preset', 'slow', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
     '-movflags', '+faststart', mp4]);

console.log('vp9 …');
run(['-i', source, '-an', '-vf', `scale=${WIDTH}:-2`, '-c:v', 'libvpx-vp9', '-crf', '36',
     '-b:v', '0', '-row-mt', '1', webm]);

console.log('poster …');
run(['-ss', posterAt, '-i', source, '-frames:v', '1', posterPng]);
await sharp(posterPng).resize({ width: WIDTH }).webp({ quality: 80 }).toFile(poster);

const original = await stat(source);
console.log(`\nsource   ${Math.round(original.size / 1024)} KB`);
console.log(`hero.mp4   ${await kb(mp4)}`);
console.log(`hero.webm  ${await kb(webm)}`);
console.log(`poster     ${await kb(poster)}`);
