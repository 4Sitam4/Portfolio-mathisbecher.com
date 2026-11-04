/**
 * Scroll velocity → playback boost for the scroll effects: the faster the
 * visitor goes through the page, the faster blocks are built and destroyed,
 * so nobody waits in front of an empty screen.
 */

const CALM = 400; // px/s — below this, effects run at their normal speed
const RANGE = 600; // px/s for each extra ×1
const MAX_BOOST = 4; // never more than 4× faster
const DECAY_MS = 220; // how fast the boost fades once scrolling slows down

export class ScrollSpeed {
  private velocity = 0; // px/s
  private lastTime = performance.now();
  private lastY = window.scrollY;

  /** Call on every scroll event. */
  sample(): void {
    const now = performance.now();
    const dt = Math.max(8, now - this.lastTime);
    const instant = (Math.abs(window.scrollY - this.lastY) / dt) * 1000;
    // React at once to an acceleration, fade out smoothly afterwards.
    this.velocity = Math.max(instant, this.decayed(now));
    this.lastTime = now;
    this.lastY = window.scrollY;
  }

  /** 1 while calm, up to MAX_BOOST when flying through the page. */
  boost(): number {
    const v = this.decayed(performance.now());
    return Math.min(MAX_BOOST, 1 + Math.max(0, (v - CALM) / RANGE));
  }

  private decayed(now: number): number {
    return this.velocity * Math.exp(-(now - this.lastTime) / DECAY_MS);
  }
}
