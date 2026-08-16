# Copy audit — 17 Aug 2026

Applied with `redesign/build/apply-copy-audit.mjs` (38 rules, 60 replacements),
plus five follow-ups the scan caught afterwards. All five pages now read in
formal plural.

## Errors fixed

| Was | Now | Why |
|---|---|---|
| στη**ν** χαμηλότερη τιμή | σε ανταγωνιστικές τιμές | The final ν is dropped before χ. Also removed the claim. |
| Άστο πάνω μας. | Αναλαμβάνουμε. | Correct spelling is Άσ' το; the phrase was the most colloquial on the site. |

## Claims removed

- "στη χαμηλότερη τιμή της αγοράς" → "σε ανταγωνιστικές τιμές"
- "σήμερα είναι **κορυφαία επιλογή** για…" → "σήμερα **καλύπτει**…"

Both were unverifiable superlatives a competitor could contradict.

## Wrong term

"τραπέζι εκτύπωσης" is a literal translation. The Greek term is **επιφάνεια
εκτύπωσης**.

## Register

The site was informal singular throughout except one line — "Συνδέστε τους
πελάτες σας με την επιχείρησή σας", in the NFC card. That was the only formal
plural on the site, and it appeared in the B2B copy. Everything is now formal
plural to match it, since two of the three services sell to businesses.

Representative changes:

| Was | Now |
|---|---|
| Δες τη δουλειά μας | Δείτε τη δουλειά μας |
| Πράγματα που εκτυπώσαμε | Πρόσφατα έργα |
| Εξερεύνησε τα έργα μας | Δείτε τα έργα μας |
| Θες κάτι δικό σου; | Θέλετε κάτι δικό σας; |
| Πες μας τι έχεις στο μυαλό σου | Πείτε μας την ιδέα σας |
| Πάτα σε ένα χρώμα… στείλεις | Πατήστε σε ένα χρώμα… στείλτε |
| Δεν βρίσκεις το χρώμα που θες; | Δεν βρίσκετε το χρώμα που θέλετε; |
| Παίρνεις προσφορά | Λαμβάνετε προσφορά |
| Παραλαμβάνεις | Παραλαμβάνετε |
| Δεν υπάρχουν ακόμα δουλειές… ! | Δεν υπάρχουν ακόμα έργα… . |

Also covered, and easy to miss: the two meta descriptions ("Δουλειές μας:",
"Δες πώς γίνεται η παραγγελία") which appear in Google results, and the
mobile pager hint in `portfolio-mobile.js` ("Σύρε" → "Σύρετε").

## Open question

"Στείλε μας DM" became "Στείλτε μας μήνυμα". Only the verb carries register, so
**"Στείλτε μας DM" would also have been correct** and keeps the platform-native
word next to the Instagram glyph. Worth reverting if the studio prefers it.
