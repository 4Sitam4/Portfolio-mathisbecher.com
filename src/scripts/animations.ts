/**
 * Global scroll animations (GSAP + ScrollTrigger) and decrypt-on-scroll setup.
 * Runs once per page load, after the boot sequence completes (or immediately
 * if the boot overlay was skipped/absent).
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initDecryptObserver, prefersReducedMotion } from './scramble';

gsap.registerPlugin(ScrollTrigger);

function revealAll(): void {
  // Reduced motion: show everything instantly, no scroll choreography.
  gsap.set('[data-reveal], [data-reveal-group] > *', {
    opacity: 1,
    y: 0,
    clearProps: 'all',
  });
}

function setupScrollAnimations(): void {
  if (prefersReducedMotion()) {
    revealAll();
    return;
  }

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    gsap.to(group.children, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
    });
  });
}

function start(): void {
  setupScrollAnimations();
  initDecryptObserver();
}

// The boot overlay dispatches `boot:done` when it finishes or is skipped.
// If it already ran (or does not exist), start immediately.
if (document.documentElement.dataset.booted === 'true') {
  start();
} else {
  window.addEventListener('boot:done', () => start(), { once: true });
}
