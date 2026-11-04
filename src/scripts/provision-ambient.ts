/**
 * Effects that keep running once the page is built:
 *  - drift detection: rarely, and only while the visitor is idle, a visible
 *    resource gets a dashed frame ("Refreshing state...") and a scan line;
 *  - inspector: on desktop, hovering a block shows its frame, module name and
 *    size, like browser devtools.
 * Drift pauses while a build is running, when the tab is hidden, or while the
 * visitor is typing.
 */

import gsap from 'gsap';
import { boxOf, createFrame, createLayer, createScan, h, isVisible, SPEED } from './provision-dom';

interface Engine {
  readonly busy: boolean;
}

const DRIFT_FIRST_MS = 20_000; // first check after the page is built
const DRIFT_MIN_MS = 25_000; // then every 25–45 s
const DRIFT_JITTER_MS = 20_000;
const DRIFT_IDLE_MS = 10_000; // only after 10 s without any interaction
const DRIFT_MAX = 3; // per page view
const SAFE_MARGIN = 72; // px kept clear of the nav and the status bar

const typing = () => document.activeElement?.matches('input, textarea, [contenteditable]') ?? false;

/** Built resources fully on screen, outside the fixed nav. */
function candidates(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-pv="done"]')].filter((el) => {
    if (el.closest('.nav')) return false;
    const r = el.getBoundingClientRect();
    return r.top > SAFE_MARGIN && r.bottom < window.innerHeight - SAFE_MARGIN && isVisible(el);
  });
}

/** A quiet check: dashed frame opens, one scan line, gone. No cursor. */
function drift(el: HTMLElement): void {
  const layer = createLayer();
  const box = boxOf(el);
  const { frame, sel, marks } = createFrame(
    layer,
    box,
    `module.${el.dataset.provision}: Refreshing state...`,
    'pv-frame--drift'
  );
  const scan = createScan(layer, box);

  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  tl.timeScale(SPEED);
  tl.set(frame, { opacity: 1 });
  tl.fromTo(sel, { clipPath: 'inset(0% 100% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power2.inOut' });
  tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.2 }, '-=0.15');
  tl.fromTo(scan, { opacity: 0.7, y: 0 }, { y: box.h, duration: 0.7, ease: 'power1.inOut', immediateRender: false });
  tl.to(scan, { opacity: 0, duration: 0.15 });
  tl.to(frame, { opacity: 0, duration: 0.4 }, '+=0.2');
}

function driftLoop(engine: Engine): void {
  let last: HTMLElement | null = null;
  let count = 0;
  let lastInput = performance.now();
  const touch = () => void (lastInput = performance.now());
  for (const type of ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart']) {
    window.addEventListener(type, touch, { passive: true });
  }

  const tick = () => {
    if (count >= DRIFT_MAX) return;
    window.setTimeout(tick, DRIFT_MIN_MS + Math.random() * DRIFT_JITTER_MS);
    const idle = performance.now() - lastInput > DRIFT_IDLE_MS;
    if (!idle || document.hidden || engine.busy || typing()) return;
    const pool = candidates().filter((el) => el !== last);
    if (pool.length === 0) return;
    last = pool[Math.floor(Math.random() * pool.length)]!;
    count++;
    drift(last);
  };
  window.setTimeout(tick, DRIFT_FIRST_MS);
}

function inspector(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const box = h('div', 'pv-inspect');
  box.setAttribute('aria-hidden', 'true');
  const tag = h('span', 'pv-inspect__tag', box);
  const dims = h('span', 'pv-inspect__dims', box);
  document.body.append(box);

  let current: HTMLElement | null = null;
  let timer = 0;

  const place = () => {
    if (!current) return;
    const r = current.getBoundingClientRect();
    box.style.transform = `translate(${r.left}px, ${r.top}px)`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
    dims.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
  };
  const hide = () => {
    current = null;
    box.classList.remove('is-on');
  };

  document.addEventListener('pointerover', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-pv="done"]');
    if (el === current) return;
    clearTimeout(timer);
    if (!el || el.closest('.nav')) return hide();
    timer = window.setTimeout(() => {
      current = el;
      tag.textContent = `module.${el.dataset.provision}`;
      place();
      box.classList.add('is-on');
    }, 120);
  });
  document.documentElement.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    hide();
  });
  const follow = () => requestAnimationFrame(place);
  window.addEventListener('scroll', follow, { passive: true });
  window.addEventListener('resize', follow);
}

export function startAmbient(engine: Engine): void {
  driftLoop(engine);
  inspector();
}
