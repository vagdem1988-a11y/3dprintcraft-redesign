/* Portfolio — category filters + <dialog> lightbox. Progressive enhancement:
   without JS all cards are visible; filters and lightbox simply do nothing. */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("work-grid");
  const empty = document.getElementById("work-empty");
  const buttons = document.querySelectorAll(".filter-btn");

  /* filter row ships hidden in the HTML so no-JS visitors see all cards
     and no dead buttons; reveal it now that the filters are wired up */
  const filterRow = document.querySelector(".filter-row");
  if (filterRow) filterRow.removeAttribute("hidden");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const f = btn.dataset.filter;
      let shown = 0;
      grid.querySelectorAll(".work-card").forEach((card) => {
        const show = f === "all" || card.dataset.cat === f;
        card.classList.toggle("is-hidden", !show);
        if (show) shown++;
      });
      empty.hidden = shown > 0;
    });
  });

  const box = document.getElementById("lightbox");
  const boxImg = document.getElementById("lightbox-img");
  const boxCap = document.getElementById("lightbox-cap");
  if (!box || typeof box.showModal !== "function") return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".work-card");
    if (!card) return;
    const thumb = card.querySelector("img");
    boxImg.width = Number(thumb.getAttribute("width"));
    boxImg.height = Number(thumb.getAttribute("height"));
    boxImg.src = card.dataset.full;
    boxImg.alt = thumb.alt;
    boxCap.textContent = [...card.querySelector(".work-cap").childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join("")
      .trim();
    box.showModal();
  });
  document.getElementById("lightbox-close").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });

  /* ---------- sticky-grid entrance unfold ----------
     Cards scatter off-position/faded at the top of the stage, then converge
     to their grid resting position as the pinned section scrolls through.
     Own rAF-batched scroll listener (reads-then-writes, self-removes on
     completion) — separate from motion.js's pipeline since it's scoped to
     this page's grid only. */
  const stage = document.querySelector(".unfold-stage");
  /* Gate re-derivation is intentional: motion.js computes the same
     forceMotion/reduceMotion flags but exports nothing (both files are
     plain closures — no modules, no shared globals), so this closure
     derives its own copies. */
  const forceMotion = new URLSearchParams(location.search).get("motion") === "force";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion;
  const wideQuery = matchMedia("(min-width: 761px)");
  if (stage && grid && !reduceMotion && wideQuery.matches) {
    document.documentElement.classList.add("unfold-on");
    const pinEl = stage.querySelector(".unfold-pin");
    const cards = [...grid.querySelectorAll(".work-card")];
    grid.setAttribute("data-unfolding", "");
    /* per-card scatter offsets: alternate directions by index */
    const offsets = cards.map((c, i) => ({
      x: (i % 2 ? 1 : -1) * (60 + (i % 4) * 30),
      y: 80 + (i % 3) * 40,
    }));
    let done = false;
    const applyUnfold = (p) => {
      cards.forEach((c, i) => {
        /* card 0's progress is floored at 0.35 so the page never paints with
           zero visible photos — at rest (p=0) it sits at ~0.73 opacity */
        const cp = Math.min(1, Math.max(i === 0 ? 0.35 : 0, p * (cards.length * 0.55) - i * 0.45));
        const e = 1 - Math.pow(1 - cp, 3);
        c.style.setProperty("--ux", ((1 - e) * offsets[i].x).toFixed(1) + "px");
        c.style.setProperty("--uy", ((1 - e) * offsets[i].y).toFixed(1) + "px");
        c.style.setProperty("--us", (0.9 + e * 0.1).toFixed(3));
        c.style.setProperty("--uo", e.toFixed(3));
      });
    };
    const finishUnfold = () => {
      if (done) return;
      done = true;
      /* Collapsing the 230vh stage removes (pin.top - stage.top) worth of
         height above the viewport, so the browser's scroll clamp would dump
         the reader past the grid. Capture the pin's travel BEFORE the class
         removal reflows, then restore with an ABSOLUTE scrollTo — scrollBy
         would double-count the clamp the browser applies when the document
         shrinks. Listener removal precedes the scrollTo so the restored
         scroll can't queue a stale unfoldFrame. */
      const offset = pinEl
        ? pinEl.getBoundingClientRect().top - stage.getBoundingClientRect().top
        : 0;
      const targetY = scrollY - offset;
      applyUnfold(1);
      grid.removeAttribute("data-unfolding");
      document.documentElement.classList.remove("unfold-on");
      cards.forEach((c) => {
        ["--ux", "--uy", "--us", "--uo"].forEach((v) => c.style.removeProperty(v));
      });
      removeEventListener("scroll", onUnfoldScroll);
      if (offset > 0) scrollTo(0, targetY);
    };
    let unfoldDirty = false;
    const unfoldFrame = () => {
      unfoldDirty = false;
      const r = stage.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      if (p >= 1) { finishUnfold(); return; }
      applyUnfold(p);
    };
    const onUnfoldScroll = () => {
      if (!unfoldDirty) { unfoldDirty = true; requestAnimationFrame(unfoldFrame); }
    };
    addEventListener("scroll", onUnfoldScroll, { passive: true });
    unfoldFrame();
    /* restored-scroll page load (back/forward, reload) can land almost
       assembled — finish immediately rather than holding a stale pin for
       the last few percent */
    const r0 = stage.getBoundingClientRect();
    const total0 = r0.height - innerHeight;
    /* completion threshold derived from the stagger formula: the last card
       (i = N-1) reaches cp=1 at p = (1 + 0.45*(N-1)) / (0.55*N) — evaluates
       to the old hardcoded 0.943 at N=8 and stays correct as the grid grows */
    const doneAt = (1 + 0.45 * (cards.length - 1)) / (0.55 * cards.length);
    if (total0 > 0 && -r0.top / total0 >= doneAt) finishUnfold();
    /* viewport shrinking below the gate mid-unfold (tablet rotation)
       force-completes — the CSS gate assumes desktop widths */
    wideQuery.addEventListener("change", (e) => { if (!e.matches) finishUnfold(); });
    /* any filter interaction force-completes the entrance */
    buttons.forEach((b) => b.addEventListener("click", finishUnfold, { once: true }));
    /* a11y: at rest (pre-scroll) the later cards sit near --uo:0 (invisible)
       but are still real <button> elements in tab order — a keyboard user
       tabbing into the grid before scrolling would land on an invisible
       focusable card. Force-complete on focus landing inside the grid —
       but ONLY for non-pointer focus: a mouse click's focusin fires between
       mousedown and mouseup, and collapsing the stage there can hit-test
       the pending mouseup against a different element, silently dropping
       the click (and the lightbox open). finishUnfold is idempotent (done
       flag), so the persistent listener is safe; no {once} — a pointer-focus
       first event must not consume the rescue. */
    let gridPointerDown = false;
    grid.addEventListener("pointerdown", () => { gridPointerDown = true; }, true);
    grid.addEventListener("pointerup", () => { gridPointerDown = false; }, true);
    grid.addEventListener("pointercancel", () => { gridPointerDown = false; }, true);
    grid.addEventListener("focusin", () => { if (!gridPointerDown) finishUnfold(); });
  }
});
