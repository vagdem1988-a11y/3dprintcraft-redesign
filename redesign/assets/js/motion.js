/* 3DPrintCraft — motion engine v3
   Word-split reveals · scroll-pinned storytelling · hero parallax ·
   magnetic buttons · card tilt · odometers · self-printing hero scrub ·
   dock scroll progress. All gated behind prefers-reduced-motion and
   pointer capability checks. */

document.addEventListener("DOMContentLoaded", () => {
  // ?motion=force overrides the OS reduced-motion setting. On preview hosts
  // (localhost) motion is ALWAYS on (owner request 2026-07-10) unless
  // ?motion=off — production still respects visitors' prefers-reduced-motion.
  const motionParam = new URLSearchParams(location.search).get("motion");
  const isPreviewHost = ["localhost", "127.0.0.1"].includes(location.hostname);
  const forceMotion = motionParam === "force" || (isPreviewHost && motionParam !== "off");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion;
  const finePointer = matchMedia("(pointer: fine)").matches;
  // CSS media queries can't see ?motion=force — mirror it as a root class so
  // the stylesheet's reduced-motion blocks (scoped to html:not(.motion-force))
  // are bypassed too.
  if (forceMotion) document.documentElement.classList.add("motion-force");
  // Hoisted early: referenced by both the dock-magnification block below and
  // the unified scroll pipeline further down (dock scroll-progress writes).
  const dock = document.querySelector(".dock");

  /* ---------- word-split headline reveals ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          // Split on whitespace EXCEPT U+00A0: an &nbsp; means "no break here",
          // so nbsp-joined words must stay inside one inline-block .sw span
          // (breaks between inline-block atoms ignore the nbsp otherwise).
          child.textContent.split(/([^\S\u00A0]+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement("span");
            w.className = "sw";
            const inner = document.createElement("span");
            inner.className = "swi";
            inner.textContent = part;
            inner.style.setProperty("--d", i++ * 80 + "ms");
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  }
  if (!reduceMotion) {
    const splitEls = document.querySelectorAll("[data-split]");
    splitEls.forEach((el) => {
      // Screen readers get the intact sentence, not a soup of word spans.
      el.setAttribute("aria-label", el.innerText);
      splitWords(el);
    });
    const splitIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("split-go");
          splitIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.3 });
    splitEls.forEach((el) => splitIO.observe(el));
  }

  /* ---------- scroll-pinned bigwords storytelling ----------
     Retained intentionally for future shop storytelling pages (no current consumer). */
  const sticky = document.querySelector(".bigwords-sticky");
  if (sticky && !reduceMotion) {
    document.documentElement.classList.add("scrollytell-on");
    const words = [...sticky.querySelectorAll(".word")];
    const onStory = () => {
      const r = sticky.getBoundingClientRect();
      const total = r.height - innerHeight;
      const prog = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      const idx = Math.floor(prog * (words.length + 0.6));
      words.forEach((w, i) => w.classList.toggle("active", i <= idx - 1 || prog > 0.92));
      if (prog > 0.05) words[0].classList.add("active");
    };
    addEventListener("scroll", onStory, { passive: true });
    onStory();
  } else if (sticky) {
    sticky.querySelectorAll(".word").forEach((w) => w.classList.add("active"));
  }

  /* ---------- hero pointer parallax (svg inside animated wrapper) ---------- */
  const hero = document.querySelector(".hero");
  if (hero && finePointer && !reduceMotion) {
    const layers = [...hero.querySelectorAll(".float-obj")].map((el, idx) => ({
      el: el.querySelector("svg"),
      depth: [18, 34, 50][idx] || 20,
    }));
    let raf = null;
    let px = 0, py = 0;
    hero.addEventListener("pointermove", (e) => {
      // Always store the latest coords; the rAF callback reads them so a
      // throttled frame renders the freshest position, not the first-in-frame.
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = px / innerWidth - 0.5;
        const y = py / innerHeight - 0.5;
        layers.forEach(({ el, depth }) => {
          if (el) el.style.transform = `translate3d(${-x * depth}px, ${-y * depth}px, 0)`;
        });
        raf = null;
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", (e) => {
      const btn = e.target.closest?.(".btn, .dock a, .dock button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      // Custom props compose with the stylesheet's :hover/:active transforms
      // instead of an inline transform clobbering them.
      btn.style.setProperty("--mx", x * 7 + "px");
      btn.style.setProperty("--my", (y * 7 - 2) + "px");
      btn.dataset.magnet = "1";
    });
    document.addEventListener("pointerout", (e) => {
      const btn = e.target.closest?.("[data-magnet]");
      if (btn && !btn.contains(e.relatedTarget)) {
        btn.style.removeProperty("--mx");
        btn.style.removeProperty("--my");
        delete btn.dataset.magnet;
      }
    });
  }

  /* ---------- dock magnification (cursor-distance scale, damped lerp) ----------
     macOS-dock pattern: pills scale up to 1.15 within a ±110px falloff of the
     cursor. Centers are cached on enter/resize (reading rects per frame would
     feed back through the scale). */
  const DOCK_MAGNIFY = false; /* DISABLED (owner request 2026-07-10) - set true to restore */
  if (DOCK_MAGNIFY && dock && finePointer && !reduceMotion) {
    const pills = [...dock.querySelectorAll("a, button, .dock-soon")];
    let centers = [];
    let dockRaf = null;
    let cursorX = null;
    const cacheCenters = () => {
      centers = pills.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    };
    const dockTick = () => {
      dockRaf = null;
      let active = false;
      pills.forEach((el, i) => {
        const target = cursorX === null
          ? 1
          : 1 + 0.15 * Math.max(0, 1 - Math.abs(cursorX - centers[i]) / 110);
        const cur = parseFloat(el.dataset.mag || 1);
        let next = cur + (target - cur) * 0.22;
        // within landing tolerance: snap to the target exactly so pills settle
        // at true rest values (1.0000) instead of a lingering lerp residual
        if (Math.abs(target - next) > 0.002) active = true;
        else next = target;
        el.dataset.mag = next.toFixed(4);
        el.style.setProperty("--mag", next.toFixed(4));
      });
      if (active) dockRaf = requestAnimationFrame(dockTick);
    };
    const wakeDock = () => { if (!dockRaf) dockRaf = requestAnimationFrame(dockTick); };
    dock.addEventListener("pointerenter", () => { cacheCenters(); });
    dock.addEventListener("pointermove", (e) => { cursorX = e.clientX; wakeDock(); }, { passive: true });
    dock.addEventListener("pointerleave", () => { cursorX = null; wakeDock(); });
    addEventListener("resize", () => { centers.length && cacheCenters(); }, { passive: true });
  }

  /* ---------- click spark (canvas overlay; react-bits ClickSpark port) ---------- */
  const CLICK_SPARKS = false; /* DISABLED (owner request 2026-07-10) - set true to restore */
  if (CLICK_SPARKS && !reduceMotion) {
    const sparkCanvas = document.createElement("canvas");
    sparkCanvas.className = "spark-canvas";
    sparkCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(sparkCanvas);
    const sparkCtx = sparkCanvas.getContext("2d");
    const sizeSparkCanvas = () => {
      // backing store at device resolution, drawing in CSS px via setTransform:
      // keeps 2px spark strokes crisp on high-DPR displays
      const dpr = devicePixelRatio || 1;
      sparkCanvas.width = innerWidth * dpr;
      sparkCanvas.height = innerHeight * dpr;
      sparkCanvas.style.width = innerWidth + "px";
      sparkCanvas.style.height = innerHeight + "px";
      sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeSparkCanvas();
    addEventListener("resize", sizeSparkCanvas, { passive: true });
    const sparks = [];
    let sparkRaf = null;
    const SPARK_MS = 400;
    const drawSparks = (t) => {
      /* CSS-px units: the DPR setTransform scales to the backing store */
      sparkCtx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const k = (t - s.t0) / SPARK_MS;
        if (k >= 1) { sparks.splice(i, 1); continue; }
        const e = k * (2 - k);
        const d0 = e * 20;
        const d1 = d0 + (1 - e) * 12;
        sparkCtx.strokeStyle = s.color;
        sparkCtx.lineWidth = 2;
        sparkCtx.globalAlpha = 1 - e;
        sparkCtx.beginPath();
        sparkCtx.moveTo(s.x + Math.cos(s.a) * d0, s.y + Math.sin(s.a) * d0);
        sparkCtx.lineTo(s.x + Math.cos(s.a) * d1, s.y + Math.sin(s.a) * d1);
        sparkCtx.stroke();
      }
      sparkCtx.globalAlpha = 1;
      sparkRaf = sparks.length ? requestAnimationFrame(drawSparks) : null;
    };
    document.addEventListener("click", (e) => {
      if (!e.target.closest?.(".btn, .dock a, .filter-btn, .pal-swatch, .contact-card")) return;
      const t0 = performance.now();
      for (let i = 0; i < 8; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / 8, t0, color: "#9db8ff" /* --ice */ });
      }
      if (!sparkRaf) sparkRaf = requestAnimationFrame(drawSparks);
    });
  }

  /* ---------- product-card tilt + spotlight (delegated — survives re-renders) ----------
     One handler drives both: --sx/--sy (spotlight highlight, CSS-only opacity via
     ::after) update for every match, but the 3D tilt inline-transform is applied
     only to product-card/work-card — service-card gets the spotlight glow without
     the tilt rock (its card content isn't a clickable-image thumbnail). */
  if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest?.(".product-card, .work-card, .service-card");
      if (!card) return;
      if (card.closest("[data-unfolding]")) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--sx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--sy", (py * 100).toFixed(1) + "%");
      if (!card.matches(".service-card")) {
        const x = px - 0.5, y = py - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-8px)`;
      }
    });
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest?.(".product-card, .work-card, .service-card");
      if (card && !card.contains(e.relatedTarget) && !card.matches(".service-card")) card.style.transform = "";
    });
  }

  /* ---------- decrypted-text kickers (react-bits DecryptedText port,
     useOriginalCharsOnly mode) ---------- */
  const DECRYPT_KICKERS = false; /* TEMPORARILY DISABLED (owner request 2026-07-10) - set true to restore */
  const kickers = document.querySelectorAll(".kicker");
  if (DECRYPT_KICKERS && kickers.length && !reduceMotion && "IntersectionObserver" in window) {
    const TICK_MS = 35;
    const REVEAL_TICKS = 14; /* full reveal in ~half a second */
    const decrypt = (el) => {
      const orig = el.textContent;
      if (!orig.trim()) return;
      // Scramble frames are exact PERMUTATIONS of the label's own glyphs
      // (react-bits useOriginalCharsOnly): a fixed uppercase-Greek/digit
      // charset rendered measurably wider per-glyph than the mixed-case
      // originals (grew ~9px under a min-width floor, clipped up to 17px
      // under a hard width lock), and even random draws WITH replacement
      // from the label's own glyph set wobbled 11px (narrow ι/τ slots drawn
      // as wide Ο/ω/—). Shuffling the not-yet-revealed glyphs in place keeps
      // every frame's total advance width identical up to kerning (measured
      // ≤2px), so min-width + nowrap suffice and nothing clips.
      // Screen readers: hide the scrambling element entirely and mirror the
      // real text in an adjacent visually-hidden span (aria-label on a generic
      // span is not reliably exposed by all AT). Both are removed at settle.
      const srMirror = document.createElement("span");
      srMirror.className = "sr-only";
      srMirror.textContent = orig;
      el.insertAdjacentElement("afterend", srMirror);
      el.setAttribute("aria-hidden", "true");
      el.style.minWidth = el.offsetWidth + "px";
      el.style.whiteSpace = "nowrap";
      el.style.display = "inline-block"; /* minWidth needs a box; .kicker already inline-block — keep harmless */
      let tick = 0;
      const timer = setInterval(() => {
        tick++;
        const revealed = Math.ceil((tick / REVEAL_TICKS) * orig.length);
        if (revealed >= orig.length) {
          clearInterval(timer);
          el.textContent = orig;
          el.style.minWidth = "";
          el.style.whiteSpace = "";
          el.removeAttribute("aria-hidden");
          srMirror.remove();
          return;
        }
        const chars = [...orig];
        // Fisher-Yates shuffle of the not-yet-revealed, non-space glyphs;
        // spaces stay anchored so word rhythm (and wrap points) hold.
        const rest = chars.filter((ch, i) => i >= revealed && ch !== " ");
        for (let i = rest.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        let k = 0;
        el.textContent = chars
          .map((ch, i) => (ch === " " || i < revealed ? ch : rest[k++]))
          .join("");
      }, TICK_MS);
    };
    const kickerIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        kickerIO.unobserve(en.target);
        decrypt(en.target);
      });
    }, { threshold: 0.6 });
    kickers.forEach((el) => kickerIO.observe(el));
  }

  /* ---------- reveal-on-scroll (IntersectionObserver is the only path;
     scroll-timeline CSS was removed — it owned transform and killed tilt).
     Elements are visible by default; the pre-reveal hidden state only exists
     once .reveals-on is on <html>, so no-JS and reduced-motion visitors
     always see content and no fallback branch is needed. ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveals-on");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("revealed");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".fade-rise, .scale-in").forEach((el) => io.observe(el));
  }

  /* ---------- odometer counters ---------- */
  const nums = document.querySelectorAll("[data-count]");
  if (nums.length && "IntersectionObserver" in window && !reduceMotion) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io2.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const dur = 1600;
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          const val = target % 1 === 0
            ? Math.round(target * eased).toLocaleString("el-GR")
            : (target * eased).toLocaleString("el-GR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          el.textContent = val + suffix;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    nums.forEach((el) => io2.observe(el));
  } else {
    nums.forEach((el) => {
      el.textContent = parseFloat(el.dataset.count).toLocaleString("el-GR") + (el.dataset.suffix || "");
    });
  }

  /* ---------- self-printing hero (scroll-scrubbed layer build) ----------
     The CSS default is the FINISHED print (--build: 1, no pin), so no-JS and
     reduced-motion visitors see the complete object. Only when motion is
     allowed do we opt <html> into scrub mode and drive --build from scroll. */
  const stage = document.querySelector(".print-stage");
  const printPin = document.querySelector(".hero-sticky");
  const TOTAL_LAYERS = 300;
  const hudEl = stage?.querySelector(".hud-layer");
  const scrubbing = !!(stage && printPin && !reduceMotion);
  if (scrubbing) document.documentElement.classList.add("print-scrub-on");
  const curtainEl = document.querySelector(".curtain");

  /* ---------- unified scroll pipeline: all reads, then all writes, one rAF ----------
     Batches the scroll cue, dock progress, and hero scrub so layout reads never
     interleave with style writes (no forced reflow per listener). The dock
     progress and scroll cue are 1:1 scroll feedback — deliberately exempt from
     the reduced-motion gate (documented exemption). */
  const cue = document.querySelector(".scroll-cue");
  let scrollDirty = false;
  let lastLayer = -1;
  const onScrollFrame = () => {
    scrollDirty = false;
    /* reads */
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const pinRect = scrubbing ? printPin.getBoundingClientRect() : null;
    const curtainRect = curtainEl && scrubbing ? curtainEl.getBoundingClientRect() : null;
    /* writes */
    if (cue) cue.classList.toggle("gone", y > 40);
    if (dock) dock.style.setProperty("--scroll-p", max > 0 ? (y / max).toFixed(4) : 0);
    if (pinRect) {
      const total = pinRect.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -pinRect.top / total)) : 1;
      stage.style.setProperty("--build", p.toFixed(4));
      const layer = Math.round(p * TOTAL_LAYERS);
      if (hudEl && layer !== lastLayer) {
        lastLayer = layer;
        hudEl.textContent = `LAYER ${String(layer).padStart(3, "0")}/${TOTAL_LAYERS}`;
      }
    }
    if (curtainRect) {
      /* 0.55 ramp: p goes 0→1 as the section top travels from the bottom edge
         up to 45% of the viewport, so the reveal completes while the content
         centers on screen. rect.top includes the current translateY lift, so
         the ramp is mildly self-accelerating — intentional. */
      const p = Math.min(1, Math.max(0, (innerHeight - curtainRect.top) / (innerHeight * 0.55)));
      curtainEl.style.setProperty("--curtain", p.toFixed(4));
    }
  };
  const requestScrollFrame = () => {
    if (!scrollDirty) { scrollDirty = true; requestAnimationFrame(onScrollFrame); }
  };
  addEventListener("scroll", requestScrollFrame, { passive: true });
  addEventListener("resize", requestScrollFrame, { passive: true });
  onScrollFrame();
});
