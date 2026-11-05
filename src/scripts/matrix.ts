/**
 * Matrix rain engine (canvas). Used by the hero background and by the
 * terminal's `matrix` command (fullscreen overlay).
 *
 * Classic "ghost" rendering: each frame only the heads are drawn, and the
 * whole buffer is faded a little, so every glyph leaves a trail that dies
 * out on its own.
 *
 * That fade alone never reaches zero (8-bit rounding leaves a faint residue
 * that piled up into a dense band when the page stayed open). So the rain is
 * drawn into two buffers at once and they take turns: every SWAP_MS the
 * older one is wiped and starts over, while the other — which already holds
 * the last few seconds — is shown. Anything older than a swap is gone for good.
 */

import { prefersReducedMotion } from './scramble';

const GLYPHS = 'アィウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFZ<>*+=$#@';
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

const FADE = 0.16; // share of each ghost erased per frame (higher = shorter trails)
const FADE_BOOSTED = 0.11;
const SWAP_MS = 5000; // a buffer is wiped clean at least this often
const GLYPH_ALPHA = 0.8; // overall lightness of the heads (×intensity)
const MOUSE_RADIUS = 90; // px
const FLOOR_JITTER = 3; // glyphs: how much the columns' lowest points differ
const FLOOR_FADE = 2; // glyphs over which a head dims before its floor

export interface MatrixOptions {
  /** 0..1 — overall brightness/alpha of the rain */
  intensity?: number;
  fontSize?: number;
  /** frames per second cap */
  fps?: number;
  /** device pixel ratio cap (fill cost and memory grow with its square) */
  maxDpr?: number;
}

interface Buffer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export class MatrixRain {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buffers: [Buffer, Buffer];
  /** Index of the buffer currently shown (the one with the longest history). */
  private shown = 0;
  private lastSwap = 0;
  private drops: number[] = [];
  private speeds: number[] = [];
  private columns = 0;
  private width = 0;
  private height = 0;
  private raf = 0;
  private lastFrame = 0;
  private runningFlag = false;
  private mouseX = -1;
  private boostUntil = 0;
  /** Columns sent down on purpose (cue): lowest point each head reached since. */
  private reach = new Map<number, number>();
  private cueSpeed = new Map<number, number>();
  private cueing = false;
  /** Lowest point of the rain (CSS px), and each column's own, a bit above. */
  private floorBase = 0;
  private floors: number[] = [];
  /** This frame's white heads, drawn over the trails, never into them. */
  private heads: { x: number; y: number; g: string; a: number }[] = [];
  readonly fontSize: number;
  private readonly fps: number;
  private readonly maxDpr: number;
  intensity: number;

  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement, options: MatrixOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.intensity = options.intensity ?? 0.5;
    this.fontSize = options.fontSize ?? 16;
    this.fps = options.fps ?? 28;
    this.maxDpr = options.maxDpr ?? 1.5;
    const buffer = (): Buffer => {
      const c = document.createElement('canvas');
      return { canvas: c, ctx: c.getContext('2d')! };
    };
    this.buffers = [buffer(), buffer()];
    this.resize();
    window.addEventListener('resize', this.onResize);
  }

  setMouseX(x: number): void {
    this.mouseX = x;
  }

  get running(): boolean {
    return this.runningFlag;
  }

  /**
   * Start the whole rain again from the top, slightly staggered, and track how
   * far the heads of the columns between x0 and x1 (CSS px, canvas space) get:
   * the hero portrait is built by the very rain behind it. Every column
   * restarts alike (no edge between tracked and untracked ones).
   */
  cue(x0: number, x1: number): void {
    this.reach.clear();
    this.cueing = true;
    const fs = this.fontSize;
    const i0 = Math.floor(x0 / fs);
    const i1 = Math.ceil(x1 / fs);
    for (let i = 0; i < this.columns; i++) {
      this.drops[i] = -Math.random() * 6;
      // a steady pace of their own (no boost, no cursor rush) until they leave
      // the screen: the build is seen at the same speed every time
      this.cueSpeed.set(i, 0.38 + Math.random() * 0.2);
      if (i >= i0 && i < i1) this.reach.set(i, -Infinity);
    }
  }

  /** Lowest head position (CSS px) of columns col0 … col0+out.length since the
   * cue; columns not cued count as fully passed. */
  reachInto(col0: number, out: Float32Array): void {
    for (let k = 0; k < out.length; k++) out[k] = this.reach.get(col0 + k) ?? 1e6;
  }

  /** Stop tracking; each column keeps its cue pace until it leaves the screen. */
  uncue(): void {
    this.reach.clear();
    this.cueing = false;
  }

  /** Temporarily crank up speed & brightness (intro, terminal easter egg). */
  boost(durationMs = 6000): void {
    this.boostUntil = performance.now() + durationMs;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    for (const { canvas, ctx } of [{ canvas: this.canvas, ctx: this.ctx }, ...this.buffers]) {
      canvas.width = Math.floor(this.width * dpr);
      canvas.height = Math.floor(this.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${this.fontSize}px 'JetBrains Mono', monospace`;
    }
    this.columns = Math.ceil(this.width / this.fontSize);
    this.drops = Array.from({ length: this.columns }, () => Math.floor((Math.random() * this.height) / this.fontSize));
    this.speeds = Array.from({ length: this.columns }, () => 0.6 + Math.random() * 0.8);
    // The rain ends at the bottom of the first screen (not mid-window when the
    // canvas is taller than it), each column a little above or below its
    // neighbours: a ragged, living edge rather than a straight line.
    const top = this.canvas.getBoundingClientRect().top + window.scrollY;
    const visible = window.innerHeight - top;
    this.floorBase = visible > this.fontSize * 4 ? Math.min(this.height, visible) : this.height;
    this.floors = Array.from({ length: this.columns }, () => this.newFloor());
    this.lastSwap = performance.now();
  }

  /** Where a column stops this time: 0 to FLOOR_JITTER glyphs above the base. */
  private newFloor(): number {
    return this.floorBase - Math.random() * FLOOR_JITTER * this.fontSize;
  }

  /** Draw a single static frame (reduced-motion fallback). */
  drawStatic(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = `rgba(0, 255, 157, ${0.1 * this.intensity})`;
    for (let i = 0; i < this.columns; i++) {
      if (Math.random() > 0.6) continue;
      ctx.fillText(randomGlyph(), i * this.fontSize, Math.random() * this.height);
    }
  }

  private frame = (now: number) => {
    if (!this.runningFlag) return;
    this.raf = requestAnimationFrame(this.frame);

    const interval = 1000 / this.fps;
    if (now - this.lastFrame < interval) return;
    this.lastFrame = now;

    const { width: w, height: h, fontSize: fs } = this;
    const boosted = now < this.boostUntil;
    const alpha = this.intensity * GLYPH_ALPHA * (boosted ? 1.6 : 1);

    // Take turns: wipe the older buffer, show the other one.
    if (now - this.lastSwap > SWAP_MS) {
      this.lastSwap = now;
      this.buffers[this.shown]!.ctx.clearRect(0, 0, w, h);
      this.shown = 1 - this.shown;
    }

    // Fade every ghost a little (erases alpha, keeps the canvas transparent).
    for (const { ctx } of this.buffers) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${boosted ? FADE_BOOSTED : FADE})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    for (let i = 0; i < this.columns; i++) {
      const x = i * fs;
      const y = this.drops[i]! * fs;
      const floor = this.floors[i]!;

      // Columns near the cursor glow brighter and fall faster.
      const near = this.mouseX >= 0 && Math.abs(x - this.mouseX) < MOUSE_RADIUS;
      if (y <= floor) {
        // the head dims over its last glyphs before the column's own floor
        const edge = Math.min(1, (floor - y) / (FLOOR_FADE * fs));
        // while the portrait is being built, every head lights up the same way
        const bright = near || this.cueing;
        // the trail is always green; a bright head is a white glyph on top,
        // shown for this frame only, so it never leaves a pale trail
        const green = Math.min(0.75, alpha * (bright ? 0.85 : 0.35 + Math.random() * 0.5)) * edge;
        const glyph = randomGlyph();
        for (const { ctx } of this.buffers) {
          ctx.fillStyle = `rgba(0, 255, 157, ${green})`;
          ctx.fillText(glyph, x, y);
        }
        if (bright) this.heads.push({ x, y, g: glyph, a: Math.min(0.9, alpha + 0.3) * edge });
      }

      const r = this.reach.get(i);
      // past its floor, a column has crossed all there is to see
      if (r !== undefined) this.reach.set(i, y > floor ? 1e6 : Math.max(r, y));

      const speed = this.cueSpeed.get(i) ?? this.speeds[i]! * (boosted ? 2.2 : 1) * (near ? 1.8 : 1);
      if (y > floor && Math.random() > 0.975) {
        this.drops[i] = 0;
        this.floors[i] = this.newFloor();
        if (!this.cueing) this.cueSpeed.delete(i); // back to its own pace
      } else this.drops[i] = this.drops[i]! + speed;
    }

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(this.buffers[this.shown]!.canvas, 0, 0, w, h);
    for (const hd of this.heads) {
      // a pale green, not white: at the canvas' half opacity white reads grey
      this.ctx.fillStyle = `rgba(120, 255, 190, ${hd.a})`;
      this.ctx.fillText(hd.g, hd.x, hd.y);
    }
    this.heads.length = 0;
  };

  start(): void {
    if (this.runningFlag) return;
    if (prefersReducedMotion()) {
      this.drawStatic();
      return;
    }
    this.runningFlag = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.runningFlag = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
  }
}

/** The hero background rain, for the portrait to sync its build with. */
let heroRain: { rain: MatrixRain; canvas: HTMLCanvasElement } | null = null;
export const setHeroRain = (rain: MatrixRain, canvas: HTMLCanvasElement): void => {
  heroRain = { rain, canvas };
};
export const getHeroRain = () => heroRain;

/** Fullscreen rain overlay for ~6s — triggered by the terminal `matrix` command. */
export function fullscreenMatrixBurst(durationMs = 6000): void {
  if (prefersReducedMotion()) return;
  if (document.getElementById('matrix-burst')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-burst';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '900',
    pointerEvents: 'none',
    opacity: '0',
    // The canvas itself is transparent: darken the page behind the rain.
    background: 'rgba(5, 8, 6, 0.85)',
    transition: 'opacity 600ms ease',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(canvas);

  const rain = new MatrixRain(canvas, { intensity: 0.9, fps: 30 });
  rain.start();
  requestAnimationFrame(() => (canvas.style.opacity = '1'));

  window.setTimeout(() => {
    canvas.style.opacity = '0';
    window.setTimeout(() => {
      rain.destroy();
      canvas.remove();
    }, 650);
  }, durationMs);
}
