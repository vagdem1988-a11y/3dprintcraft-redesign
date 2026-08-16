/* Pauses the DM button's traveling light when nobody can see it.

   The animation drives a registered custom property, which means it repaints
   the button's two gradient layers every frame — cheap, but not free, and
   pointless once the hero has scrolled away or the tab is in the background.
   Adds .hero-paused to <html>; the stylesheet does the rest. */

(() => {
  const hero = document.querySelector('.hero-actions');
  if (!hero) return;

  const root = document.documentElement;
  const pause = (on) => root.classList.toggle('hero-paused', on);

  let offScreen = false;

  const watcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      offScreen = !entry.isIntersecting;
      pause(offScreen || document.hidden);
    });
  }, { threshold: 0 });

  watcher.observe(hero);

  document.addEventListener('visibilitychange', () => {
    pause(offScreen || document.hidden);
  });
})();
