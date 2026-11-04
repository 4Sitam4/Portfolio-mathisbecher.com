/**
 * Interactive terminal: a small shell over a virtual file system (term/vfs),
 * with tab completion (term/complete), a nano editor (term/nano) and a few
 * easter eggs (term/eggs). The visitor's files stay in their own browser.
 * All output goes through textContent — input is never parsed as HTML.
 */

import { fullscreenMatrixBurst } from './matrix';
import { complete } from './term/complete';
import { seed } from './term/content';
import { easterEggs } from './term/eggs';
import type { Command, Io, Lang, Line } from './term/io';
import { Nano } from './term/nano';
import { tokenize } from './term/parse';
import { HELP_ALL, NEOFETCH_LOGO, STR } from './term/strings';
import { FsError, HOME, VFS } from './term/vfs';

const HISTORY_KEY = 'mb-term-history';

export function initTerminal(): void {
  const output = document.getElementById('term-out');
  const input = document.getElementById('term-input') as HTMLInputElement | null;
  const body = document.getElementById('term-body');
  const windowEl = document.getElementById('term');
  const cwdLabel = document.getElementById('term-cwd');
  const nanoEl = document.getElementById('nano');
  if (!output || !input || !body || !windowEl || !nanoEl) return;

  const lang: Lang = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  const s = STR[lang];
  const fs = new VFS(seed(lang));
  const nano = new Nano(nanoEl, lang);
  let previousDir = HOME;
  let lastTab = '';

  let history: string[] = [];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    if (Array.isArray(saved)) history = saved.filter((h): h is string => typeof h === 'string').slice(-50);
  } catch {}
  let historyIndex = history.length;

  /* --- output ----------------------------------------------------------------- */

  const render = (line: Line): HTMLElement => {
    const el = document.createElement('div');
    const { text, cls } = typeof line === 'string' ? { text: line, cls: undefined } : line;
    el.textContent = text || ' ';
    if (cls) el.className = `term-line--${cls}`;
    return el;
  };
  const print = (lines: Line | Line[]): void => {
    for (const line of Array.isArray(lines) ? lines : [lines]) output.appendChild(render(line));
    body.scrollTop = body.scrollHeight;
  };
  const screen: Io = {
    lang,
    out: print,
    live: () => {
      const el = render('');
      output.appendChild(el);
      body.scrollTop = body.scrollHeight;
      return el;
    },
  };
  const prompt = (): string => `visitor@mathisbecher:${fs.display(fs.cwd)}$`;
  const title = windowEl.querySelector('.window__title');
  const updatePrompt = (): void => {
    const where = fs.display(fs.cwd);
    if (cwdLabel) cwdLabel.textContent = `:${where}$`;
    if (title) title.textContent = `visitor@mathisbecher.com: ${where}`;
  };
  const fail = (io: Io, cmd: string, e: unknown): void => {
    if (e instanceof FsError) io.out({ text: `${cmd}: ${fs.display(e.path)}: ${s.errors[e.code]}`, cls: 'error' });
    else throw e;
  };
  /** Run fn for each path, printing file-system errors like a real shell. */
  const each = (io: Io, cmd: string, paths: string[], fn: (abs: string, raw: string) => void): void => {
    for (const raw of paths) {
      try {
        fn(fs.resolve(raw), raw);
      } catch (e) {
        fail(io, cmd, e);
      }
    }
  };
  const flags = (args: string[]) => ({
    opts: args.filter((a) => a.startsWith('-') && a.length > 1).join(''),
    rest: args.filter((a) => !a.startsWith('-') || a === '-'),
  });

  /* --- commands ---------------------------------------------------------------- */

  const commands: Record<string, Command> = {
    ...easterEggs,
    help: (args, io) => {
      if (!args.some((a) => a === '-a' || a === '--all')) return io.out([...s.help]);
      const groups = HELP_ALL[lang];
      const width = Math.max(...groups.flatMap((g) => g.items.map(([c]) => c.length))) + 2;
      for (const g of groups) {
        io.out({ text: g.title, cls: 'accent' });
        io.out(g.items.map(([c, d]) => `  ${c.padEnd(width)}${d}`));
      }
      // Safety net: a command added later without a description still shows up.
      const described = new Set(groups.flatMap((g) => g.items.flatMap(([c]) => c.split(/[\s·]+/))));
      const missing = names.filter((n) => !described.has(n));
      if (missing.length) io.out([{ text: lang === 'fr' ? 'autres' : 'other', cls: 'accent' }, `  ${missing.join('  ')}`]);
    },
    whoami: (_, io) => io.out([...s.whoami]),

    ls: (args, io) => {
      const { opts, rest } = flags(args);
      const targets = rest.length ? rest : ['.'];
      each(io, 'ls', targets, (abs, raw) => {
        const entries = fs.list(abs, opts.includes('a'));
        if (targets.length > 1) io.out({ text: `${raw}:`, cls: 'dim' });
        io.out(entries.map((e) => (e.dir ? `${e.name}/` : e.name)).join('  ') || ' ');
      });
    },
    cd: (args, io) => {
      const raw = args[0] === '-' ? previousDir : (args[0] ?? HOME);
      try {
        const abs = fs.resolve(raw);
        if (!fs.get(abs)) throw new FsError('ENOENT', abs);
        if (!fs.isDir(abs)) throw new FsError('ENOTDIR', abs);
        previousDir = fs.cwd;
        fs.cwd = abs;
        updatePrompt();
      } catch (e) {
        fail(io, 'cd', e);
      }
    },
    pwd: (_, io) => io.out(fs.cwd),
    cat: (args, io) => {
      if (!args.length) return io.out({ text: s.usage(lang === 'fr' ? 'cat <fichier>' : 'cat <file>'), cls: 'dim' });
      // Like a real cat: a final newline does not show up as an extra empty line.
      each(io, 'cat', args, (abs) => io.out(fs.read(abs).replace(/\n$/, '').split('\n')));
    },
    tree: (args, io) => {
      const { opts, rest } = flags(args);
      each(io, 'tree', [rest[0] ?? '.'], (abs) => io.out(fs.tree(abs, opts.includes('a'))));
    },
    mkdir: (args, io) => {
      const { opts, rest } = flags(args);
      if (!rest.length) return io.out({ text: s.usage('mkdir [-p] <dir>'), cls: 'dim' });
      each(io, 'mkdir', rest, (abs) => fs.mkdir(abs, opts.includes('p')));
    },
    touch: (args, io) => {
      if (!args.length) return io.out({ text: s.usage('touch <file>'), cls: 'dim' });
      each(io, 'touch', args, (abs) => {
        if (!fs.get(abs)) fs.write(abs, '');
      });
    },
    rm: (args, io) => {
      const { opts, rest } = flags(args);
      if (!rest.length) return io.out({ text: s.usage('rm [-r] <path>'), cls: 'dim' });
      // The classic: refuse to wipe everything, with style.
      if (rest.some((p) => ['/', '~', '*', '/*', HOME].includes(p) || fs.resolve(p) === '/' || fs.resolve(p) === HOME)) {
        return io.out([...s.rmrf]);
      }
      each(io, 'rm', rest, (abs) => fs.rm(abs, opts.includes('r') || opts.includes('R')));
    },
    mv: (args, io) => {
      const [src, dst] = flags(args).rest;
      if (!src || !dst) return io.out({ text: s.usage('mv <src> <dest>'), cls: 'dim' });
      try {
        fs.move(fs.resolve(src), fs.resolve(dst));
      } catch (e) {
        fail(io, 'mv', e);
      }
    },
    cp: (args, io) => {
      const { opts, rest } = flags(args);
      const [src, dst] = rest;
      if (!src || !dst) return io.out({ text: s.usage('cp [-r] <src> <dest>'), cls: 'dim' });
      try {
        const from = fs.resolve(src);
        if (fs.isDir(from) && !opts.includes('r')) throw new FsError('EISDIR', from);
        fs.copy(from, fs.resolve(dst));
      } catch (e) {
        fail(io, 'cp', e);
      }
    },
    echo: (args, io) => io.out(args.join(' ')),
    nano: (args, io) => {
      if (!args[0]) return io.out({ text: s.usage('nano <file>'), cls: 'dim' });
      const abs = fs.resolve(args[0]);
      const node = fs.get(abs);
      if (node?.type === 'dir') return fail(io, 'nano', new FsError('EISDIR', abs));
      nano.open({
        name: fs.display(abs),
        content: node?.type === 'file' ? node.content : '',
        isNew: !node,
        save: (text) => {
          try {
            fs.write(abs, text);
            return null;
          } catch (e) {
            return e instanceof FsError ? `[ ${fs.display(e.path)} : ${s.errors[e.code]} ]` : String(e);
          }
        },
        close: () => {
          input.focus({ preventScroll: true });
          body.scrollTop = body.scrollHeight;
        },
      });
    },
    reset: (_, io) => {
      fs.reset();
      previousDir = HOME;
      updatePrompt();
      io.out({ text: s.reset, cls: 'accent' });
    },

    neofetch: (_, io) => {
      io.out(NEOFETCH_LOGO.split('\n').map((text) => ({ text, cls: 'art' as const })));
      io.out([
        'visitor@mathisbecher.com',
        '─────────────────────────',
        'OS:       Homelab Linux x86_64',
        'Host:     Proxmox VE cluster',
        'Storage:  TrueNAS Scale',
        'Network:  10 Gbps',
        'Shell:    astro 7 / gsap 3',
        `Uptime:   ${s.uptime}`,
      ]);
    },
    projects: (_, io) => {
      io.out({ text: '~/projects', cls: 'dim' });
      io.out(fs.list(`${HOME}/projects`).map((e) => `  ${e.name}`));
      io.out({ text: lang === 'fr' ? "→ cd projects, puis cat <fichier>" : '→ cd projects, then cat <file>', cls: 'dim' });
    },
    contact: (_, io) => each(io, 'cat', [`${HOME}/contact.txt`], (abs) => io.out(fs.read(abs).split('\n'))),
    history: (_, io) => io.out(history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`)),
    date: (_, io) => io.out(new Date().toString()),
    uname: (args, io) => io.out(args.includes('-a') ? 'Linux mathisbecher 6.8.12-pve #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' : 'Linux'),
    uptime: (_, io) => io.out(s.uptime),
    lang: (_, io) => {
      io.out({ text: s.langSwitch, cls: 'accent' });
      window.setTimeout(() => (window.location.href = lang === 'fr' ? '/en/' : '/'), 600);
    },
    matrix: (_, io) => {
      io.out({ text: s.matrix, cls: 'accent' });
      window.dispatchEvent(new CustomEvent('matrix:boost'));
      fullscreenMatrixBurst();
    },
    terraform: (args, io) => {
      if (args[0] === 'destroy') return io.out([...s.destroy]);
      if (args[0] === 'plan') return io.out('Plan: 0 to add, 1 to change, 0 to destroy. (portfolio.tf — this page)');
      if (args[0] !== 'apply') return io.out({ text: s.usage('terraform apply | plan | destroy'), cls: 'dim' });
      io.out([
        { text: 'Acquiring state lock. This may take a few moments...', cls: 'dim' },
        { text: 'Plan: page rebuild — scrolling to the top.', cls: 'accent' },
      ]);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('provision:replay')), 700);
    },
    reboot: (_, io) => {
      io.out({ text: s.reboot, cls: 'accent' });
      window.setTimeout(() => location.reload(), 900);
    },
    sudo: (args, io) => {
      if (args.join(' ') === 'make me a sandwich') return io.out(lang === 'fr' ? "D'accord." : 'Okay.');
      if (args[0] === 'rm') return io.out([...s.rmrf]);
      io.out({ text: s.sudo, cls: 'error' });
    },
    clear: () => {
      output.replaceChildren();
    },
    exit: (_, io) => {
      io.out({ text: s.exit, cls: 'dim' });
      input.blur();
    },
  };

  const names = Object.keys(commands).filter((c) => !c.startsWith(':')).sort();

  /* --- running a line ------------------------------------------------------------- */

  const run = async (raw: string): Promise<void> => {
    let line = raw.trim();
    print({ text: `${prompt()} ${line}`, cls: 'dim' });
    if (!line) return;
    if (line.includes('!!')) {
      const last = history[history.length - 1];
      if (!last) return print({ text: '!!: event not found', cls: 'error' });
      line = line.replaceAll('!!', last);
      print({ text: line, cls: 'dim' });
    }
    if (history[history.length - 1] !== line) history.push(line);
    history = history.slice(-50);
    historyIndex = history.length;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}

    let words = tokenize(line);
    // Redirection: cmd … > file  /  cmd … >> file
    let redirect: { path: string; append: boolean } | null = null;
    const r = words.findIndex((w) => w === '>' || w === '>>');
    if (r !== -1) {
      const target = words[r + 1];
      if (!target) return print({ text: 'syntax error near unexpected token `newline\'', cls: 'error' });
      redirect = { path: target, append: words[r] === '>>' };
      words = words.slice(0, r);
    }

    const [name = '', ...args] = words;
    const cmd = commands[name] ?? commands[name.toLowerCase()];
    if (!cmd) return print({ text: s.notFound(name), cls: 'error' });

    if (!redirect) {
      await cmd(args, screen);
      return;
    }
    const captured: string[] = [];
    const errors: Line[] = [];
    const io: Io = {
      lang,
      out: (lines) => {
        for (const l of Array.isArray(lines) ? lines : [lines]) {
          if (typeof l !== 'string' && l.cls === 'error') errors.push(l);
          else captured.push(typeof l === 'string' ? l : l.text);
        }
      },
      live: screen.live,
    };
    await cmd(args, io);
    if (errors.length) print(errors);
    try {
      fs.write(fs.resolve(redirect.path), captured.length ? `${captured.join('\n')}\n` : '', redirect.append);
    } catch (e) {
      fail(screen, name, e);
    }
  };

  /* --- keyboard ------------------------------------------------------------------- */

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') lastTab = '';
    if (e.key === 'Enter') {
      // Without this, the Enter that opens nano would land in its text area.
      e.preventDefault();
      const value = input.value;
      input.value = '';
      void run(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) input.value = history[--historyIndex] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) input.value = history[++historyIndex] ?? '';
      else {
        historyIndex = history.length;
        input.value = '';
      }
    } else if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) {
      // An empty prompt lets Tab move focus on, so keyboard users are never trapped.
      e.preventDefault();
      const result = complete(input.value, {
        commands: names,
        subcommands: { help: ['-a', '--all'], terraform: ['apply', 'destroy', 'plan'], docker: ['ps'], kubectl: ['get'], uname: ['-a'] },
        dirsOnly: ['cd'],
        list: (typedDir) => {
          try {
            const abs = fs.resolve(typedDir || '.');
            return fs.isDir(abs) ? fs.list(abs, true) : null;
          } catch {
            return null;
          }
        },
      });
      if (result.line !== input.value) {
        input.value = result.line;
        lastTab = '';
      } else if (result.options.length) {
        // Second Tab in a row lists the choices, like bash.
        if (lastTab === input.value) {
          print({ text: `${prompt()} ${input.value}`, cls: 'dim' });
          print(result.options.join('  '));
        }
        lastTab = input.value;
      }
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      print({ text: `${prompt()} ${input.value}^C`, cls: 'dim' });
      input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      output.replaceChildren();
    }
  });

  // Suggested commands above the window run as if typed.
  document.querySelectorAll<HTMLButtonElement>('[data-term-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void run(btn.dataset.termCmd ?? '');
      body.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  // Clicking anywhere in the window focuses the prompt (like a real terminal).
  windowEl.addEventListener('click', (e) => {
    if (window.getSelection()?.toString()) return; // let people copy text
    const target = e.target as HTMLElement;
    if (target.closest('#nano')) return;
    if (target.tagName === 'A') return;
    if (nano.isOpen) nano.focus();
    else input.focus({ preventScroll: true });
  });

  updatePrompt();
  print(s.welcome.map((text) => ({ text, cls: 'dim' as const })));
}

initTerminal();
