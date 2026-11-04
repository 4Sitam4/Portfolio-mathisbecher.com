/**
 * "terraform apply / destroy" — the page builds itself, and keeps doing it
 * as you scroll.
 *
 * Every element marked `data-provision="<resource>"` is a resource with a
 * state (data-pv): pending → building → done → destroying → pending…
 *  - apply: a squad of cursor agents drags a selection frame around it
 *    (resource name, dimensions, guides), then a scan line reveals it;
 *  - destroy: when it leaves the active zone of the screen, a red frame
 *    ("Destroying...") appears and a red scan line erases it.
 * The intro builds what is on screen when the boot sequence ends, then a
 * full-screen sweep marks "Apply complete". The side nav is built when it
 * opens and destroyed when it closes (applyNav / destroyNav).
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
  NAV_SPEED,
  SPEED,
  sweep,
  trail,
} from './provision-dom';
import { ScrollSpeed } from './scroll-speed';

type State = 'pending' | 'building' | 'done' | 'destroying';

/**
 * The active zone, with hysteresis so a resource sitting on the edge never
 * flips back and forth: it is built once it is 12 % inside the viewport,
 * and destroyed only once it is out past the 6 % line. Changing state
 * takes a real scroll of ~6 % of the screen height.
 */
const ENTER_MARGIN = 0.12;
const LEAVE_MARGIN = 0.06;

/* --- timing (seconds) ----------------------------------------------------- */
const T_REACH = 0.35; // agent flies to the top-left corner
const T_DRAG = 0.35; // agent drags the selection to the bottom-right corner
const T_FILL = 0.45; // scan line reveals the element
const T_HOLD = 0.3; // frame stays a moment after the fill
const T_OUT = 0.4; // frame and guides fade out
const T_ERASE = 0.45; // destroy: scan line erases the element
const T_GLITCH = 0.32; // .pv-glitch length at speed 1 (it also animates clip-path)
const AGENT_BUSY = T_REACH + T_DRAG + 0.05;

interface RunOptions {
  stagger: number;
  from: 'bottom' | 'left';
  intro: boolean;
  /** drawn in viewport coordinates, above the nav (the nav's own resources) */
  fixed?: boolean;
}

const stateOf = (el: HTMLElement): State => (el.dataset.pv as State | undefined) ?? 'done';
const setState = (el: HTMLElement, s: State): void => void (el.dataset.pv = s);

/** The fixed side nav follows its own open/close cycle, not the scroll. */
const pinned = (el: HTMLElement): boolean => el.closest('.nav') !== null;

/**
 * Where a resource sits relative to the zone, from its bounding box.
 * getBoundingClientRect() ignores the element's own clip-path, so the
 * reveal/erase/glitch clipping can never make it look like it left the
 * zone (IntersectionObserver does take it into account, and also ignores
 * rootMargin inside cross-origin iframes such as VS Code's browser —
 * both made edge resources loop between destroy and restore).
 */
function where(el: HTMLElement): { enter: boolean; inside: boolean; visible: boolean } {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const inBand = (m: number) => r.bottom > vh * m && r.top < vh * (1 - m);
  return { enter: inBand(ENTER_MARGIN), inside: inBand(LEAVE_MARGIN), visible: inBand(0) };
}

/** Inside the enter zone now. */
const inZoneNow = (el: HTMLElement): boolean => where(el).enter;

export class Provisioner {
  private readonly targets: HTMLElement[];
  private readonly running = new Set<gsap.core.Timeline>();
  private readonly destroying = new Map<HTMLElement, { tl: gsap.core.Timeline; layer: HTMLElement; done: () => void }>();
  /** Whether each resource is still within the leave line (true once it entered). */
  private readonly zone = new Map<HTMLElement, boolean>();
  private queue: HTMLElement[] = [];
  private flushTimer = 0;
  private intro: gsap.core.Timeline | null = null;
  private introCleanup: (() => void) | null = null;
  private observing = false;
  /** Scroll velocity, which speeds up the scroll effects. */
  private readonly speed = new ScrollSpeed();
  /** Builds and destroys driven by the scroll, sped up live with it. */
  private readonly scrollRuns = new Set<gsap.core.Timeline>();

  constructor() {
    this.targets = [...document.querySelectorAll<HTMLElement>('[data-provision]')];
  }

  /** True while something is drawing — the ambient loop waits for it. */
  get busy(): boolean {
    return this.running.size > 0 || this.destroying.size > 0;
  }

  /** Hide every resource until it is built. */
  arm(): void {
    for (const el of this.targets) {
      this.cancelDestroy(el);
      setState(el, 'pending');
    }
  }

  /** Show everything immediately (boot skipped); scrolling still applies/destroys. */
  revealAll(): void {
    for (const el of this.targets) setState(el, pinned(el) ? 'pending' : 'done');
    this.observe();
  }

  /** Build what is in the active zone now; from then on, follow the scroll. */
  start(): void {
    this.runIntro(this.targets.filter((el) => stateOf(el) === 'pending' && !pinned(el) && inZoneNow(el)));
    this.observe();
  }

  replay(): void {
    this.running.forEach((tl) => tl.progress(1));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    this.arm();
    requestAnimationFrame(() => this.start());
  }

  skip(): void {
    this.intro?.progress(1);
  }

  /* --- side nav ------------------------------------------------------------ */

  private navRun: gsap.core.Timeline | null = null;
  private readonly navTargets = () => this.targets.filter(pinned);

  /** The nav has opened: build its items (or restore those being destroyed). */
  applyNav(): void {
    const build: HTMLElement[] = [];
    for (const el of this.navTargets()) {
      this.zone.set(el, true);
      const s = stateOf(el);
      if (s === 'destroying') {
        this.cancelDestroy(el);
        setState(el, 'done');
      } else if (s === 'pending') {
        build.push(el);
      }
    }
    if (build.length) this.navRun = this.run(build, { stagger: 0.05, from: 'left', intro: false, fixed: true });
  }

  /** The nav is closing: destroy its items; resolves once they are gone. */
  destroyNav(): Promise<void> {
    const els = this.navTargets();
    for (const el of els) this.zone.set(el, false);
    // Items still being built finish at once, then go down with the others.
    this.navRun?.progress(1);
    this.navRun = null;
    return Promise.all(els.filter((el) => stateOf(el) === 'done').map((el) => this.destroy(el))).then(() => undefined);
  }

  /* --- scroll ------------------------------------------------------------- */

  private observe(): void {
    if (this.observing) return;
    this.observing = true;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.track();
      });
    };
    window.addEventListener(
      'scroll',
      () => {
        this.speed.sample();
        schedule();
      },
      { passive: true }
    );
    window.addEventListener('resize', schedule);
    // Layout can move without scrolling (nav push, terminal output, fonts).
    new ResizeObserver(schedule).observe(document.body);
    // Keyboard focus must never land on something invisible: show it at once.
    document.addEventListener('focusin', (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-provision]');
      if (!el || stateOf(el) === 'done') return;
      this.cancelDestroy(el);
      this.zone.set(el, true);
      setState(el, 'done');
    });
    this.track();
  }

  /** Compare every resource with the zone and react to the changes (hysteresis). */
  private track(): void {
    // Read every position first, then react: interleaving reads with the DOM
    // writes of a destroy/apply would force a layout per resource.
    const seen = this.targets.filter((el) => !pinned(el)).map((el) => [el, where(el)] as const);
    for (const [el, w] of seen) {
      // The block holding the keyboard focus stays up, wherever it is.
      if (stateOf(el) === 'done' && el.matches(':focus-within')) {
        this.zone.set(el, true);
        continue;
      }
      const was = this.zone.get(el);
      if (w.enter && was !== true) {
        this.zone.set(el, true);
        this.onEnter(el);
      } else if (!w.inside && was !== false) {
        this.zone.set(el, false);
        this.onLeave(el);
      }
      // Fully off screen without a visible exit: reset quietly.
      if (!w.visible && stateOf(el) === 'done' && this.zone.get(el) === false) setState(el, 'pending');
    }
    // Effects already running catch up with a faster scroll (never slow down mid-way).
    const target = SPEED * this.speed.boost();
    for (const tl of this.scrollRuns) if (tl.timeScale() < target) tl.timeScale(target);
  }

  private onEnter(el: HTMLElement): void {
    const s = stateOf(el);
    if (s === 'destroying') {
      // Back before it was gone: restore it as it is.
      this.cancelDestroy(el);
      setState(el, 'done');
    } else if (s === 'pending') {
      this.enqueue(el);
    }
  }

  private onLeave(el: HTMLElement): void {
    // A resource still being built is checked again once it is up; one that
    // holds the keyboard focus stays.
    if (stateOf(el) === 'done' && !el.matches(':focus-within')) this.destroy(el);
  }

  private enqueue(el: HTMLElement): void {
    this.queue.push(el);
    // Elements entering together are built by one squad.
    clearTimeout(this.flushTimer);
    this.flushTimer = window.setTimeout(() => {
      const batch = [...new Set(this.queue)].filter((t) => stateOf(t) === 'pending' && this.zone.get(t));
      this.queue = [];
      if (batch.length) this.run(batch, { stagger: 0.12, from: 'left', intro: false });
    }, this.speed.boost() > 1.5 ? 0 : 60);
  }

  /* --- apply -------------------------------------------------------------- */

  /**
   * A build that has started always finishes and the resource stays up: it
   * is only destroyed on a later exit. If it ended up completely off screen
   * meanwhile, it is quietly reset so it builds again when it comes back.
   */
  private complete(el: HTMLElement, animate: boolean): void {
    setState(el, 'done');
    if (animate) el.querySelectorAll<HTMLElement>('[data-decrypt]').forEach((d) => scramble(d));
    if (!pinned(el) && this.zone.get(el) === false && !inViewport(el)) setState(el, 'pending');
  }

  private runIntro(targets: HTMLElement[]): void {
    window.dispatchEvent(new CustomEvent('matrix:boost', { detail: 4500 }));
    this.intro = this.run(targets, { stagger: 0.14, from: 'bottom', intro: true });

    // Only a deliberate gesture skips the show: Escape.
    const skipKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.skip();
    };
    window.addEventListener('keydown', skipKeys);
    this.introCleanup = () => {
      this.intro = null;
      window.removeEventListener('keydown', skipKeys);
    };
  }

  private run(list: HTMLElement[], o: RunOptions): gsap.core.Timeline {
    const layer = createLayer(o.intro || o.fixed, o.fixed);
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        this.running.delete(tl);
        this.scrollRuns.delete(tl);
        if (o.intro) {
          this.introCleanup?.();
          this.introCleanup = null;
          sweep(); // "Apply complete!"
        }
      },
    });
    this.running.add(tl);
    // The nav is drawn light: no agents, no guides, no dimensions, no glitch.
    const lite = Boolean(o.fixed);
    if (!lite && !o.intro) this.scrollRuns.add(tl);
    tl.timeScale(lite ? NAV_SPEED : o.intro ? SPEED : SPEED * this.speed.boost());

    // Hidden or collapsed resources (e.g. the closed mobile menu) are done at once.
    const visible = list.filter((el) => {
      if (isVisible(el)) return true;
      this.complete(el, false);
      return false;
    });
    visible.forEach((el) => setState(el, 'building'));

    const squad = lite ? 0 : Math.max(1, Math.min(visible.length, Math.ceil(AGENT_BUSY / o.stagger) + 1));
    const agents = Array.from({ length: squad }, (_, i) => createAgent(layer, i));
    const trails = agents.map((a) => trail(a, layer));
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sy = o.fixed ? 0 : window.scrollY;
    agents.forEach((a, i) =>
      gsap.set(
        a,
        o.from === 'bottom'
          ? { x: vw / 2 + (i - squad / 2) * 18, y: sy + vh - 48 }
          : { x: -24, y: sy + vh * (0.25 + 0.5 * Math.random()) }
      )
    );

    visible.forEach((el, i) => {
      const box = boxOf(el, o.fixed);
      const name = el.dataset.provision ?? 'resource';
      const { frame, sel, marks, guides } = createFrame(layer, box, `module.${name}`, '', { guides: !lite, dims: !lite });
      const scan = createScan(layer, box);
      const t0 = i * o.stagger;
      // Light style: the frame opens on its own, at once.
      const tDrag = lite ? t0 : t0 + T_REACH;
      const tFill = lite ? tDrag + T_DRAG * 0.6 : tDrag + T_DRAG;
      const a = squad ? i % squad : -1;
      const agent = agents[a];
      const onUpdate = trails[a];

      if (agent) tl.to(agent, { x: box.x, y: box.y, duration: T_REACH, ease: 'power3.inOut', onUpdate }, t0);
      // The selection is dragged open by the agent.
      tl.set(frame, { opacity: 1 }, tDrag);
      tl.fromTo(
        sel,
        { clipPath: 'inset(0% 100% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: lite ? T_DRAG * 0.6 : T_DRAG, ease: 'power2.inOut' },
        tDrag
      );
      if (agent) tl.to(agent, { x: box.x + box.w, y: box.y + box.h, duration: T_DRAG, ease: 'power2.inOut', onUpdate }, tDrag);
      tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.02 }, tDrag + T_DRAG * 0.6);
      const [gx, gy] = guides;
      if (gx) tl.fromTo(gx, { opacity: 0.9, scaleX: 0 }, { scaleX: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);
      if (gy) tl.fromTo(gy, { opacity: 0.9, scaleY: 0 }, { scaleY: 1, duration: T_DRAG, ease: 'power2.out', immediateRender: false }, tDrag);

      // The resource comes up under a scan line, then flickers into place.
      tl.call(() => this.complete(el, true), [], tFill);
      tl.fromTo(
        el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: T_FILL, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        tFill
      );
      tl.fromTo(scan, { opacity: 1, y: 0 }, { y: box.h, duration: T_FILL, ease: 'power2.inOut', immediateRender: false }, tFill);
      tl.to(scan, { opacity: 0, duration: 0.15 }, tFill + T_FILL);
      if (!lite) tl.call(() => glitch(el, tl.timeScale()), [], tFill + T_FILL);
      tl.to([frame, ...guides], { opacity: 0, duration: T_OUT, ease: 'power1.in' }, tFill + T_FILL + (lite ? 0.1 : T_HOLD));
    });

    // The squad leaves once its last resource is up.
    const end = (visible.length - 1) * o.stagger + T_REACH + T_DRAG + 0.2;
    if (agents.length) tl.to(agents, { opacity: 0, duration: 0.3, stagger: 0.03 }, Math.max(0, end));
    return tl;
  }

  /* --- destroy ------------------------------------------------------------ */

  /** Resolves once the resource is gone (or restored by cancelDestroy). */
  private destroy(el: HTMLElement): Promise<void> {
    // Already off screen: nothing to show, just reset it.
    if (!inViewport(el) || !isVisible(el)) {
      setState(el, 'pending');
      return Promise.resolve();
    }
    setState(el, 'destroying');
    const fixed = pinned(el);
    const layer = createLayer(fixed, fixed);
    const box = boxOf(el, fixed);
    const lite = fixed; // the nav: no dimensions, no glitch
    const { frame, marks } = createFrame(layer, box, `module.${el.dataset.provision}: Destroying...`, 'pv-frame--destroy', {
      guides: false,
      dims: !lite,
    });
    const scan = createScan(layer, box);
    scan.classList.add('pv-scan--destroy');
    const speed = lite ? NAV_SPEED : SPEED * this.speed.boost();
    if (!lite) glitch(el, speed);
    const tErase = lite ? 0.05 : T_GLITCH;

    let done!: () => void;
    const gone = new Promise<void>((resolve) => (done = resolve));
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        this.destroying.delete(el);
        this.scrollRuns.delete(tl);
        gsap.set(el, { clearProps: 'clipPath' });
        setState(el, 'pending');
        done();
      },
    });
    tl.timeScale(speed);
    if (!lite) this.scrollRuns.add(tl);
    tl.set(frame, { opacity: 1 });
    tl.fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0);
    tl.fromTo(el, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: T_ERASE, ease: 'power2.in' }, tErase);
    tl.fromTo(scan, { opacity: 1, y: 0 }, { y: box.h, duration: T_ERASE, ease: 'power2.in', immediateRender: false }, tErase);
    tl.to([frame, scan], { opacity: 0, duration: 0.25 }, tErase + T_ERASE);
    this.destroying.set(el, { tl, layer, done });
    return gone;
  }

  private cancelDestroy(el: HTMLElement): void {
    const d = this.destroying.get(el);
    if (!d) return;
    d.tl.kill();
    d.layer.remove();
    this.destroying.delete(el);
    this.scrollRuns.delete(d.tl);
    gsap.set(el, { clearProps: 'clipPath' });
    d.done();
  }
}
