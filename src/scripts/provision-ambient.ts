/**
 * Effects that keep running once the page is built:
 *  - drift detection: every few seconds an agent flies in, frames a visible
 *    resource ("Refreshing state..."), scans it and leaves;
 *  - inspector: on desktop, hovering a block shows its frame, module name and
 *    size, like browser devtools.
 * Both pause while a build is running, when the tab is hidden, or while the
 * visitor is typing.
 */

import gsap from 'gsap';
import { AGENT_COLORS, boxOf, createAgent, createFrame, createLayer, createScan, glitch, h, isVisible, trail } from './provision-dom';

interface Engine {
  readonly busy: boolean;
}

const DRIFT_MIN_MS = 3500;
const DRIFT_JITTER_MS = 3000;
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

function drift(el: HTMLElement): void {
  const layer = createLayer();
  const box = boxOf(el);
  const agent = createAgent(layer, Math.floor(Math.random() * AGENT_COLORS.length));
  const onUpdate = trail(agent, layer);
  const { frame, sel, marks, gx, gy } = createFrame(
    layer,
    box,
    `module.${el.dataset.provision}: Refreshing state...`,
    'pv-frame--drift'
  );
  const scan = createScan(layer, box);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const fromLeft = Math.random() < 0.5;
  const edge = (left: boolean) => sx + (left ? -32 : vw + 32);

  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  tl.set(agent, { x: edge(fromLeft), y: sy + vh * (0.2 + Math.random() * 0.6) });
  tl.to(agent, { x: box.x, y: box.y, duration: 0.7, ease: 'power3.inOut', onUpdate });
  tl.addLabel('drag');
  tl.set(frame, { opacity: 1 }, 'drag');
  tl.fromTo(sel, { clipPath: 'inset(0% 100% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'power2.inOut' }, 'drag');
  tl.to(agent, { x: box.x + box.w, y: box.y + box.h, duration: 0.4, ease: 'power2.inOut', onUpdate }, 'drag');
  tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.02 }, 'drag+=0.25');
  tl.fromTo(gx, { opacity: 0.6, scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, 'drag');
  tl.fromTo(gy, { opacity: 0.6, scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power2.out' }, 'drag');
  tl.addLabel('scan', 'drag+=0.45');
  tl.fromTo(scan, { opacity: 1, y: 0 }, { y: box.h, duration: 0.6, ease: 'power1.inOut', immediateRender: false }, 'scan');
  tl.to(scan, { opacity: 0, duration: 0.15 }, 'scan+=0.6');
  tl.call(() => glitch(el), [], 'scan+=0.6');
  tl.to([frame, gx, gy], { opacity: 0, duration: 0.4 }, 'scan+=0.9');
  tl.to(agent, { x: edge(!fromLeft), y: sy + vh * Math.random(), duration: 0.8, ease: 'power2.in', onUpdate }, 'scan+=0.7');
}

function driftLoop(engine: Engine): void {
  let last: HTMLElement | null = null;
  const tick = () => {
    window.setTimeout(tick, DRIFT_MIN_MS + Math.random() * DRIFT_JITTER_MS);
    if (document.hidden || engine.busy || typing()) return;
    const pool = candidates().filter((el) => el !== last);
    if (pool.length === 0) return;
    last = pool[Math.floor(Math.random() * pool.length)]!;
    drift(last);
  };
  window.setTimeout(tick, DRIFT_MIN_MS);
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
