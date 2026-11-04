/**
 * A small nano for the terminal: ^O / ^S save, ^X exit (asks to save a
 * modified buffer), ^K cut the current line, ^U paste it. Every shortcut is
 * also a button, for touch screens.
 */

type Lang = 'fr' | 'en';

const STR = {
  fr: {
    modified: 'Modifié',
    wrote: (n: number) => `[ ${n} ligne${n > 1 ? 's' : ''} écrite${n > 1 ? 's' : ''} ]`,
    ask: 'Écrire le tampon modifié ?',
    yes: 'Oui',
    no: 'Non',
    cancel: 'Annuler',
    keys: { save: 'Écrire', exit: 'Quitter', cut: 'Couper', paste: 'Coller' },
    newFile: '[ Nouveau fichier ]',
  },
  en: {
    modified: 'Modified',
    wrote: (n: number) => `[ Wrote ${n} line${n > 1 ? 's' : ''} ]`,
    ask: 'Save modified buffer?',
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    keys: { save: 'Write Out', exit: 'Exit', cut: 'Cut', paste: 'Paste' },
    newFile: '[ New File ]',
  },
} as const;

export interface NanoSession {
  /** shown in the title bar */
  name: string;
  content: string;
  isNew: boolean;
  /** returns an error message, or null when saved */
  save(text: string): string | null;
  /** called once the editor is closed */
  close(): void;
}

export class Nano {
  private readonly s: (typeof STR)[Lang];
  private session: NanoSession | null = null;
  private saved = '';
  private clip = '';
  private asking = false;

  constructor(
    private readonly root: HTMLElement,
    lang: Lang
  ) {
    this.s = STR[lang];
    this.text.addEventListener('input', () => this.refresh());
    this.text.addEventListener('keydown', (e) => this.onKey(e));
    this.root.addEventListener('click', (e) => {
      const action = (e.target as HTMLElement).closest<HTMLElement>('[data-nano]')?.dataset.nano;
      if (action) this.act(action);
    });
    this.renderKeys();
  }

  get isOpen(): boolean {
    return this.session !== null;
  }

  private el<T extends HTMLElement>(sel: string): T {
    return this.root.querySelector(sel) as T;
  }
  private get text(): HTMLTextAreaElement {
    return this.el('.nano__text');
  }

  open(session: NanoSession): void {
    this.session = session;
    this.saved = session.content;
    this.text.value = session.content;
    this.el('.nano__file').textContent = session.name;
    this.status(session.isNew ? this.s.newFile : '');
    this.asking = false;
    this.renderKeys();
    this.root.hidden = false;
    this.refresh();
    // Focus once the key event that opened the editor is over.
    requestAnimationFrame(() => {
      this.text.focus({ preventScroll: true });
      this.text.setSelectionRange(0, 0);
    });
  }

  focus(): void {
    this.text.focus({ preventScroll: true });
  }

  private refresh(): void {
    this.el('.nano__mod').textContent = this.dirty ? this.s.modified : '';
  }

  private get dirty(): boolean {
    return this.text.value !== this.saved;
  }

  private status(msg: string): void {
    this.el('.nano__status').textContent = msg;
  }

  private renderKeys(): void {
    const keys = this.el('.nano__keys');
    keys.replaceChildren();
    const add = (action: string, key: string, label: string) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.nano = action;
      const k = document.createElement('kbd');
      k.textContent = key;
      b.append(k, ` ${label}`);
      keys.append(b);
    };
    if (this.asking) {
      add('yes', 'Y', this.s.yes);
      add('no', 'N', this.s.no);
      add('cancel', '^C', this.s.cancel);
    } else {
      add('save', '^O', this.s.keys.save);
      add('exit', '^X', this.s.keys.exit);
      add('cut', '^K', this.s.keys.cut);
      add('paste', '^U', this.s.keys.paste);
    }
  }

  private onKey(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (this.asking) {
      const map: Record<string, string> = { y: 'yes', o: 'yes', n: 'no', c: 'cancel', escape: 'cancel' };
      const action = e.ctrlKey && key === 'c' ? 'cancel' : map[key];
      if (action) {
        e.preventDefault();
        this.act(action);
      }
      return;
    }
    if (!e.ctrlKey && !e.metaKey) return;
    const map: Record<string, string> = { o: 'save', s: 'save', x: 'exit', k: 'cut', u: 'paste' };
    const action = map[key];
    if (action) {
      e.preventDefault();
      this.act(action);
    }
  }

  private act(action: string): void {
    if (!this.session) return;
    switch (action) {
      case 'save':
        this.write();
        break;
      case 'exit':
        if (this.dirty) {
          this.asking = true;
          this.status(this.s.ask);
          this.renderKeys();
        } else this.close();
        break;
      case 'yes':
        if (this.write()) this.close();
        break;
      case 'no':
        this.close();
        break;
      case 'cancel':
        this.asking = false;
        this.status('');
        this.renderKeys();
        this.focus();
        break;
      case 'cut':
        this.cutLine();
        break;
      case 'paste':
        this.pasteLine();
        break;
    }
  }

  private write(): boolean {
    const error = this.session!.save(this.text.value);
    if (error) {
      this.status(error);
      this.asking = false;
      this.renderKeys();
      return false;
    }
    this.saved = this.text.value;
    this.status(this.s.wrote(this.text.value.split('\n').length));
    this.refresh();
    return true;
  }

  private lineBounds(): [number, number] {
    const v = this.text.value;
    const pos = this.text.selectionStart;
    const start = v.lastIndexOf('\n', pos - 1) + 1;
    const nl = v.indexOf('\n', pos);
    return [start, nl === -1 ? v.length : nl + 1];
  }

  private cutLine(): void {
    const [a, b] = this.lineBounds();
    const v = this.text.value;
    this.clip = v.slice(a, b);
    this.text.value = v.slice(0, a) + v.slice(b);
    this.text.setSelectionRange(a, a);
    this.refresh();
    this.focus();
  }

  private pasteLine(): void {
    if (!this.clip) return;
    const [a] = this.lineBounds();
    const v = this.text.value;
    const piece = this.clip.endsWith('\n') ? this.clip : `${this.clip}\n`;
    this.text.value = v.slice(0, a) + piece + v.slice(a);
    this.text.setSelectionRange(a + piece.length, a + piece.length);
    this.refresh();
    this.focus();
  }

  private close(): void {
    const session = this.session;
    this.session = null;
    this.asking = false;
    this.root.hidden = true;
    session?.close();
  }
}
