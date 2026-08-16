/* 3DPrintCraft — paged mobile portfolio + origami intro.

   Below 720px the portfolio becomes pages of four projects, one screenful
   each, advanced by a single swipe — deliberately not a continuous scroll.
   Page 1 runs a tour: each card grows in turn while the others dim, cycling
   that project's shots. Later pages skip the growing and only cycle shots.
   Any tap ends the tour and opens what was tapped.

   Drives the cards through window.PF, the handle exposed by portfolio-v2.js,
   so there is exactly one implementation of shots and the gallery. */

(() => {
  const PER_PAGE = 4;
  const SHOT_MS = 1200;          // brisk: a 5-shot project takes 6s
  const GAP_MS = 260;            // beat between projects
  const BROWSE_MS = 2200;        // later pages: plain shot cycling

  const mobile = matchMedia('(max-width: 720px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    const PF = window.PF;
    const grid = document.getElementById('pf-grid');
    if (!PF || !grid) return;

    const root = document.documentElement;
    let page = 0;
    let tour = null;              // active tour timers
    let visible = [];             // cards on the current page

    root.classList.add('pf-paged');
    PF.setAutoCycle(false);       // this file owns cycling from here

    /* ── pager ──────────────────────────────────────────────────────── */

    const pager = document.createElement('p');
    pager.className = 'pf-pager';
    grid.after(pager);

    /* Everything after the grid — the closing call to action — belongs to the
       last page only, so it does not reappear under every batch of four. */
    const tail = grid.parentElement.querySelector('.pf-empty ~ .lead, .pf-pager ~ .lead');
    if (tail) tail.classList.add('pf-tail');

    const liveCards = () => PF.cards.filter((c) => !c.hidden);
    const pageCount = () => Math.max(1, Math.ceil(liveCards().length / PER_PAGE));

    function drawPager() {
      const total = pageCount();
      const label = document.createElement('span');
      label.textContent = `${page + 1} / ${total}`;
      const parts = [label];

      if (page < total - 1) {
        const hint = document.createElement('span');
        hint.className = 'pf-pager-hint';
        hint.textContent = 'Σύρετε για τα επόμενα';
        parts.push(hint);
      }
      pager.replaceChildren(...parts);
    }

    /* ── paging ─────────────────────────────────────────────────────── */

    const SLIDE_MS = 260;
    let swapping = false;

    function showPage(next, { tourIt = true, animate = true, force = false } = {}) {
      if (swapping) return;
      stopTour();

      const all = liveCards();
      const total = Math.max(1, Math.ceil(all.length / PER_PAGE));
      const target = Math.max(0, Math.min(next, total - 1));

      /* `force` matters when a filter changes: the page number is still 0 but
         the set of cards behind it is completely different, and without this
         the early return leaves the old slots on screen — which showed zero
         cards for any category not already on page 1. */
      if (!force && animate && target === page && visible.length) return;

      const forward = target > page;
      const move = animate && !reduceMotion;

      const commit = () => {
        page = target;
        const from = page * PER_PAGE;
        visible = all.slice(from, from + PER_PAGE);

        PF.cards.forEach((card) => {
          card.dataset.pageHidden = visible.includes(card) ? '0' : '1';
          PF.stopCycle(card, true);
        });
        visible.forEach((card) => card.classList.add('is-in'));

        drawPager();
        root.classList.toggle('pf-last', page === total - 1);

        if (move) {
          // put the arriving batch in its starting pose, then release it
          grid.classList.remove('slide-out-up', 'slide-out-down');
          grid.classList.add(forward ? 'slide-from-below' : 'slide-from-above');
          void grid.offsetWidth;                       // commit that pose
          grid.classList.remove('slide-from-below', 'slide-from-above');
        }

        /* Free the gesture as soon as the new batch is on screen. Holding the
           lock for another full slide made a quick second swipe get dropped. */
        swapping = false;

        setTimeout(() => {
          if (tourIt) {
            if (page === 0) runTour();
            else browsePage();
          }
        }, move ? SLIDE_MS : 40);
      };

      if (!move) { commit(); return; }

      swapping = true;
      grid.classList.add(forward ? 'slide-out-up' : 'slide-out-down');
      setTimeout(commit, SLIDE_MS);
    }

    /* ── page 1: the tour ───────────────────────────────────────────── */

    // grow toward the middle of the screen, not off the card's own edge
    function growVector(card) {
      const i = visible.indexOf(card);
      card.style.setProperty('--grow-x', i % 2 === 0 ? '7%' : '-7%');
      card.style.setProperty('--grow-y', i < 2 ? '9%' : '-9%');
    }

    function stopTour() {
      if (tour) { tour.forEach(clearTimeout); tour = null; }
      grid.classList.remove('is-touring');
      PF.cards.forEach((c) => {
        c.classList.remove('is-active');
        PF.stopCycle(c, true);
      });
    }

    function runTour() {
      if (reduceMotion) { browsePage(); return; }
      tour = [];
      grid.classList.add('is-touring');

      let at = 0;
      visible.forEach((card) => {
        const shots = Math.max(1, PF.shotCount(card));
        const hold = shots * SHOT_MS;

        tour.push(setTimeout(() => {
          visible.forEach((c) => c.classList.remove('is-active'));
          growVector(card);
          card.classList.add('is-active');
          PF.showShot(card, 0);
          if (shots > 1) PF.startCycle(card, SHOT_MS);
        }, at));

        tour.push(setTimeout(() => {
          PF.stopCycle(card, true);
          card.classList.remove('is-active');
        }, at + hold));

        at += hold + GAP_MS;
      });

      // tour over — settle back to a plain page
      tour.push(setTimeout(() => {
        grid.classList.remove('is-touring');
        browsePage();
      }, at));
    }

    /* ── later pages: shots cycle, nothing grows ────────────────────── */

    function browsePage() {
      if (reduceMotion) return;
      visible.forEach((card, i) => {
        if (PF.shotCount(card) < 2) return;
        setTimeout(() => PF.startCycle(card, BROWSE_MS), i * 400);
      });
    }

    /* ── a tap anywhere ends the tour ───────────────────────────────── */

    grid.addEventListener('pointerdown', () => { if (tour) stopTour(); }, true);

    /* ── swipe to page ──────────────────────────────────────────────── */

    const MIN_SWIPE = 45;
    let swipe = null;

    function swipeStart(x, y) { swipe = { x, y }; }

    function swipeEnd(x, y) {
      if (!swipe) return;
      const dx = x - swipe.x;
      const dy = y - swipe.y;
      swipe = null;
      if (Math.abs(dy) < MIN_SWIPE || Math.abs(dy) < Math.abs(dx)) return;
      showPage(page + (dy < 0 ? 1 : -1));   // swipe up = forward
    }

    /* Touch events, not pointer events, for the touchscreen. A touch drag can
       be cancelled out from under a pointer stream by the browser's own
       gesture handling; touchend always arrives. */
    grid.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      swipeStart(t.clientX, t.clientY);
    }, { passive: true });

    grid.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      swipeEnd(t.clientX, t.clientY);
    }, { passive: true });

    // mouse only — touch is handled above, so do not double-count it
    grid.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      swipeStart(e.clientX, e.clientY);
    });

    grid.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      swipeEnd(e.clientX, e.clientY);
    });

    grid.addEventListener('pointercancel', () => { swipe = null; });

    // trackpad / mouse wheel pages too, one notch at a time
    let wheelLock = false;
    grid.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) < 12 || wheelLock) return;
      e.preventDefault();
      wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 600);
      showPage(page + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    /* Filters repaginate from scratch: the visible set just changed under us,
       so the current page number means nothing. */
    document.querySelectorAll('.pf-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        setTimeout(() => showPage(0, { animate: false, force: true }), 30);
      });
    });

    /* Rows get whatever height is left below the filters. */
    function sizeGrid() {
      const top = grid.getBoundingClientRect().top;
      grid.style.setProperty('--pf-page-h', `${Math.max(320, innerHeight - top - 84)}px`);
    }
    sizeGrid();
    addEventListener('resize', sizeGrid);

    showPage(0, { animate: false });   // first paint: no slide, then the tour
    window.PFM = { showPage, stopTour, sizeGrid, pageCount };
  }

  /* ── origami intro ────────────────────────────────────────────────── */

  function playIntro(onDone) {
    const intro = document.getElementById('pf-intro');
    if (!intro) { onDone(); return; }

    const video = intro.querySelector('video');
    const net = navigator.connection || {};
    const stingy = net.saveData === true || /^(slow-)?2g$/.test(net.effectiveType || '');

    // ?intro=1 forces it to play again, ?intro=0 skips it — for testing on a
    // real phone without having to clear the session by hand
    const force = new URLSearchParams(location.search).get('intro');

    /* Plays on every page load. Skipped for: desktop, metered or slow
       connections, and reduced-motion (a full-screen unfold is exactly the
       kind of movement that setting exists to prevent). */
    const skip = force === '0'
      || (force !== '1' && (!mobile.matches || stingy || reduceMotion))
      || !video || !video.dataset.src;

    if (skip) {
      onDone();
      return;
    }

    const MIN_ON_SCREEN = 1200;   // never let the overlay merely blink
    let shownAt = 0;              // set the moment it actually goes on screen
    let finished = false;

    /* ?intro=1 also records a timeline into sessionStorage under
       'pf-intro-log'. Reading it afterwards beats trying to observe a 4-second
       animation live, on a phone, from somewhere else. */
    const t0 = Date.now();
    const trace = force === '1' ? [] : null;
    function mark(what) {
      if (!trace) return;
      trace.push(`${String(Date.now() - t0).padStart(5)}ms  ${what}`);
      try { sessionStorage.setItem('pf-intro-log', trace.join('\n')); } catch (e) { /* full */ }
    }
    mark('start');

    function finish(instant) {
      if (finished) return;

      /* Some media stacks report `ended` the instant a src is attached — the
         overlay would flash and vanish before anyone saw a frame. Anything
         that is not an explicit skip has to respect a minimum on-screen time. */
      const early = shownAt ? Date.now() - shownAt : MIN_ON_SCREEN;
      if (!instant && early < MIN_ON_SCREEN) {
        setTimeout(() => finish(), MIN_ON_SCREEN - early);
        return;
      }

      finished = true;
      mark('finish(instant=' + !!instant + ') at t=' + video.currentTime.toFixed(2));
      if (instant) {
        // never played — take it away with no fade, so there is no black flash
        intro.classList.remove('is-live');
      } else {
        intro.classList.add('is-leaving');
        setTimeout(() => intro.classList.remove('is-live'), 950);
      }
      onDone();
    }

    /* A media element can carry state over from a previous navigation and
       arrive already "ended". Wipe it before attaching anything. */
    video.pause();
    video.removeAttribute('src');
    video.load();

    let reallyPlayed = false;
    video.addEventListener('playing', () => { reallyPlayed = true; mark('playing'); });
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > 0.1) reallyPlayed = true;
    });

    intro.querySelector('.pf-intro-skip').addEventListener('click', () => finish());

    // only an `ended` that follows actual playback is real
    video.addEventListener('ended', () => { mark('ended (reallyPlayed=' + reallyPlayed + ')'); if (reallyPlayed) finish(); });
    video.addEventListener('error', () => { mark('error'); finish(true); }, { once: true });

    // never let a stalled video hold the page hostage
    setTimeout(() => finish(), 7000);

    // iOS only honours muted autoplay when muted is set as a property, not
    // just as an attribute, and playsinline must be there before play()
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    /* Reveal exactly the way the homepage hero video does: the element stays
       out of the layout until `canplay` says there is really something to
       show, then a class puts it on screen. */
    video.addEventListener('canplay', () => {
      if (finished) return;
      intro.classList.add('is-live');
      mark('canplay -> is-live (visible)');
      shownAt = Date.now();
    }, { once: true });

    video.src = video.dataset.src;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch((e) => { mark('play() rejected: ' + e.name); finish(true); });
    if (attempt && typeof attempt.then === 'function') attempt.then(() => mark('play() ok'));

    /* Autoplay can be "allowed" and still not run — iOS Low Power Mode, some
       battery savers. If the clock has not moved by now, nothing is going to
       happen, so bail out rather than sit on a frozen frame. */
    setTimeout(() => {
      if (!finished && video.currentTime < 0.05) finish(true);
    }, 900);
  }

  /* ── boot ─────────────────────────────────────────────────────────── */

  function boot() {
    if (!mobile.matches) return;
    playIntro(start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
