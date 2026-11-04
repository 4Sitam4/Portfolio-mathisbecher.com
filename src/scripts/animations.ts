/**
 * Page choreography.
 *  - Every visit: boot sequence, then the page provisions itself
 *    ("terraform apply", see provision.ts), section by section on scroll,
 *    then ambient effects keep running (drift detection, hover inspector).
 *  - Boot skipped with Escape: everything at once, short hero entrance.
 *  - The live trace rows stream in.
 * Everything is readable without JS. With reduced motion or in reading mode
 * nothing moves, and the animation code (GSAP, provision engine) is not even
 * downloaded.
 */

import { initDecryptObserver, prefersReducedMotion } from './scramble';

const root = document.documentElement;

if (prefersReducedMotion()) {
  root.classList.remove('pv');
  initDecryptObserver();
} else {
  void startEffects();
}

async function startEffects(): Promise<void> {
  const buildMode = root.classList.contains('pv');
  const [{ default: gsap }, { Provisioner }, { startAmbient }] = await Promise.all([
    import('gsap'),
    import('./provision'),
    import('./provision-ambient'),
  ]);
  const provisioner = new Provisioner();

  // Take over from the pre-paint class: from here on, each resource carries
  // its own pending/done state.
  if (buildMode) provisioner.arm();
  root.classList.remove('pv');

  const heroEntrance = (): void => {
    const items = document.querySelectorAll<HTMLElement>('[data-hero]');
    if (items.length === 0) return;
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.048, clearProps: 'transform' }
    );
  };

  const startCalm = (): void => {
    heroEntrance();
    initDecryptObserver();
  };

  // Live trace rows appear one after another, like output streaming in.
  window.addEventListener('trace:ready', (e) => {
    const rows = (e as CustomEvent<HTMLElement[]>).detail;
    if (rows?.length) gsap.from(rows, { opacity: 0, x: -6, duration: 0.24, ease: 'power2.out', stagger: 0.04 });
  });

  // The side nav: built when it opens, destroyed (and awaited) when it closes.
  window.addEventListener('nav:opened', () => provisioner.applyNav());
  window.addEventListener('nav:closing', (e) => {
    const wait = (e as CustomEvent<{ wait: Promise<unknown>[] }>).detail?.wait;
    if (wait) wait.push(provisioner.destroyNav());
  });

  // `terraform apply` in the terminal.
  window.addEventListener('provision:replay', () => provisioner.replay());

  if (root.dataset.booted === 'true') {
    // No boot screen (effects just turned back on from reading mode, or a
    // page without one), or it already ended while this code was loading.
    if (buildMode) provisioner.start();
    else startCalm();
    startAmbient(provisioner);
    return;
  }

  // The boot overlay dispatches `boot:done`; a visitor who skipped it with
  // Escape wants the page now, not a show.
  window.addEventListener(
    'boot:done',
    (e) => {
      const skipped = (e as CustomEvent<{ skipped?: boolean }>).detail?.skipped === true;
      if (buildMode && !skipped) {
        provisioner.start();
      } else {
        provisioner.revealAll();
        startCalm();
      }
      startAmbient(provisioner);
    },
    { once: true }
  );
}
