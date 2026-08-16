/* One-off: applies the 2026-08-17 copy audit.

   Switches the site to formal plural (πληθυντικός ευγενείας), fixes two
   outright errors, drops two unverifiable claims, and replaces the most
   colloquial phrasing. Reports every rule that did not match so nothing
   fails silently. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RULES = [
  // ── outright errors ────────────────────────────────────────────────
  ['στην χαμηλότερη τιμή της αγοράς', 'σε ανταγωνιστικές τιμές'],   // also drops the claim
  ['Άστο πάνω μας.', 'Αναλαμβάνουμε.'],

  // ── unverifiable claims ────────────────────────────────────────────
  ['σήμερα είναι κορυφαία επιλογή για custom εκτυπώσεις',
   'σήμερα καλύπτει custom εκτυπώσεις'],

  // ── wrong technical term ───────────────────────────────────────────
  ['Ό,τι χωράει στο τραπέζι εκτύπωσης, γίνεται.',
   'Ό,τι χωράει στην επιφάνεια εκτύπωσης, κατασκευάζεται.'],

  // ── homepage ───────────────────────────────────────────────────────
  ['στην ιδέα&nbsp;σου.', 'στην ιδέα&nbsp;σας.'],
  ['Δες τη δουλειά μας', 'Δείτε τη δουλειά μας'],
  ['Στείλε μας DM στο Instagram ή email με αυτό που έχεις στο μυαλό σου',
   'Στείλτε μας μήνυμα στο Instagram ή email με την ιδέα σας'],
  ['Στείλε μας DM', 'Στείλτε μας μήνυμα'],
  ['↓ Κύλισε', '↓ Κύλιση'],
  ['Τρεις τρόποι να σε βοηθήσουμε', 'Τρεις τρόποι να σας βοηθήσουμε'],
  ['Στείλε μας το αρχείο ή την ιδέα σου', 'Στείλτε μας το αρχείο ή την ιδέα σας'],
  ['Πράγματα που εκτυπώσαμε', 'Πρόσφατα έργα'],
  ['Διάλεξε από 40+ χρώματα', 'Επιλέξτε ανάμεσα σε 40+ χρώματα'],
  ['Δες όλη την παλέτα', 'Δείτε όλη την παλέτα'],
  ['Έχεις ιδέα;', 'Έχετε μια ιδέα;'],
  ['Στείλε email', 'Στείλτε email'],

  // ── portfolio ──────────────────────────────────────────────────────
  ['Εξερεύνησε<br><span class="accent">τα έργα μας.</span>',
   'Δείτε<br><span class="accent">τα έργα μας.</span>'],
  ['Δεν υπάρχουν ακόμα δουλειές σε αυτή την κατηγορία — στείλε μας την ιδέα σου!',
   'Δεν υπάρχουν ακόμα έργα σε αυτή την κατηγορία. Στείλτε μας την ιδέα σας.'],
  ['Θες κάτι δικό σου;', 'Θέλετε κάτι δικό σας;'],
  ['Πες μας τι έχεις στο μυαλό σου', 'Πείτε μας την ιδέα σας'],

  // ── filaments ──────────────────────────────────────────────────────
  ['Διάλεξε το', 'Επιλέξτε το'],
  ['Πάτα σε ένα χρώμα για να αντιγράψεις τον κωδικό του και να μας τον στείλεις μαζί με την ιδέα σου.',
   'Πατήστε σε ένα χρώμα για να αντιγράψετε τον κωδικό του και στείλτε τον μαζί με την ιδέα σας.'],
  ['Η παλέτα χρειάζεται JavaScript για να εμφανιστεί. Στείλε μας',
   'Η παλέτα χρειάζεται JavaScript για να εμφανιστεί. Στείλτε μας'],
  ['και σου στέλνουμε φωτογραφίες όλων των χρωμάτων.',
   'και σας στέλνουμε φωτογραφίες όλων των χρωμάτων.'],
  ['Δεν βρίσκεις το χρώμα που θες;', 'Δεν βρίσκετε το χρώμα που θέλετε;'],
  ['Ρώτησέ μας', 'Ρωτήστε μας'],
  ['— έρχονται συνέχεια νέα.', '— προσθέτουμε νέα συνεχώς.'],

  // ── contact ────────────────────────────────────────────────────────
  ['Στείλε μήνυμα στο @3dprintcraft με φωτογραφία, αρχείο ή απλώς την ιδέα σου.',
   'Στείλτε μήνυμα στο @3dprintcraft με φωτογραφία, αρχείο ή απλώς την ιδέα σας.'],
  ['Άνοιξε το Instagram', 'Ανοίξτε το Instagram'],
  ['βρες μας στο', 'βρείτε μας στο'],
  ['Πώς παραγγέλνεις', 'Πώς παραγγέλνετε'],
  ['Στείλε την ιδέα σου', 'Στείλτε την ιδέα σας'],
  ['DM ή email με φωτογραφία, σκίτσο ή αρχείο 3D — ό,τι έχεις.',
   'DM ή email με φωτογραφία, σκίτσο ή αρχείο 3D — ό,τι έχετε.'],
  ['Παίρνεις προσφορά', 'Λαμβάνετε προσφορά'],
  ['Διαλέγεις χρώμα από την', 'Επιλέγετε χρώμα από την'],
  ['και ξεκινάμε. Σου στέλνουμε φωτογραφία πριν φύγει.',
   'και ξεκινάμε. Σας στέλνουμε φωτογραφία πριν την αποστολή.'],
  ['Παραλαμβάνεις', 'Παραλαμβάνετε'],

  // ── the paged mobile pager hint lives in JS ────────────────────────
  ['Σύρε για τα επόμενα', 'Σύρετε για τα επόμενα'],
];

const FILES = [
  'index.html', 'portfolio.html', 'filaments.html', 'contact.html', '404.html',
  'assets/js/portfolio-mobile.js',
];

const hits = new Map(RULES.map(([from]) => [from, 0]));

for (const file of FILES) {
  const path = resolve(root, file);
  let text;
  try { text = await readFile(path, 'utf8'); } catch { console.log(`  skip ${file} (missing)`); continue; }

  const before = text;
  for (const [from, to] of RULES) {
    const parts = text.split(from);
    if (parts.length > 1) {
      hits.set(from, hits.get(from) + parts.length - 1);
      text = parts.join(to);
    }
  }
  if (text !== before) {
    await writeFile(path, text, 'utf8');
    console.log(`  updated ${file}`);
  }
}

console.log('');
const missed = [...hits.entries()].filter(([, n]) => n === 0);
const applied = [...hits.entries()].filter(([, n]) => n > 0);
console.log(`applied ${applied.length}/${RULES.length} rules, ${applied.reduce((n, [, c]) => n + c, 0)} replacements`);
if (missed.length) {
  console.log('\nNO MATCH — check these by hand:');
  missed.forEach(([from]) => console.log(`  · ${from}`));
}
