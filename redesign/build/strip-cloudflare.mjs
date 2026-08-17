/* Removes Cloudflare artifacts that came along when the live site was mirrored:
   the email-obfuscation markup, the analytics beacon, the RUM call and the
   challenge-platform injector. None of them belong in the source.

   The email matters most — without CF's decode script the address renders
   literally as "[email protected]" and its link points at a /cdn-cgi/ path
   that only exists on their edge. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EMAIL = 'contactprintcraft3d@gmail.com';   // from each page's own schema.org block
const FILES = ['index.html', 'portfolio.html', 'filaments.html', 'contact.html', '404.html'];

for (const file of FILES) {
  const path = resolve(root, file);
  let html = await readFile(path, 'utf8');
  const before = html;

  html = html
    .replace(/href="\/cdn-cgi\/l\/email-protection#[^"]*"/g, `href="mailto:${EMAIL}"`)
    .replace(/<span class="__cf_email__"[^>]*>\[email&#160;protected\]<\/span>/g, EMAIL)
    .replace(/<script[^>]*cdn-cgi[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<script[^>]*beacon\.min\.js[\s\S]*?<\/script>/g, '')
    .replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?\}\)\(\);<\/script>/g, '');

  if (html !== before) {
    await writeFile(path, html, 'utf8');
    console.log(`  cleaned ${file}`);
  }
}

console.log('');
for (const file of FILES) {
  const html = await readFile(resolve(root, file), 'utf8');
  const leftovers = /cf_email|cdn-cgi|CF\$cv/.test(html);
  const mailtos = (html.match(new RegExp(`mailto:${EMAIL}`, 'g')) || []).length;
  console.log(`  ${file.padEnd(15)} cloudflare: ${leftovers ? 'STILL PRESENT' : 'none'}   mailto links: ${mailtos}`);
}
