/* Marks whichever service card sits nearest the middle of the screen with
   .is-live, so its icon animates and the others stay still.

   Scroll-driven rather than hover-driven because most visitors arrive on a
   phone, where nothing hovers. On a desktop, hovering a card takes over. */

(() => {
  const cards = [...document.querySelectorAll('.service-card')];
  if (cards.length < 2) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const fine = matchMedia('(pointer: fine)').matches;
  let hovered = null;
  let queued = false;

  function pick() {
    queued = false;
    if (hovered) {
      cards.forEach((c) => c.classList.toggle('is-live', c === hovered));
      return;
    }

    const middle = innerHeight / 2;
    let best = null;
    let bestGap = Infinity;

    cards.forEach((card) => {
      const box = card.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;   // off screen
      const gap = Math.abs(box.top + box.height / 2 - middle);
      if (gap < bestGap) { bestGap = gap; best = card; }
    });

    cards.forEach((c) => c.classList.toggle('is-live', c === best));
  }

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pick);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);

  if (fine) {
    cards.forEach((card) => {
      card.addEventListener('pointerenter', () => { hovered = card; pick(); });
      card.addEventListener('pointerleave', () => { hovered = null; pick(); });
    });
  }

  // nothing should animate while the tab is in the background
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cards.forEach((c) => c.classList.remove('is-live'));
    else schedule();
  });

  pick();
})();
