/** The "terraform apply" status bar at the bottom of the screen. */

import gsap from 'gsap';
import { h } from './provision-dom';

export const STR = {
  fr: { skip: 'Passer', replay: 'Rejouer', rest: 'défilez pour provisionner la suite', region: 'Construction de la page' },
  en: { skip: 'Skip', replay: 'Replay', rest: 'scroll to provision the rest', region: 'Page build' },
} as const;

export type Lang = keyof typeof STR;

export class StatusBar {
  private el: HTMLElement;
  private msg: HTMLElement;
  private count: HTMLElement;
  private time: HTMLElement;
  private btn: HTMLButtonElement;
  private bar: HTMLElement;
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
    const quiet = (e: HTMLElement) => (e.setAttribute('aria-hidden', 'true'), e);
    const dots = quiet(h('span', 'pv-status__dots', this.el));
    this.dots = [h('i', '', dots), h('i', '', dots), h('i', '', dots)];
    quiet(h('span', 'pv-status__cmd', this.el, 'terraform apply'));
    this.msg = quiet(h('span', 'pv-status__msg', this.el));
    this.count = quiet(h('span', 'pv-status__count num', this.el));
    this.time = quiet(h('span', 'pv-status__time num', this.el));
    this.btn = h('button', 'pv-status__btn', this.el, s.skip);
    this.btn.type = 'button';
    this.btn.addEventListener('click', onButton);
    this.bar = quiet(h('span', 'pv-status__progress', this.el));
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
    const ratio = total ? done / total : 0;
    const lit = Math.ceil(ratio * 3);
    this.dots.forEach((d, i) => d.classList.toggle('is-on', i < lit));
    gsap.to(this.bar, { scaleX: ratio, duration: 0.3, ease: 'power2.out' });
    this.el.classList.toggle('is-complete', done === total);
  }

  setMode(mode: 'skip' | 'replay'): void {
    this.mode = mode;
    this.btn.textContent = mode === 'skip' ? this.s.skip : this.s.replay;
  }
}
