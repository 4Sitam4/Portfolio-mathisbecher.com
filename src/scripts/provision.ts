/**
 * "terraform apply" — the page provisions itself.
 *
 * Every element marked `data-provision="<resource>"` is a resource. While it is
 * pending it is invisible; a swarm of cursor "agents" drags a selection frame
 * around it (resource name, dimensions, guides), then the element fills in.
 * The first run covers what is on screen when the boot sequence ends; the rest
 * is provisioned as it scrolls into view. A status bar mirrors terraform output.
 */

import gsap from 'gsap';
import { scramble } from './scramble';

type Lang = 'fr' | 'en';

const STR = {
  fr: { skip: 'Passer', replay: 'Rejouer', rest: 'défilez pour provisionner la suite', region: 'Construction de la page' },
  en: { skip: 'Skip', replay: 'Replay', rest: 'scroll to provision the rest', region: 'Page build' },
} as const;

/** Shades from the page palette — the agents never introduce a new hue. */
const AGENT_COLORS = ['#00ff9d', '#e4ede8', '#7dffcb', '#a3b6ad', '#38e8a8', '#c9fbe6', '#5effc0'];

/* --- timing (seconds) ----------------------------------------------------- */
const T_REACH = 0.35; // agent flies to the top-left corner
const T_DRAG = 0.35; // agent drags the selection to the bottom-right corner
const T_FILL = 0.35; // element fades in
const T_HOLD = 0.35; // frame stays a moment after the fill
const T_OUT = 0.4; // frame and guides fade out
const AGENT_BUSY = T_REACH + T_DRAG + 0.05;

/* --- DOM helpers ------------------------------------------------------------ */

const isVisible = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    if (getComputedStyle(n).visibility === 'hidden') return false;
  }
  return true;
};

const inViewport = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement, text?: string) {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  parent?.append(el);
  return el;
}

function createLayer(): HTMLElement {
  const layer = h('div', 'pv-layer');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.height = `${document.documentElement.scrollHeight}px`;
  document.body.append(layer);
  return layer;
}

function createAgent(layer: HTMLElement, i: number): HTMLElement {
  const agent = h('div', 'pv-agent', layer);
  agent.style.color = AGENT_COLORS[i % AGENT_COLORS.length]!;
  agent.innerHTML =
    '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.5 13.5 7.2 8.2 8.6 5.7 14Z" fill="currentColor" stroke="#070b09" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  return agent;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function createFrame(layer: HTMLElement, box: Box, name: string) {
  const gx = h('div', 'pv-guide pv-guide--x', layer);
  gx.style.top = `${box.y}px`;
  const gy = h('div', 'pv-guide pv-guide--y', layer);
  gy.style.left = `${box.x}px`;

  // Near the top of the page there is no room above: labels go underneath,
  // side by side — so the dimensions are dropped when both would not fit.
  const flip = box.y < 24;
  const tagText = `module.${name}`;
  const dimsText = `${Math.round(box.w)} × ${Math.round(box.h)}`;
  const LABEL_CH = 6.2; // px per character of the 10px mono labels
  const showDims = !flip || box.w > (tagText.length + dimsText.length) * LABEL_CH + 24;
  const frame = h('div', flip ? 'pv-frame pv-frame--flip' : 'pv-frame', layer);
  Object.assign(frame.style, {
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.w}px`,
    height: `${box.h}px`,
  });
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

/* --- Status bar --------------------------------------------------------------- */

class StatusBar {
  private el: HTMLElement;
  private msg: HTMLElement;
  private count: HTMLElement;
  private time: HTMLElement;
  private btn: HTMLButtonElement;
  private dots: HTMLElement[];
  private timer = 0;
  mode: 'skip' | 'replay' = 'skip';

  constructor(
    private s: (typeof STR)[Lang],
    onButton: () => void
  ) {
    this.el = h('div', 'pv-status');
    this.el.setAttribute('role', 'region');
    this.el.setAttribute('aria-label', s.region);
    this.el.hidden = true;
    const dots = h('span', 'pv-status__dots', this.el);
    dots.setAttribute('aria-hidden', 'true');
    this.dots = [h('i', '', dots), h('i', '', dots), h('i', '', dots)];
    h('span', 'pv-status__cmd', this.el, 'terraform apply').setAttribute('aria-hidden', 'true');
    this.msg = h('span', 'pv-status__msg', this.el);
    this.msg.setAttribute('aria-hidden', 'true');
    this.count = h('span', 'pv-status__count num', this.el);
    this.count.setAttribute('aria-hidden', 'true');
    this.time = h('span', 'pv-status__time num', this.el);
    this.time.setAttribute('aria-hidden', 'true');
    this.btn = h('button', 'pv-status__btn', this.el, s.skip);
    this.btn.type = 'button';
    this.btn.addEventListener('click', onButton);
    document.body.append(this.el);
  }

  show(): void {
    clearTimeout(this.timer);
    if (!this.el.hidden) return;
    this.el.hidden = false;
    gsap.fromTo(this.el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
  }

  hideAfter(ms: number): void {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      // Keep it while the visitor is using its button.
      if (this.el.contains(document.activeElement)) return;
      gsap.to(this.el, { opacity: 0, y: 12, duration: 0.25, onComplete: () => void (this.el.hidden = true) });
    }, ms);
  }

  update(message: string, done: number, total: number, seconds?: number): void {
    this.msg.textContent = message;
    this.count.textContent = `${done}/${total}`;
    if (seconds !== undefined) this.time.textContent = `${seconds.toFixed(1)}s`;
    const lit = Math.ceil((done / total) * 3);
    this.dots.forEach((d, i) => d.classList.toggle('is-on', i < lit));
    this.el.classList.toggle('is-complete', done === total);
  }

  setMode(mode: 'skip' | 'replay'): void {
    this.mode = mode;
    this.btn.textContent = mode === 'skip' ? this.s.skip : this.s.replay;
  }
}

/* --- Provisioner --------------------------------------------------------------- */

export class Provisioner {
  private readonly targets: HTMLElement[];
  private readonly done = new Set<HTMLElement>();
  private readonly running = new Set<gsap.core.Timeline>();
  private readonly observer: IntersectionObserver;
  private readonly bar: StatusBar;
  private readonly s: (typeof STR)[Lang];
  private queue: HTMLElement[] = [];
  private flushTimer = 0;
  private intro: gsap.core.Timeline | null = null;

  constructor(lang: Lang) {
    this.s = STR[lang];
    this.targets = [...document.querySelectorAll<HTMLElement>('[data-provision]')];
    this.bar = new StatusBar(this.s, () => (this.bar.mode === 'skip' ? this.skip() : this.replay()));
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.observer.unobserve(entry.target);
          this.enqueue(entry.target as HTMLElement);
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
  }

  get total(): number {
    return this.targets.length;
  }

  /** Hide every resource until it is built. */
  arm(): void {
    this.done.clear();
    for (const el of this.targets) el.dataset.pv = 'pending';
  }

  /** Show everything immediately, without animation (skip at boot, fallback). */
  revealAll(): void {
    this.observer.disconnect();
    for (const el of this.targets) this.complete(el, false);
  }

  /** Build what is on screen now, then the rest as it scrolls into view. */
  start(): void {
    const now = this.targets.filter((el) => this.done.has(el) === false && inViewport(el));
    for (const el of this.targets) {
      if (!this.done.has(el) && !now.includes(el)) this.observer.observe(el);
    }
    this.runIntro(now);
  }

  replay(): void {
    this.running.forEach((tl) => tl.progress(1));
    this.observer.disconnect();
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    this.arm();
    requestAnimationFrame(() => this.start());
  }

  skip(): void {
    this.intro?.progress(1);
  }

  /* ----------------------------------------------------------------------- */

  private complete(el: HTMLElement, animate: boolean): void {
    el.dataset.pv = 'done';
    this.done.add(el);
    if (animate) el.querySelectorAll<HTMLElement>('[data-decrypt]').forEach((d) => scramble(d));
  }

  private enqueue(el: HTMLElement): void {
    if (this.done.has(el)) return;
    this.queue.push(el);
    // Elements entering together are built by one squad.
    clearTimeout(this.flushTimer);
    this.flushTimer = window.setTimeout(() => {
      const batch = this.queue.filter((t) => !this.done.has(t));
      this.queue = [];
      if (batch.length) this.run(batch, { stagger: 0.12, from: 'left', intro: false });
    }, 60);
  }

  private runIntro(targets: HTMLElement[]): void {
    window.dispatchEvent(new CustomEvent('matrix:boost', { detail: 3500 }));
    this.bar.setMode('skip');
    const tl = this.run(targets, { stagger: 0.16, from: 'bar', intro: true });
    this.intro = tl;

    // Any intent to move on skips the intro.
    const skipKeys = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
      this.skip();
    };
    const skipPointer = (e: Event) => {
      if ((e.target as HTMLElement).closest('.pv-status')) return;
      this.skip();
    };
    const opts = { passive: true } as const;
    window.addEventListener('wheel', skipPointer, opts);
    window.addEventListener('touchmove', skipPointer, opts);
    window.addEventListener('pointerdown', skipPointer, opts);
    window.addEventListener('keydown', skipKeys);
    this.introCleanup = () => {
      this.intro = null;
      window.removeEventListener('wheel', skipPointer);
      window.removeEventListener('touchmove', skipPointer);
      window.removeEventListener('pointerdown', skipPointer);
      window.removeEventListener('keydown', skipKeys);
    };
  }

  private introCleanup: (() => void) | null = null;

  private finishRun(intro: boolean): void {
    const n = this.done.size;
    this.bar.setMode('replay');
    if (n === this.total) {
      this.bar.update(`Apply complete! Resources: ${n} added, 0 changed, 0 destroyed.`, n, this.total);
      this.bar.hideAfter(6000);
    } else {
      if (intro) this.bar.update(`${n} created — ${this.s.rest}`, n, this.total);
      this.bar.hideAfter(intro ? 4500 : 2200);
    }
  }

  private run(
    list: HTMLElement[],
    o: { stagger: number; from: 'bar' | 'left'; intro: boolean }
  ): gsap.core.Timeline {
    const startedAt = performance.now();
    const elapsed = () => (performance.now() - startedAt) / 1000;
    const layer = createLayer();
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        this.running.delete(tl);
        if (o.intro) {
          this.introCleanup?.();
          this.introCleanup = null;
        }
        this.finishRun(o.intro);
      },
    });
    this.running.add(tl);

    // Hidden or collapsed resources (e.g. the closed mobile menu) are done at once.
    const visible = list.filter((el) => {
      if (isVisible(el)) return true;
      this.complete(el, false);
      return false;
    });

    this.bar.show();
    this.bar.update(`Creating ${visible.length} resources…`, this.done.size, this.total, 0);

    const squad = Math.max(1, Math.min(visible.length, Math.ceil(AGENT_BUSY / o.stagger) + 1));
    const agents = Array.from({ length: squad }, (_, i) => createAgent(layer, i));
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sy = window.scrollY;
    agents.forEach((a, i) =>
      gsap.set(
        a,
        o.from === 'bar'
          ? { x: vw / 2 + (i - squad / 2) * 18, y: sy + vh - 48 }
          : { x: -24, y: sy + vh * (0.25 + 0.5 * Math.random()) }
      )
    );

    visible.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const box: Box = { x: r.left + window.scrollX, y: r.top + sy, w: r.width, h: r.height };
      const name = el.dataset.provision ?? 'resource';
      const { frame, sel, marks, gx, gy } = createFrame(layer, box, name);
      const agent = agents[i % squad]!;
      const t0 = i * o.stagger;
      const tDrag = t0 + T_REACH;
      const tFill = tDrag + T_DRAG;

      tl.to(agent, { x: box.x, y: box.y, duration: T_REACH, ease: 'power3.inOut' }, t0);
      tl.call(() => this.bar.update(`module.${name}: Creating...`, this.done.size, this.total, elapsed()), [], tDrag);
      // The selection is dragged open by the agent.
      tl.set(frame, { opacity: 1 }, tDrag);
      tl.fromTo(
        sel,
        { clipPath: 'inset(0% 100% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: T_DRAG, ease: 'power2.inOut' },
        tDrag
      );
      tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.02 }, tDrag + T_DRAG * 0.6);
      tl.to(agent, { x: box.x + box.w, y: box.y + box.h, duration: T_DRAG, ease: 'power2.inOut' }, tDrag);
      tl.fromTo(gx, { opacity: 0.9, scaleX: 0 }, { scaleX: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);
      tl.fromTo(gy, { opacity: 0.9, scaleY: 0 }, { scaleY: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);
      // The resource comes up.
      tl.call(
        () => {
          this.complete(el, true);
          this.bar.update(`module.${name}: Creation complete`, this.done.size, this.total, elapsed());
        },
        [],
        tFill
      );
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: T_FILL, ease: 'power1.out', immediateRender: false, clearProps: 'opacity' }, tFill);
      tl.to([frame, gx, gy], { opacity: 0, duration: T_OUT, ease: 'power1.in' }, tFill + T_FILL + T_HOLD);
    });

    // The squad leaves once its last resource is up.
    const end = (visible.length - 1) * o.stagger + T_REACH + T_DRAG + 0.2;
    tl.to(agents, { opacity: 0, duration: 0.3, stagger: 0.03 }, Math.max(0, end));
    return tl;
  }
}
