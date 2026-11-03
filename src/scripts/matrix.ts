/**
 * Matrix rain engine (canvas). Used by the hero background and by the
 * terminal's `matrix` command (fullscreen overlay).
 */

import { prefersReducedMotion } from './scramble';

const GLYPHS = 'アィウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFZ<>*+=$#@';

/** "r, g, b" of the `--bg` design token (single source of truth: global.css). */
function bgRgb(): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return '7, 11, 9';
  return m.slice(1).map((h) => parseInt(h, 16)).join(', ');
}

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
  private drops: number[] = [];
  private speeds: number[] = [];
  private columns = 0;
  private raf = 0;
  private lastFrame = 0;
  private runningFlag = false;
  private mouseX = -1;
  private boostUntil = 0;
  private readonly fontSize: number;
  private readonly fps: number;
  private readonly trail = bgRgb();
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

  /** Temporarily crank up speed & brightness (terminal easter egg). */
  boost(durationMs = 6000): void {
    this.boostUntil = performance.now() + durationMs;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const { clientWidth, clientHeight } = this.canvas;
    this.canvas.width = Math.floor(clientWidth * dpr);
    this.canvas.height = Math.floor(clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.columns = Math.ceil(clientWidth / this.fontSize);
    this.drops = Array.from({ length: this.columns }, () =>
      Math.floor((Math.random() * clientHeight) / this.fontSize)
    );
    this.speeds = Array.from({ length: this.columns }, () => 0.6 + Math.random() * 0.8);
    this.ctx.font = `${this.fontSize}px 'JetBrains Mono', monospace`;
  }

  /** Draw a single static frame (reduced-motion fallback). */
  drawStatic(): void {
    const h = this.canvas.clientHeight;
    this.ctx.fillStyle = `rgba(0, 255, 157, ${0.1 * this.intensity})`;
    for (let i = 0; i < this.columns; i++) {
      if (Math.random() > 0.6) continue;
      const y = Math.random() * h;
      this.ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!, i * this.fontSize, y);
    }
  }

  private frame = (now: number) => {
    if (!this.runningFlag) return;
    this.raf = requestAnimationFrame(this.frame);

    const interval = 1000 / this.fps;
    if (now - this.lastFrame < interval) return;
    this.lastFrame = now;

    const boosted = now < this.boostUntil;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const alpha = this.intensity * (boosted ? 1.6 : 1);

    // Fading trail, in the page background color so the canvas never shows an edge.
    this.ctx.fillStyle = `rgba(${this.trail}, ${boosted ? 0.12 : 0.18})`;
    this.ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < this.columns; i++) {
      const x = i * this.fontSize;
      const y = this.drops[i]! * this.fontSize;
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

      // Columns near the cursor glow brighter and fall faster.
      const nearMouse = this.mouseX >= 0 && Math.abs(x - this.mouseX) < 90;

      this.ctx.fillStyle = nearMouse
        ? `rgba(200, 255, 230, ${Math.min(0.9, alpha + 0.35)})`
        : `rgba(0, 255, 157, ${Math.min(0.8, alpha * (0.35 + Math.random() * 0.5))})`;
      this.ctx.fillText(glyph, x, y);

      const speed = this.speeds[i]! * (boosted ? 2.2 : 1) * (nearMouse ? 1.8 : 1);
      this.drops[i] = y > h && Math.random() > 0.975 ? 0 : this.drops[i]! + speed;
    }
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
