/**
 * "terraform apply" — the page provisions itself, on every visit.
 *
 * Every element marked `data-provision="<resource>"` is a resource. While it is
 * pending it is invisible; a squad of cursor agents drags a selection frame
 * around it (resource name, dimensions, guides), then a scan line reveals it.
 * The first run covers what is on screen when the boot sequence ends; the rest
 * is provisioned as it scrolls into view. A status bar mirrors terraform output.
 */

import gsap from 'gsap';
import { scramble } from './scramble';
import {
  boxOf,
  createAgent,
  createFrame,
  createLayer,
  createScan,
  glitch,
  inViewport,
  isVisible,
  sweep,
  trail,
} from './provision-dom';
import { STR, StatusBar, type Lang } from './provision-status';

/* --- timing (seconds) ----------------------------------------------------- */
const T_REACH = 0.35; // agent flies to the top-left corner
const T_DRAG = 0.35; // agent drags the selection to the bottom-right corner
const T_FILL = 0.45; // scan line reveals the element
const T_HOLD = 0.3; // frame stays a moment after the fill
const T_OUT = 0.4; // frame and guides fade out
const AGENT_BUSY = T_REACH + T_DRAG + 0.05;

interface RunOptions {
  stagger: number;
  from: 'bar' | 'left';
  intro: boolean;
}

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
  private introCleanup: (() => void) | null = null;
  private swept = false;

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

  /** True while a build is drawing — the ambient loop waits for it. */
  get busy(): boolean {
    return this.running.size > 0;
  }

  /** Hide every resource until it is built. */
  arm(): void {
    this.done.clear();
    this.swept = false;
    for (const el of this.targets) el.dataset.pv = 'pending';
  }

  /** Show everything immediately, without animation (skip at boot, fallback). */
  revealAll(): void {
    this.observer.disconnect();
    for (const el of this.targets) this.complete(el, false);
  }

  /** Build what is on screen now, then the rest as it scrolls into view. */
  start(): void {
    const now = this.targets.filter((el) => !this.done.has(el) && inViewport(el));
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
    window.dispatchEvent(new CustomEvent('matrix:boost', { detail: 4500 }));
    this.bar.setMode('skip');
    this.intro = this.run(targets, { stagger: 0.14, from: 'bar', intro: true });

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

  private finishRun(intro: boolean): void {
    const n = this.done.size;
    this.bar.setMode('replay');
    if (n === this.total) {
      this.bar.update(`Apply complete! Resources: ${n} added, 0 changed, 0 destroyed.`, n, this.total);
      this.bar.hideAfter(6000);
      if (!this.swept) {
        this.swept = true;
        sweep();
      }
    } else {
      if (intro) this.bar.update(`${n} created — ${this.s.rest}`, n, this.total);
      this.bar.hideAfter(intro ? 4500 : 2200);
    }
  }

  private run(list: HTMLElement[], o: RunOptions): gsap.core.Timeline {
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
    const trails = agents.map((a) => trail(a, layer));
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
      const box = boxOf(el);
      const name = el.dataset.provision ?? 'resource';
      const { frame, sel, marks, gx, gy } = createFrame(layer, box, `module.${name}`);
      const scan = createScan(layer, box);
      const a = i % squad;
      const agent = agents[a]!;
      const onUpdate = trails[a]!;
      const t0 = i * o.stagger;
      const tDrag = t0 + T_REACH;
      const tFill = tDrag + T_DRAG;

      tl.to(agent, { x: box.x, y: box.y, duration: T_REACH, ease: 'power3.inOut', onUpdate }, t0);
      tl.call(() => this.bar.update(`module.${name}: Creating...`, this.done.size, this.total, elapsed()), [], tDrag);
      // The selection is dragged open by the agent.
      tl.set(frame, { opacity: 1 }, tDrag);
      tl.fromTo(
        sel,
        { clipPath: 'inset(0% 100% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: T_DRAG, ease: 'power2.inOut' },
        tDrag
      );
      tl.to(agent, { x: box.x + box.w, y: box.y + box.h, duration: T_DRAG, ease: 'power2.inOut', onUpdate }, tDrag);
      tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.02 }, tDrag + T_DRAG * 0.6);
      tl.fromTo(gx, { opacity: 0.9, scaleX: 0 }, { scaleX: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);
      tl.fromTo(gy, { opacity: 0.9, scaleY: 0 }, { scaleY: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);

      // The resource comes up under a scan line, then flickers into place.
      tl.call(
        () => {
          this.complete(el, true);
          this.bar.update(`module.${name}: Creation complete`, this.done.size, this.total, elapsed());
        },
        [],
        tFill
      );
      tl.fromTo(
        el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: T_FILL, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        tFill
      );
      tl.fromTo(scan, { opacity: 1, y: 0 }, { y: box.h, duration: T_FILL, ease: 'power2.inOut', immediateRender: false }, tFill);
      tl.to(scan, { opacity: 0, duration: 0.15 }, tFill + T_FILL);
      tl.call(() => glitch(el), [], tFill + T_FILL);
      tl.to([frame, gx, gy], { opacity: 0, duration: T_OUT, ease: 'power1.in' }, tFill + T_FILL + T_HOLD);
    });

    // The squad leaves once its last resource is up.
    const end = (visible.length - 1) * o.stagger + T_REACH + T_DRAG + 0.2;
    tl.to(agents, { opacity: 0, duration: 0.3, stagger: 0.03 }, Math.max(0, end));
    return tl;
  }
}
