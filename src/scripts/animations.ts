/**
 * Page choreography.
 *  - Every visit: boot sequence, then the page provisions itself
 *    ("terraform apply", see provision.ts), section by section on scroll,
 *    then ambient effects keep running (drift detection, hover inspector).
 *  - Boot skipped with Escape: everything at once, short hero entrance.
 *  - The live trace rows stream in.
 * Everything is readable without JS; with reduced motion nothing moves.
 */

import gsap from 'gsap';
import { initDecryptObserver, prefersReducedMotion } from './scramble';
import { Provisioner } from './provision';
import { startAmbient } from './provision-ambient';

const root = document.documentElement;
const reduced = prefersReducedMotion();
const buildMode = root.classList.contains('pv');
const provisioner = reduced ? null : new Provisioner();

// Take over from the pre-paint class: from here on, each resource carries
// its own pending/done state.
if (provisioner && buildMode) provisioner.arm();
root.classList.remove('pv');

function heroEntrance(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-hero]');
  if (reduced || items.length === 0) return;
  gsap.fromTo(
    items,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power3.out',
      stagger: 0.048,
      clearProps: 'transform',
    }
  );
}

function startCalm(): void {
  heroEntrance();
  initDecryptObserver();
}

// Live trace rows appear one after another, like output streaming in.
window.addEventListener('trace:ready', (e) => {
  const rows = (e as CustomEvent<HTMLElement[]>).detail;
  if (reduced || !rows?.length) return;
  gsap.from(rows, { opacity: 0, x: -6, duration: 0.24, ease: 'power2.out', stagger: 0.04 });
});

// The side nav: built when it opens, destroyed (and awaited) when it closes.
window.addEventListener('nav:opened', () => provisioner?.applyNav());
window.addEventListener('nav:closing', (e) => {
  const wait = (e as CustomEvent<{ wait: Promise<unknown>[] }>).detail?.wait;
  if (provisioner && wait) wait.push(provisioner.destroyNav());
});

// `terraform apply` in the terminal.
window.addEventListener('provision:replay', () => provisioner?.replay());

if (root.dataset.booted === 'true') {
  startCalm();
} else {
  // The boot overlay dispatches `boot:done`; a visitor who skipped it with a
  // key or a click wants the page now, not a show.
  window.addEventListener(
    'boot:done',
    (e) => {
      const skipped = (e as CustomEvent<{ skipped?: boolean }>).detail?.skipped === true;
      if (provisioner && buildMode && !skipped) {
        provisioner.start();
      } else {
        provisioner?.revealAll();
        startCalm();
      }
      if (provisioner) startAmbient(provisioner);
    },
    { once: true }
  );
}
