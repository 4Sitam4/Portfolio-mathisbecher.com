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

export interface MatrixOptions {
  /** 0..1 — overall brightness/alpha of the rain */
  intensity?: number;
  fontSize?: number;
  /** frames per second cap */
  fps?: number;
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
  private readonly fontSize: number;
  private readonly fps: number;
  intensity: number;

  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement, options: MatrixOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.intensity = options.intensity ?? 0.5;
    this.fontSize = options.fontSize ?? 16;
    this.fps = options.fps ?? 28;
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

  /** Temporarily crank up speed & brightness (intro, terminal easter egg). */
  boost(durationMs = 6000): void {
    this.boostUntil = performance.now() + durationMs;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    this.lastSwap = performance.now();
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
      const glyph = randomGlyph();

      // Columns near the cursor glow brighter and fall faster.
      const near = this.mouseX >= 0 && Math.abs(x - this.mouseX) < MOUSE_RADIUS;
      const style = near
        ? `rgba(200, 255, 230, ${Math.min(0.9, alpha + 0.3)})`
        : `rgba(0, 255, 157, ${Math.min(0.75, alpha * (0.35 + Math.random() * 0.5))})`;
      for (const { ctx } of this.buffers) {
        ctx.fillStyle = style;
        ctx.fillText(glyph, x, y);
      }

      const speed = this.speeds[i]! * (boosted ? 2.2 : 1) * (near ? 1.8 : 1);
      this.drops[i] = y > h && Math.random() > 0.975 ? 0 : this.drops[i]! + speed;
    }

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(this.buffers[this.shown]!.canvas, 0, 0, w, h);
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
