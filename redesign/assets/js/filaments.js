/* Filament palette — real inventory ported from 3dprintcraft/assets/js/colors.js.
   Each color: [name, hex]; hex 'NA' = translucent/clear (checkerboard, no copy). */
document.addEventListener("DOMContentLoaded", () => {
  const PALETTE = [
    { cat: "PLA Basics", colors: [
      ["Jade White", "#FFFFFF"], ["Gold", "#E4BD68"], ["Silver", "#A6A9AA"], ["Gray", "#8E9089"],
      ["Bronze", "#847D48"], ["Cocoa Brown", "#6F5034"], ["Red", "#C12E1F"], ["Magenta", "#EC008C"],
      ["Pink", "#F55A74"], ["Orange", "#FF6A13"], ["Yellow", "#F4EE2A"], ["Bambu Green", "#00AE42"],
      ["Mistletoe Green", "#3F8E43"], ["Turquoise", "#00B1B7"], ["Cyan", "#0086D6"], ["Blue", "#0A2989"],
      ["Purple", "#5E43B7"], ["Black", "#000000"],
    ]},
    { cat: "PLA Matte", colors: [
      ["Latte Brown", "#D3B7A7"], ["Desert Tan", "#E8DBB7"], ["Lilac Purple", "#AE96D4"],
      ["Sakura Pink", "#E8AFCF"], ["Mandarin Orange", "#F99963"], ["Dark Red", "#BB3D43"],
      ["Dark Brown", "#7D6556"], ["Dark Green", "#68724D"],
    ]},
    { cat: "ABS", colors: [
      ["Tangerine Yellow", "#FFC72C"], ["Azure", "#489FDF"], ["White", "#FFFFFF"], ["Silver", "#87909A"],
      ["Red", "#D32941"], ["Orange", "#FF6A13"], ["Blue", "#0A2CA5"], ["Black", "#000000"],
    ]},
    { cat: "PETG Translucent", colors: [
      ["Translucent Brown", "#C9A381"], ["Translucent Pink", "#F9C1BD"], ["Translucent Clear", "NA"],
    ]},
    { cat: "TPU", colors: [["Black", "#000000"]] },
    { cat: "ASA", colors: [["Black", "#000000"]] },
    { cat: "PA6-CF", colors: [["Black", "#000000"]] },
    { cat: "ABS-GF", colors: [["Black", "#000000"]] },
  ];

  /* Colours we can prove: each is paired with a real print in that colour.
     The pairing comes from the authored alt text of each portfolio photo, not
     from guesswork — and only colours with a genuine photo appear here. The
     other 30-odd live in the grid below. Add a line when a new photo exists. */
  const FEATURED = [
    { name: "Lilac Purple", cat: "PLA Matte", hex: "#AE96D4", id: "15-zeta-heart-keychain", piece: "Μπρελόκ «Zeta»" },
    { name: "Turquoise", cat: "PLA Basics", hex: "#00B1B7", id: "09-nomik-keychain", piece: "Μπρελόκ «nomik»" },
    { name: "Red", cat: "PLA Basics", hex: "#C12E1F", id: "10-kate-camera-keychain", piece: "Μπρελόκ «Kate»" },
    { name: "Blue", cat: "PLA Basics", hex: "#0A2989", id: "22-vellence-keychain", piece: "Μπρελόκ «Vellence»" },
    { name: "Black", cat: "PLA Basics", hex: "#000000", id: "21-minifox-keychain", piece: "Μπρελόκ «minifox»" },
    /* Jade White sits last on purpose: it is the pill nearest the page below,
       and white against the light page reads as the stack dissolving into it. */
    { name: "Jade White", cat: "PLA Basics", hex: "#FFFFFF", id: "05-pendant-lamp-white", piece: "Κρεμαστό φωτιστικό" },
  ];

  const root = document.getElementById("paletteRoot");
  const filterRow = document.getElementById("pal-filters");
  if (!root || !filterRow) return;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const isHex = (h) => /^#[0-9A-Fa-f]{6}$/.test(h || "");
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const INK_L = luminance("#0e1220");
  const STAGE = "#0b1020";              /* what the glass sits on */
  const blend = (hex, over, alpha) => {
    const a = parseInt(hex.slice(1), 16), b = parseInt(over.slice(1), 16);
    const mix = (s, d) => Math.round(s * alpha + d * (1 - alpha));
    const r = mix((a >> 16) & 255, (b >> 16) & 255);
    const g = mix((a >> 8) & 255, (b >> 8) & 255);
    const bl = mix(a & 255, b & 255);
    return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
  };

  /* ── featured band ─────────────────────────────────────────────────── */

  const band = document.getElementById("pal-featured");
  if (band) {
    const make = (tag, cls, text) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text) el.textContent = text;
      return el;
    };

    const stage = make("div", "pal-stage");
    band.append(stage);
    stage.append(make("h2", null, "Σε πραγματικές εκτυπώσεις"));
    stage.append(make("p", "pf-sub", "Χρώματα που έχουμε ήδη τυπώσει — δείτε τα σε πραγματική εκτύπωση."));

    const strips = make("div", "pal-strips");

    /* Ordered by luminance, darkest first, so the stack reads as one tonal
       run instead of category order. Sorting rather than hand-ordering means a
       colour added later cannot land beside its opposite — which is how white
       ended up next to black. Jade White finishes the stack and meets the
       light page below it. */
    const ordered = FEATURED.slice().sort((a, b) => luminance(a.hex) - luminance(b.hex));

    ordered.forEach((f) => {
      /* Glass blends the colour with the dark stage behind it, so contrast has
         to be measured on that blend, not on the raw hex. */
      const L = luminance(blend(f.hex, STAGE, 0.66));
      const tone = contrast(L, INK_L) >= contrast(L, 1) ? "on-light" : "on-dark";

      const a = make("a", "pal-strip " + tone);
      a.href = "portfolio.html";
      a.style.setProperty("--pill", f.hex);
      a.setAttribute("aria-label", `${f.name} — δείτε το ${f.piece} στο portfolio`);

      const img = document.createElement("img");
      img.src = `assets/img/work/opt/${f.id}-640.webp`;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";

      const label = document.createElement("span");
      label.append(make("span", "ps-name", f.name));
      label.append(make("span", "ps-meta", `${f.cat} · ${f.piece}`));

      a.append(img, label);
      strips.append(a);
    });
    stage.append(strips);

    /* The backdrop is these same colours inverted — 255 minus each channel —
       so the glow is derived from the stack rather than picked by hand. */
    ordered.forEach((f, i) => {
      const n = parseInt(f.hex.slice(1), 16);
      const inv = [255 - ((n >> 16) & 255), 255 - ((n >> 8) & 255), 255 - (n & 255)];
      stage.style.setProperty("--inv-" + (i + 1), "rgba(" + inv.join(",") + ",0.55)");
    });

    /* Paint the word "χρώμα" in the featured colours, drawn from the same list
       so the heading and the stack stay in step.

       Black is excluded because you asked. Jade White is excluded because it
       would be invisible: the page sits on #f5f6f9, so a white stop in the
       gradient reads as a hole in the middle of the word. */
    const wordStops = ordered
      .filter((f) => luminance(f.hex) > 0.02 && luminance(f.hex) < 0.85)
      .map((f) => f.hex);

    const word = document.querySelector("#pal-h .accent");
    if (word && wordStops.length > 1) {
      word.classList.add("pal-word");
      word.style.setProperty(
        "--pal-word-gradient",
        "linear-gradient(100deg, " + wordStops.join(", ") + ")"
      );
    }

    /* deal the pills in when the band arrives; if the observer never fires,
       they must not be left invisible */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strips.classList.add("is-in");
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          strips.classList.add("is-in");
          io.disconnect();
        });
      }, { threshold: 0.15 });
      io.observe(strips);
      setTimeout(() => strips.classList.add("is-in"), 1200);
    }
  }

  /* render all categories.
     Each material is its own stack, sorted dark to light like the featured
     band — one 41-pill column would be about 3,000px tall, and tonal order
     stops harsh neighbours the way it did above. Translucent entries have no
     luminance to sort on, so they go last. */
  root.innerHTML = PALETTE.map((group) => {
    const sorted = group.colors.slice().sort((a, b) => {
      if (!isHex(a[1])) return 1;
      if (!isHex(b[1])) return -1;
      return luminance(a[1]) - luminance(b[1]);
    });
    group = { ...group, colors: sorted };
    const n = group.colors.length;
    return `
    <section class="pal-section" data-cat="${esc(group.cat)}">
      <div class="pal-cat">
        <h2>${esc(group.cat)}</h2>
        <span class="count">${n} ${n === 1 ? "χρώμα" : "χρώματα"}</span>
      </div>
      <div class="pal-grid">
        ${group.colors.map(([name, hex], idx) => {
          if (!isHex(hex)) {
            return `<div class="pal-swatch is-clear is-dark-text" style="--z:${idx + 1}" role="img" aria-label="${esc(name)} — διάφανο">
              <span class="pname">${esc(name)}</span>
              <span class="phex">διάφανο</span>
            </div>`;
          }
          /* pick whichever of ink/white actually contrasts more; if neither
             reaches AA 4.5:1, underlay a dark scrim behind white text */
          const L = luminance(hex);
          const darkRatio = contrast(L, INK_L);
          const whiteRatio = contrast(L, 1);
          const cls = Math.max(darkRatio, whiteRatio) < 4.5
            ? "needs-scrim"
            : (darkRatio >= whiteRatio ? "is-dark-text" : "is-light-text");
          return `<button class="pal-swatch ${cls}" type="button" style="background:${hex};--z:${idx + 1}"
            data-hex="${hex}" data-name="${esc(name)}" data-cat="${esc(group.cat)}" aria-label="${esc(name)} ${hex} — αντιγραφή">
            <span class="copied">Αντιγράφηκε!</span>
            <span class="pname">${esc(name)}</span>
            <span class="phex">${hex}</span>
          </button>`;
        }).join("")}
      </div>
    </section>`;
  }).join("");

  /* material filters */
  const cats = ["Όλα", ...PALETTE.map((g) => g.cat)];
  filterRow.innerHTML = cats.map((c, i) =>
    `<button class="filter-btn" type="button" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterRow.querySelectorAll(".filter-btn").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    root.querySelectorAll(".pal-section").forEach((sec) => {
      sec.hidden = btn.dataset.cat !== "Όλα" && sec.dataset.cat !== btn.dataset.cat;
    });
  });

  /* click-to-copy with feedback. The async Clipboard API only works in a secure
     context (HTTPS or localhost); on a phone opening the preview over the LAN IP
     (plain HTTP) it's absent, so we fall back to a synchronous execCommand copy
     that also works over HTTP and on older iOS/Android. */
  /* Flood: the swatch is 60px, the decision is not. Hovering or touching one
     tints the whole page behind it. */
  const flood = document.createElement("div");
  flood.className = "pal-flood";
  flood.setAttribute("aria-hidden", "true");
  document.body.prepend(flood);

  let floodOff;
  const setFlood = (hex) => {
    clearTimeout(floodOff);
    if (!hex) { floodOff = setTimeout(() => flood.classList.remove("is-on"), 260); return; }
    flood.style.setProperty("--flood", hex);
    flood.classList.add("is-on");
  };

  root.addEventListener("pointerover", (e) => {
    const sw = e.target.closest(".pal-swatch[data-hex]");
    if (sw) setFlood(sw.dataset.hex);
  });
  root.addEventListener("pointerleave", () => setFlood(null));

  const status = document.getElementById("copy-status");
  const announce = (msg) => { if (status) status.textContent = msg; };

  /* legacy copy: hidden, readonly textarea + execCommand. readonly keeps iOS from
     popping the keyboard; must run synchronously inside the tap to keep the user
     activation execCommand("copy") requires. Returns true on success. */
  const legacyCopy = (text) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length); /* iOS needs an explicit range */
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  root.addEventListener("click", (e) => {
    const sw = e.target.closest(".pal-swatch[data-hex]");
    if (!sw) return;
    const hex = sw.dataset.hex;
    /* A bare hex is a strange thing to send in a DM. Copy something the
       studio can read back: "Lilac Purple — PLA Matte (#AE96D4)". */
    const phrase = sw.dataset.name + " — " + sw.dataset.cat + " (" + hex + ")";
    clearTimeout(sw._t); /* per-element timer: rapid re-clicks restart the full duration */

    setFlood(hex);
    const showCopied = () => {
      sw.classList.add("just-copied");
      announce("Αντιγράφηκε: " + phrase);
      sw._t = setTimeout(() => sw.classList.remove("just-copied"), 1600);
    };
    const showManual = () => {
      const cap = sw.querySelector(".phex");
      if (!cap.dataset.orig) cap.dataset.orig = cap.textContent;
      cap.textContent = "επίλεξε: " + hex;
      announce("Η αντιγραφή δεν είναι διαθέσιμη — ο κωδικός είναι " + hex);
      sw._t = setTimeout(() => (cap.textContent = cap.dataset.orig), 2000);
    };

    /* secure context: prefer the async Clipboard API, fall back to legacy on
       rejection. Insecure context (LAN HTTP on mobile): go straight to legacy
       synchronously so the user activation is still live. */
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(phrase).then(showCopied, () => {
        legacyCopy(phrase) ? showCopied() : showManual();
      });
    } else {
      legacyCopy(phrase) ? showCopied() : showManual();
    }
  });
});
