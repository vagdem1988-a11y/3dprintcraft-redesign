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

  /* render all categories */
  root.innerHTML = PALETTE.map((group) => {
    const n = group.colors.length;
    return `
    <section class="pal-section" data-cat="${esc(group.cat)}">
      <div class="pal-cat">
        <h2>${esc(group.cat)}</h2>
        <span class="count">${n} ${n === 1 ? "χρώμα" : "χρώματα"}</span>
      </div>
      <div class="pal-grid">
        ${group.colors.map(([name, hex]) => {
          if (!isHex(hex)) {
            return `<div class="pal-swatch is-clear is-dark-text" role="img" aria-label="${esc(name)} — διάφανο">
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
          return `<button class="pal-swatch ${cls}" type="button" style="background:${hex}"
            data-hex="${hex}" aria-label="${esc(name)} ${hex} — αντιγραφή κωδικού">
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
    clearTimeout(sw._t); /* per-element timer: rapid re-clicks restart the full duration */

    const showCopied = () => {
      sw.classList.add("just-copied");
      announce("Αντιγράφηκε ο κωδικός " + hex);
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
      navigator.clipboard.writeText(hex).then(showCopied, () => {
        legacyCopy(hex) ? showCopied() : showManual();
      });
    } else {
      legacyCopy(hex) ? showCopied() : showManual();
    }
  });
});
