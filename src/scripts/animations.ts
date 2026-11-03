/**
 * Page choreography.
 *  - First visit: boot sequence, then the page provisions itself
 *    ("terraform apply", see provision.ts), section by section on scroll.
 *  - Repeat visit (same session): one short entrance on the hero.
 *  - Section titles decrypt once; the live trace rows stream in.
 * Everything is readable without JS; with reduced motion nothing moves.
 */

import gsap from 'gsap';
import { initDecryptObserver, prefersReducedMotion } from './scramble';
import { Provisioner } from './provision';

const root = document.documentElement;
const lang = root.lang === 'fr' ? 'fr' : 'en';
const reduced = prefersReducedMotion();
const buildMode = root.classList.contains('pv');
const provisioner = reduced ? null : new Provisioner(lang);

// Take over from the pre-paint class: from here on, each resource carries
// its own pending/done state.
if (provisioner && buildMode) provisioner.arm();
root.classList.remove('pv');

function heroEntrance(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-hero]');
  if (reduced || items.length === 0) {
    root.classList.remove('anim');
    return;
  }
  gsap.fromTo(
    items,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.06,
      clearProps: 'transform',
      onStart: () => root.classList.remove('anim'),
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
  gsap.from(rows, { opacity: 0, x: -6, duration: 0.3, ease: 'power2.out', stagger: 0.05 });
});

// `terraform apply` in the terminal, or the status bar button.
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
    },
    { once: true }
  );
}
