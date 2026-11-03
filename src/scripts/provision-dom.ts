/**
 * Building blocks for the "terraform apply" effects: overlay layer, cursor
 * agents (with their trail), selection frames, scan line, glitch, sweep.
 * Shared by the build engine (provision.ts) and the ambient loop
 * (provision-ambient.ts).
 */

import gsap from 'gsap';

/** Shades from the page palette — the agents never introduce a new hue. */
export const AGENT_COLORS = ['#00ff9d', '#e4ede8', '#7dffcb', '#a3b6ad', '#38e8a8', '#c9fbe6', '#5effc0'];

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement, text?: string) {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  parent?.append(el);
  return el;
}

export const isVisible = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    if (getComputedStyle(n).visibility === 'hidden') return false;
  }
  return true;
};

export const inViewport = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

/** Element box in document coordinates. */
export function boxOf(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

/** Absolute overlay covering the whole document, removed by the caller. */
export function createLayer(): HTMLElement {
  const layer = h('div', 'pv-layer');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.height = `${document.documentElement.scrollHeight}px`;
  document.body.append(layer);
  return layer;
}

/** A cursor with its name chip ("tf-01"), leaving a short trail when it moves. */
export function createAgent(layer: HTMLElement, i: number): HTMLElement {
  const agent = h('div', 'pv-agent', layer);
  const color = AGENT_COLORS[i % AGENT_COLORS.length]!;
  agent.style.color = color;
  agent.innerHTML =
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.5 13.5 7.2 8.2 8.6 5.7 14Z" fill="currentColor" stroke="#070b09" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  const chip = h('span', 'pv-agent__chip', agent, `tf-${String(i + 1).padStart(2, '0')}`);
  chip.style.background = color;
  return agent;
}

/** Drops fading dots behind an agent while a tween moves it. */
export function trail(agent: HTMLElement, layer: HTMLElement): () => void {
  let n = 0;
  return () => {
    if (n++ % 3 !== 0) return;
    const dot = h('i', 'pv-trail', layer);
    dot.style.color = agent.style.color;
    dot.style.transform = `translate(${gsap.getProperty(agent, 'x')}px, ${gsap.getProperty(agent, 'y')}px)`;
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  };
}

export interface Frame {
  frame: HTMLElement;
  sel: HTMLElement;
  marks: HTMLElement[];
  gx: HTMLElement;
  gy: HTMLElement;
}

/** Selection frame with resource tag, dimensions, handles and guides. */
export function createFrame(layer: HTMLElement, box: Box, tagText: string, variant = ''): Frame {
  const gx = h('div', 'pv-guide pv-guide--x', layer);
  gx.style.top = `${box.y}px`;
  const gy = h('div', 'pv-guide pv-guide--y', layer);
  gy.style.left = `${box.x}px`;

  // Near the top of the page there is no room above: labels go underneath,
  // side by side — so the dimensions are dropped when both would not fit.
  const flip = box.y < 24;
  const dimsText = `${Math.round(box.w)} × ${Math.round(box.h)}`;
  const LABEL_CH = 6.2; // px per character of the 10px mono labels
  const showDims = !flip || box.w > (tagText.length + dimsText.length) * LABEL_CH + 24;
  const frame = h('div', ['pv-frame', flip && 'pv-frame--flip', variant].filter(Boolean).join(' '), layer);
  Object.assign(frame.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  // The box is clipped while it is dragged open; the labels and handles sit
  // outside its bounds, so they live beside it and fade in once it is open.
  const sel = h('div', 'pv-frame__box', frame);
  const marks = [
    h('span', 'pv-frame__tag', frame, tagText),
    ...(showDims ? [h('span', 'pv-frame__dims', frame, dimsText)] : []),
    ...['tl', 'tr', 'bl', 'br'].map((c) => h('i', `pv-frame__handle pv-frame__handle--${c}`, frame)),
  ];
  return { frame, sel, marks, gx, gy };
}

/** A bright line sweeping down a box. Returns the line so a timeline can drive it. */
export function createScan(layer: HTMLElement, box: Box): HTMLElement {
  const scan = h('div', 'pv-scan', layer);
  Object.assign(scan.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px` });
  return scan;
}

/** Brief chromatic split on an element (palette colors only). */
export function glitch(el: HTMLElement): void {
  el.classList.remove('pv-glitch');
  void el.offsetWidth; // restart the animation
  el.classList.add('pv-glitch');
  el.addEventListener('animationend', () => el.classList.remove('pv-glitch'), { once: true });
}

/** Full-screen scan when the whole apply is complete. */
export function sweep(): void {
  const s = h('div', 'pv-sweep');
  s.setAttribute('aria-hidden', 'true');
  h('i', 'pv-sweep__line', s);
  document.body.append(s);
  gsap.fromTo(
    s,
    { yPercent: -100 },
    { yPercent: 100, duration: 1.1, ease: 'power2.inOut', onComplete: () => s.remove() }
  );
}
