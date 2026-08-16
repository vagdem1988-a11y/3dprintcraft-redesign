/* Hero masthead video loader.

   The video is never in the HTML as a live source — this decides whether it is
   worth loading at all, then attaches it. Visitors who say no to motion, or who
   are on a metered or slow connection, keep the lightweight fallback and never
   pay for 313 KB they did not ask for. */

(() => {
  const holder = document.querySelector('.o-video');
  const hero = document.querySelector('.hero');
  if (!holder || !hero) return;

  const video = holder.querySelector('video');
  if (!video) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const net = navigator.connection || {};
  const stingy = net.saveData === true || /^(slow-)?2g$/.test(net.effectiveType || '');

  // Metered or crawling connection: leave the SVG/benchy fallback in place.
  if (stingy) return;

  // Reduced motion: show the still frame instead of the animation, but still
  // let it replace the fallback so the hero looks the same, just static.
  if (reduceMotion) {
    hero.classList.add('has-video');
    const still = document.createElement('img');
    still.src = video.getAttribute('poster');
    still.alt = '';
    still.width = 540;
    still.height = 960;
    holder.append(still);
    video.remove();
    return;
  }

  const src = video.dataset.src;
  if (!src) return;

  video.addEventListener('canplay', () => {
    hero.classList.add('has-video');
  }, { once: true });

  // If it cannot play for any reason, the fallback simply stays.
  video.addEventListener('error', () => {
    hero.classList.remove('has-video');
    holder.remove();
  }, { once: true });

  video.src = src;
  video.load();

  const tryPlay = () => {
    const attempt = video.play();
    // Autoplay can still be refused (some power-saving modes); the poster then
    // remains on screen, which is a perfectly good outcome.
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
  };

  tryPlay();

  /* Plays once and holds on the lit medallion — a video element keeps its last
     frame on screen after `ended`, so this needs no poster swap. `done` stops
     the observer below from restarting it when the hero scrolls back. */
  let done = false;
  video.addEventListener('ended', () => { done = true; }, { once: true });

  // Do not decode frames nobody is looking at.
  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (done) return;                      // finished: leave the last frame up
      if (entry.isIntersecting) tryPlay();
      else video.pause();
    });
  }, { threshold: 0.1 });

  watcher.observe(holder);

  document.addEventListener('visibilitychange', () => {
    if (done) return;
    if (document.hidden) video.pause();
    else if (holder.getBoundingClientRect().bottom > 0) tryPlay();
  });
})();
