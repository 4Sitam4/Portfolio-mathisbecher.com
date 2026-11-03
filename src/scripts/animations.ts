/**
 * Page choreography — deliberately small:
 *  - one entrance on the hero (GSAP timeline) after the boot sequence,
 *  - the trace rows typing in when the live response arrives,
 *  - section titles decrypting once as they scroll into view.
 * Everything is readable without JS; with reduced motion nothing moves.
 */

import gsap from 'gsap';
import { initDecryptObserver, prefersReducedMotion } from './scramble';

const root = document.documentElement;

function heroEntrance(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-hero]');
  if (prefersReducedMotion() || items.length === 0) {
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

function start(): void {
  heroEntrance();
  initDecryptObserver();
}

// Live trace rows appear one after another, like output streaming in.
window.addEventListener('trace:ready', (e) => {
  const rows = (e as CustomEvent<HTMLElement[]>).detail;
  if (prefersReducedMotion() || !rows?.length) return;
  gsap.from(rows, { opacity: 0, x: -6, duration: 0.3, ease: 'power2.out', stagger: 0.05 });
});

// The boot overlay dispatches `boot:done` when it finishes or is skipped.
// If it already ran (or does not exist), start immediately.
if (root.dataset.booted === 'true') {
  start();
} else {
  window.addEventListener('boot:done', () => start(), { once: true });
}
