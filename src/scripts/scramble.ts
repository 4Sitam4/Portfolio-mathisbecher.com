/**
 * Text "decrypt" effect: characters cycle through a glyph pool then lock in
 * left-to-right, matrix style. Layout-stable (final string length preserved).
 */

const GLYPHS =
  'アィウェオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/\\|=+*#@$%&';

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ScrambleOptions {
  /** total duration in ms */
  duration?: number;
  /** called when the animation finishes */
  onComplete?: () => void;
}

const running = new WeakMap<HTMLElement, number>();

export function scramble(el: HTMLElement, options: ScrambleOptions = {}): void {
  const target = el.dataset.decryptText ?? el.textContent ?? '';
  el.dataset.decryptText = target;

  if (prefersReducedMotion() || target.length === 0) {
    el.textContent = target;
    options.onComplete?.();
    return;
  }

  // 25 % faster than the original 300 ms + 55 ms per char, capped at 1.6 s.
  const duration = options.duration ?? Math.min(240 + target.length * 44, 1280);
  const prev = running.get(el);
  if (prev) cancelAnimationFrame(prev);

  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const lockedCount = Math.floor(progress * target.length);

    let out = target.slice(0, lockedCount);
    for (let i = lockedCount; i < target.length; i++) {
      out += target[i] === ' ' ? ' ' : randomGlyph();
    }
    el.textContent = out;

    if (progress < 1) {
      running.set(el, requestAnimationFrame(tick));
    } else {
      running.delete(el);
      options.onComplete?.();
    }
  };

  running.set(el, requestAnimationFrame(tick));
}

/** Observe all `[data-decrypt]` elements and scramble them on first viewport entry. */
export function initDecryptObserver(root: ParentNode = document): void {
  const els = root.querySelectorAll<HTMLElement>('[data-decrypt]');
  if (els.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          scramble(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.4 }
  );

  els.forEach((el) => {
    // Snapshot the final text before any animation touches it.
    el.dataset.decryptText = el.textContent ?? '';
    observer.observe(el);
  });
}
