/**
 * Matrix rain engine (canvas). Used by the hero background and by the
 * terminal's `matrix` command (fullscreen overlay).
 *
 * Every frame is cleared and each column redraws its own trail (head + a
 * fading tail of glyphs). Nothing is left on the canvas between frames, so
 * the rain looks the same after hours as after seconds — the old
 * "fade with a translucent fill" approach left 8-bit rounding ghosts that
 * piled up into a dense band over time.
 */

import { prefersReducedMotion } from './scramble';

const GLYPHS = 'アィウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFZ<>*+=$#@';
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

const TRAIL_MIN = 8;
const TRAIL_MAX = 24;
const MUTATION_RATE = 0.012; // share of glyphs that change each frame
const MOUSE_RADIUS = 90; // px

export interface MatrixOptions {
  /** 0..1 — overall brightness/alpha of the rain */
  intensity?: number;
  fontSize?: number;
  /** frames per second cap */
  fps?: number;
}

export class MatrixRain {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private columns = 0;
  private rows = 0;
  private glyphs: string[] = [];
  private heads: number[] = [];
  private speeds: number[] = [];
  private lengths: number[] = [];
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

  private respawn(i: number, anywhere: boolean): void {
    this.heads[i] = anywhere ? Math.random() * this.rows : -Math.random() * this.rows * 0.5;
    this.speeds[i] = 0.35 + Math.random() * 0.55;
    this.lengths[i] = TRAIL_MIN + Math.floor(Math.random() * (TRAIL_MAX - TRAIL_MIN));
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const { clientWidth, clientHeight } = this.canvas;
    this.canvas.width = Math.floor(clientWidth * dpr);
    this.canvas.height = Math.floor(clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = `${this.fontSize}px 'JetBrains Mono', monospace`;
    this.ctx.textBaseline = 'top';
    this.columns = Math.ceil(clientWidth / this.fontSize);
    this.rows = Math.ceil(clientHeight / this.fontSize) + 1;
    this.glyphs = Array.from({ length: this.columns * this.rows }, randomGlyph);
    this.heads = [];
    this.speeds = [];
    this.lengths = [];
    for (let i = 0; i < this.columns; i++) this.respawn(i, true);
  }

  /** Draw a single static frame (reduced-motion fallback). */
  drawStatic(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    ctx.fillStyle = 'rgb(0, 255, 157)';
    ctx.globalAlpha = 0.1 * this.intensity;
    for (let i = 0; i < this.columns; i++) {
      if (Math.random() > 0.6) continue;
      ctx.fillText(randomGlyph(), i * this.fontSize, Math.random() * this.canvas.clientHeight);
    }
    ctx.globalAlpha = 1;
  }

  private frame = (now: number) => {
    if (!this.runningFlag) return;
    this.raf = requestAnimationFrame(this.frame);

    const interval = 1000 / this.fps;
    if (now - this.lastFrame < interval) return;
    this.lastFrame = now;

    const { ctx, fontSize: fs, columns, rows, glyphs } = this;
    const boosted = now < this.boostUntil;
    const base = Math.min(1, this.intensity * (boosted ? 1.6 : 1));

    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    // A few glyphs flicker to new characters.
    const mutations = Math.ceil(glyphs.length * MUTATION_RATE);
    for (let m = 0; m < mutations; m++) glyphs[Math.floor(Math.random() * glyphs.length)] = randomGlyph();

    for (let i = 0; i < columns; i++) {
      const x = i * fs;
      // Columns near the cursor glow brighter and fall faster.
      const near = this.mouseX >= 0 && Math.abs(x - this.mouseX) < MOUSE_RADIUS;
      const alpha = Math.min(1, base + (near ? 0.3 : 0));
      const head = Math.floor(this.heads[i]!);
      const len = this.lengths[i]!;

      // Tail: fades out behind the head.
      ctx.fillStyle = 'rgb(0, 255, 157)';
      for (let k = 1; k < len; k++) {
        const row = head - k;
        if (row < 0) break;
        if (row >= rows) continue;
        ctx.globalAlpha = alpha * Math.pow(1 - k / len, 1.6);
        ctx.fillText(glyphs[i * rows + row]!, x, row * fs);
      }
      // Head: the brightest glyph.
      if (head >= 0 && head < rows) {
        ctx.fillStyle = 'rgb(210, 255, 236)';
        ctx.globalAlpha = Math.min(1, alpha + 0.25);
        ctx.fillText(glyphs[i * rows + head]!, x, head * fs);
      }

      this.heads[i]! += this.speeds[i]! * (boosted ? 2.2 : 1) * (near ? 1.8 : 1);
      if (head - len > rows) this.respawn(i, false);
    }
    ctx.globalAlpha = 1;
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
    // The canvas itself is transparent now: darken the page behind the rain.
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
