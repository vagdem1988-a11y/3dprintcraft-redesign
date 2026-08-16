/* 3DPrintCraft — portfolio v2 behaviour
   - paired scroll reveal (left column enters from the left, right from the right)
   - category filters
   - multi-shot cards: cycle on hover (mouse) or on a timer while on screen (touch)
   - fullscreen swipe gallery with thumbnails
   Progressive enhancement: with JS off every card is visible and each card is a
   plain link straight to its full-size photo. Nothing here is required to browse. */

(() => {
  const root = document.documentElement;
  const grid = document.getElementById('pf-grid');
  if (!grid) return;

  // tells the stylesheet it is allowed to hide cards before they animate in
  root.classList.add('js-anim');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;

  const cards = [...grid.querySelectorAll('.pf-card')];
  const parseList = (el, name) => {
    try { return JSON.parse(el.dataset[name] || '[]'); } catch { return []; }
  };

  /* ── card model ─────────────────────────────────────────────────────── */

  const model = new Map();
  cards.forEach((card, index) => {
    model.set(card, {
      index,
      shots: parseList(card, 'shots'),      // grid-sized images
      full: parseList(card, 'full'),        // gallery-sized images
      title: card.dataset.title || '',
      alt: card.querySelector('img')?.alt || card.dataset.title || '',
      imgs: [card.querySelector('img')],    // extra <img> elements are built on demand
      dots: [...card.querySelectorAll('.pf-dots i')],
      active: 0,
      timer: 0,
    });
  });

  /* Extra shots are only fetched the first time a card actually needs them —
     28 cards x 5 shots eagerly would undo the whole point of the image work. */
  function ensureShot(card, i) {
    const m = model.get(card);
    if (m.imgs[i] || !m.shots[i]) return m.imgs[i];
    const img = document.createElement('img');
    img.className = 'pf-shot';
    img.src = m.shots[i];
    img.alt = '';                 // decorative: shot 0 already carries the description
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = 'low';
    card.querySelector('.pf-frame').append(img);
    m.imgs[i] = img;
    return img;
  }

  function showShot(card, i) {
    const m = model.get(card);
    if (!m.shots.length) return;
    const next = ((i % m.shots.length) + m.shots.length) % m.shots.length;
    ensureShot(card, next);
    m.imgs.forEach((img, n) => img && img.classList.toggle('is-active', n === next));
    m.dots.forEach((dot, n) => dot.classList.toggle('is-active', n === next));
    m.active = next;
  }

  function startCycle(card, interval) {
    const m = model.get(card);
    if (m.timer || m.shots.length < 2 || reduceMotion) return;
    m.timer = setInterval(() => showShot(card, m.active + 1), interval);
  }

  function stopCycle(card, reset) {
    const m = model.get(card);
    if (m.timer) { clearInterval(m.timer); m.timer = 0; }
    if (reset) showShot(card, 0);
  }

  /* ── scroll reveal + on-screen cycling ──────────────────────────────── */

  if (reduceMotion) {
    cards.forEach((c) => { c.classList.add('is-in'); c.dataset.seen = '1'; });
  } else {
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        entry.target.dataset.seen = '1';
        revealer.unobserve(entry.target);
      });
      // a low threshold matters: tall cards can be well inside the viewport
      // while still showing less than a tenth of their own height
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    cards.forEach((card) => revealer.observe(card));
  }

  /* The paged mobile layer drives its own cycling, so it switches this off
     rather than fighting the observer below. */
  let autoCycle = true;

  // On touch devices nothing hovers, so shots rotate by themselves — but only
  // for cards actually on screen, and staggered so they do not flash in unison.
  if (coarsePointer && !reduceMotion) {
    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target;
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (autoCycle && card.dataset.onscreen === '1') startCycle(card, 2600);
          }, (model.get(card).index % 4) * 500);
          card.dataset.onscreen = '1';
        } else {
          card.dataset.onscreen = '0';
          stopCycle(card, false);
        }
      });
    }, { threshold: 0.6 });

    cards.forEach((card) => { if (model.get(card).shots.length > 1) watcher.observe(card); });

    // stop burning battery on a backgrounded tab
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cards.forEach((c) => stopCycle(c, false));
      else if (autoCycle) cards.forEach((c) => { if (c.dataset.onscreen === '1') startCycle(c, 2600); });
    });
  }

  // Mouse users drive the cycle themselves by hovering.
  if (!coarsePointer) {
    cards.forEach((card) => {
      if (model.get(card).shots.length < 2) return;
      card.addEventListener('pointerenter', () => {
        showShot(card, 1);
        startCycle(card, 900);
      });
      card.addEventListener('pointerleave', () => stopCycle(card, true));
    });
  }

  /* ── filters ────────────────────────────────────────────────────────── */

  const chips = [...document.querySelectorAll('.pf-chip')];
  const countEl = document.getElementById('pf-count');
  const emptyEl = document.getElementById('pf-empty');
  const filterRow = document.querySelector('.pf-filters');
  if (filterRow) filterRow.hidden = false;

  function applyFilter(value) {
    let shown = 0;
    cards.forEach((card) => {
      const match = value === 'all' || card.dataset.cat === value;
      card.hidden = !match;
      if (match) {
        shown += 1;
        // a card brought back by a filter change must not stay invisible, even
        // if it was never scrolled past
        if (card.dataset.seen === '1') card.classList.add('is-in');
      } else {
        stopCycle(card, true);
      }
    });
    if (countEl) countEl.textContent = shown === 1 ? '1 έργο' : `${shown} έργα`;
    if (emptyEl) emptyEl.hidden = shown > 0;
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      applyFilter(chip.dataset.filter);
    });
  });

  applyFilter('all');

  /* ── fullscreen gallery ─────────────────────────────────────────────── */

  const modal = document.getElementById('pv-modal');
  if (!modal) return;

  const stage = modal.querySelector('.pv-stage');
  const stageImg = modal.querySelector('.pv-stage img');
  const titleEl = modal.querySelector('.pv-title');
  const counterEl = modal.querySelector('.pv-counter');
  const thumbsEl = modal.querySelector('.pv-thumbs');
  const zoomBtn = modal.querySelector('.pv-zoom');

  let gallery = { shots: [], thumbs: [], alt: '', at: 0 };

  function paint(i) {
    const total = gallery.shots.length;
    if (!total) return;
    gallery.at = ((i % total) + total) % total;
    resetZoom();                    // a new shot always starts fully visible
    stageImg.src = gallery.shots[gallery.at];
    stageImg.alt = total > 1 ? `${gallery.alt} — λήψη ${gallery.at + 1} από ${total}` : gallery.alt;
    counterEl.textContent = total > 1 ? `${gallery.at + 1} / ${total}` : '';
    [...thumbsEl.children].forEach((btn, n) =>
      btn.setAttribute('aria-current', String(n === gallery.at))
    );
    // keep the next image warm so swiping feels instant
    if (total > 1) new Image().src = gallery.shots[(gallery.at + 1) % total];
  }

  function openGallery(card) {
    const m = model.get(card);
    gallery = {
      shots: m.full.length ? m.full : m.shots,
      thumbs: m.shots,
      alt: m.alt,
      at: 0,
    };
    titleEl.textContent = m.title;

    thumbsEl.replaceChildren();
    if (gallery.shots.length > 1) {
      gallery.shots.forEach((_, n) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pv-thumb';
        btn.setAttribute('aria-label', `Λήψη ${n + 1}`);
        const img = document.createElement('img');
        img.src = gallery.thumbs[n] || gallery.shots[n];
        img.alt = '';
        img.loading = 'lazy';
        btn.append(img);
        btn.addEventListener('click', () => paint(n));
        thumbsEl.append(btn);
      });
    }

    paint(0);
    modal.showModal();
  }

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      event.preventDefault();       // without JS the same click just opens the photo
      stopCycle(card, false);
      openGallery(card);
    });
  });

  modal.querySelector('.pv-close').addEventListener('click', () => modal.close());
  modal.querySelector('.pv-prev').addEventListener('click', () => paint(gallery.at - 1));
  modal.querySelector('.pv-next').addEventListener('click', () => paint(gallery.at + 1));

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); paint(gallery.at - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); paint(gallery.at + 1); }
  });

  // click the dark surround to dismiss, but not the picture itself
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.close();
  });

  /* ── zoom, pan and swipe ────────────────────────────────────────────
     Not zoomed: a horizontal drag changes shot, a tap zooms in on the spot
     you touched. Zoomed: dragging pans the picture and the swipe is off, so
     you can inspect a corner without skipping to the next shot. */

  const ZOOM = 2.6;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let drag = null;

  const applyTransform = () => {
    stageImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    stage.classList.toggle('is-zoomed', zoom > 1);
    zoomBtn.setAttribute('aria-pressed', String(zoom > 1));
    zoomBtn.textContent = zoom > 1 ? '−' : '+';
  };

  // keep the picture from being dragged off into empty space
  const clampPan = () => {
    const box = stage.getBoundingClientRect();
    const maxX = (box.width * (zoom - 1)) / 2;
    const maxY = (box.height * (zoom - 1)) / 2;
    panX = Math.max(-maxX * 2, Math.min(0, panX));
    panY = Math.max(-maxY * 2, Math.min(0, panY));
  };

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  // zoom centred on a point, so you land on what you actually pointed at
  function zoomTo(level, clientX, clientY) {
    const box = stage.getBoundingClientRect();
    const px = clientX === undefined ? box.width / 2 : clientX - box.left;
    const py = clientY === undefined ? box.height / 2 : clientY - box.top;

    if (level <= 1) { resetZoom(); return; }

    zoom = level;
    panX = px - px * zoom;
    panY = py - py * zoom;
    clampPan();
    applyTransform();
  }

  zoomBtn.addEventListener('click', () => zoomTo(zoom > 1 ? 1 : ZOOM));

  stage.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY, panX, panY, moved: false, id: event.pointerId };
    if (zoom > 1) {
      stage.classList.add('is-panning');
      stage.setPointerCapture(event.pointerId);
    }
  });

  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
    if (zoom > 1) {
      panX = drag.panX + dx;
      panY = drag.panY + dy;
      clampPan();
      stageImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    }
  });

  stage.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const wasZoomed = zoom > 1;
    stage.classList.remove('is-panning');
    drag = null;

    if (wasZoomed) return;                       // panning, not navigating

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      paint(gallery.at + (dx < 0 ? 1 : -1));
    } else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
      zoomTo(ZOOM, event.clientX, event.clientY); // a tap on the picture
    }
  });

  stage.addEventListener('pointercancel', () => {
    drag = null;
    stage.classList.remove('is-panning');
  });

  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomTo(event.deltaY < 0 ? ZOOM : 1, event.clientX, event.clientY);
  }, { passive: false });

  /* Handle for the paged mobile layer (portfolio-mobile.js). It needs to drive
     the same cards and gallery rather than build a second copy of all this. */
  window.PF = {
    cards,
    shotCount: (card) => model.get(card).shots.length,
    showShot,
    startCycle,
    stopCycle,
    openGallery,
    setAutoCycle(on) {
      autoCycle = on;
      if (!on) cards.forEach((c) => stopCycle(c, true));
    },
  };
})();
