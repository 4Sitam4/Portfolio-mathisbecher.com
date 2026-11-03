/**
 * Interactive terminal: a small fake shell letting visitors explore the
 * portfolio (whoami, ls, cat, neofetch…) with a few easter eggs.
 * All output is inserted via textContent — user input is never parsed as HTML.
 */

import { fullscreenMatrixBurst } from './matrix';
import { projects, contactLinks, skillGroups, timeline } from '../i18n/ui';

type Line = { text: string; cls?: 'accent' | 'error' | 'dim' | 'art' };

const NEOFETCH_LOGO = String.raw`
 ███╗   ███╗ ██████╗
 ████╗ ████║ ██╔══██╗
 ██╔████╔██║ ██████╔╝
 ██║╚██╔╝██║ ██╔══██╗
 ██║ ╚═╝ ██║ ██████╔╝
 ╚═╝     ╚═╝ ╚═════╝`;

const STR = {
  fr: {
    welcome: [
      'mathisbecher.com — session invité ouverte.',
      "tapez 'help' pour la liste des commandes.",
    ],
    help: [
      'commandes disponibles :',
      '  help          cette liste',
      '  whoami        qui suis-je',
      '  ls [dossier]  lister les fichiers',
      '  cat <fichier> afficher un fichier',
      '  neofetch      infos système',
      '  projects      mes projets',
      '  contact       me contacter',
      '  lang          basculer FR ⇄ EN',
      '  terraform apply  reconstruire la page',
      '  matrix        ???',
      '  clear         nettoyer l’écran',
      '  exit          fermer la session',
    ],
    whoami: [
      'Mathis Becher — Cloud Infrastructure Engineer.',
      'Alternant chez Open Lake Technology, étudiant à Epitech (promo 2027).',
      "Je monte des infras cloud le jour, et j'auto-héberge la nuit.",
    ],
    about:
      "Passionné d'informatique, obsédé par l'indépendance numérique. Terraform, Azure, Docker, Proxmox — et un homelab en 10 Gbps pour héberger tout ça, y compris ce site.",
    catUsage: 'usage : cat <fichier> — essayez : cat about.txt',
    noSuchFile: (f: string) => `cat : ${f} : fichier introuvable`,
    isDir: (d: string) => `cat : ${d} : est un dossier`,
    notFound: (c: string) => `${c} : commande introuvable — essayez 'help'`,
    sudo: 'permission refusée : bien tenté. ;)',
    rmrf: ["suppression du homelab en cours…", '…', 'non. <3 vos données sont en sécurité (RAID + snapshots).'],
    matrix: 'réveille-toi, Neo…',
    exit: 'déconnexion. à bientôt.',
    langSwitch: 'bascule vers la version anglaise…',
    uptime: 'up depuis toujours (ou presque) — 99,9% de disponibilité homelab',
  },
  en: {
    welcome: [
      'mathisbecher.com — guest session opened.',
      "type 'help' to list available commands.",
    ],
    help: [
      'available commands:',
      '  help          this list',
      '  whoami        who am I',
      '  ls [dir]      list files',
      '  cat <file>    print a file',
      '  neofetch      system info',
      '  projects      my projects',
      '  contact       reach me',
      '  lang          switch FR ⇄ EN',
      '  terraform apply  rebuild this page',
      '  matrix        ???',
      '  clear         clear the screen',
      '  exit          close the session',
    ],
    whoami: [
      'Mathis Becher — Cloud Infrastructure Engineer.',
      'Apprentice at Open Lake Technology, student at Epitech (class of 2027).',
      'I build cloud infrastructure by day, and self-host by night.',
    ],
    about:
      'Passionate about computers, obsessed with digital independence. Terraform, Azure, Docker, Proxmox — plus a 10 Gbps homelab hosting all of it, including this very website.',
    catUsage: 'usage: cat <file> — try: cat about.txt',
    noSuchFile: (f: string) => `cat: ${f}: no such file`,
    isDir: (d: string) => `cat: ${d}: is a directory`,
    notFound: (c: string) => `${c}: command not found — try 'help'`,
    sudo: 'permission denied: nice try. ;)',
    rmrf: ['deleting homelab…', '…', 'no. <3 your data is safe (RAID + snapshots).'],
    matrix: 'wake up, Neo…',
    exit: 'logout. see you around.',
    langSwitch: 'switching to the French version…',
    uptime: 'up since forever (almost) — 99.9% homelab availability',
  },
} as const;

export function initTerminal(): void {
  const output = document.getElementById('term-out');
  const input = document.getElementById('term-input') as HTMLInputElement | null;
  const body = document.getElementById('term-body');
  const windowEl = document.getElementById('term');
  if (!output || !input || !body || !windowEl) return;

  const lang: 'fr' | 'en' = document.documentElement.lang === 'fr' ? 'fr' : 'en';
  const s = STR[lang];
  const history: string[] = [];
  let historyIndex = -1;

  const print = (lines: Line[] | string[]): void => {
    for (const line of lines) {
      const el = document.createElement('div');
      const { text, cls } = typeof line === 'string' ? { text: line, cls: undefined } : line;
      el.textContent = text || ' ';
      if (cls) el.className = `term-line--${cls}`;
      output.appendChild(el);
    }
    body.scrollTop = body.scrollHeight;
  };

  const echoCommand = (raw: string): void => {
    print([{ text: `visitor@mathisbecher:~$ ${raw}`, cls: 'dim' }]);
  };

  const files: Record<string, () => Line[]> = {
    'about.txt': () => [{ text: s.about }],
    'contact.txt': () => [
      { text: `mail     ${contactLinks.email}` },
      { text: `github   ${contactLinks.github}` },
      { text: `linkedin ${contactLinks.linkedin}` },
    ],
    'skills.json': () =>
      JSON.stringify(
        Object.fromEntries(skillGroups.map((g) => [g.key.replace('skills.', ''), g.items])),
        null,
        2
      )
        .split('\n')
        .map((text) => ({ text }) as Line),
    'experience.log': () =>
      timeline
        .filter((e) => e.type === 'work')
        .map((e) => ({ text: `[${e.period[lang]}] ${e.title[lang]} @ ${e.org}` }) as Line),
  };

  const listProjects = (): Line[] =>
    projects.map((p) => ({
      text: `${p.name.padEnd(20)} ${p.description[lang]}`,
    }));

  const commands: Record<string, (args: string[]) => void> = {
    help: () => print([...s.help]),
    whoami: () => print([...s.whoami]),
    ls: (args) => {
      const dir = args[0]?.replace(/\/$/, '');
      if (dir === 'projects') return print(listProjects());
      if (dir === 'homelab')
        return print(['proxmox-cluster/  truenas-scale/  switch-10gbe/  docker/']);
      print(['about.txt  contact.txt  experience.log  skills.json  projects/  homelab/']);
    },
    cat: (args) => {
      const file = args[0];
      if (!file) return print([{ text: s.catUsage, cls: 'dim' }]);
      if (file === 'projects' || file === 'homelab' || file === 'projects/' || file === 'homelab/')
        return print([{ text: s.isDir(file), cls: 'error' }]);
      const reader = files[file];
      if (!reader) return print([{ text: s.noSuchFile(file), cls: 'error' }]);
      print(reader());
    },
    projects: () => print(listProjects()),
    contact: () => print(files['contact.txt']!()),
    neofetch: () => {
      print(NEOFETCH_LOGO.split('\n').map((text) => ({ text, cls: 'art' }) as Line));
      print([
        `visitor@mathisbecher.com`,
        '─────────────────────────',
        `OS:       Homelab Linux x86_64`,
        `Host:     Proxmox VE cluster`,
        `Storage:  TrueNAS Scale`,
        `Network:  10 Gbps`,
        `Shell:    astro 5 / gsap 3`,
        `Uptime:   ${s.uptime}`,
      ]);
    },
    uptime: () => print([s.uptime]),
    pwd: () => print(['/home/visitor']),
    echo: (args) => print([args.join(' ')]),
    history: () => print(history.map((h, i) => `  ${i + 1}  ${h}`)),
    lang: () => {
      print([{ text: s.langSwitch, cls: 'accent' }]);
      window.setTimeout(() => {
        window.location.href = lang === 'fr' ? '/en/' : '/';
      }, 600);
    },
    matrix: () => {
      print([{ text: s.matrix, cls: 'accent' }]);
      window.dispatchEvent(new CustomEvent('matrix:boost'));
      fullscreenMatrixBurst();
    },
    terraform: (args) => {
      if (args[0] !== 'apply') {
        return print([{ text: 'usage: terraform apply', cls: 'dim' }]);
      }
      print([
        { text: 'Acquiring state lock. This may take a few moments...', cls: 'dim' },
        { text: 'Plan: page rebuild — scrolling to the top.', cls: 'accent' },
      ]);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('provision:replay')), 700);
    },
    sudo: () => print([{ text: s.sudo, cls: 'error' }]),
    rm: (args) => {
      if (args.join(' ').includes('-rf')) return print([...s.rmrf]);
      print([{ text: s.notFound('rm'), cls: 'error' }]);
    },
    clear: () => {
      output.innerHTML = '';
    },
    exit: () => {
      print([{ text: s.exit, cls: 'dim' }]);
      input.blur();
    },
  };

  const run = (raw: string): void => {
    const trimmed = raw.trim();
    echoCommand(trimmed);
    if (!trimmed) return;

    history.push(trimmed);
    historyIndex = history.length;

    const [cmd = '', ...args] = trimmed.split(/\s+/);
    const handler = commands[cmd.toLowerCase()];
    if (handler) handler(args);
    else print([{ text: s.notFound(cmd), cls: 'error' }]);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) input.value = history[--historyIndex] ?? '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        input.value = history[++historyIndex] ?? '';
      } else {
        historyIndex = history.length;
        input.value = '';
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Autocomplete only when there is something to complete, so an empty
      // prompt never traps keyboard users: Tab still moves focus on.
      const partial = input.value.trim().toLowerCase();
      const match = partial && Object.keys(commands).find((c) => c.startsWith(partial));
      if (match) {
        e.preventDefault();
        input.value = match + ' ';
      }
    }
  });

  // Suggested commands above the window run as if typed.
  document.querySelectorAll<HTMLButtonElement>('[data-term-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      run(btn.dataset.termCmd ?? '');
      body.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  // Clicking anywhere in the window focuses the prompt (like a real terminal).
  windowEl.addEventListener('click', (e) => {
    if (window.getSelection()?.toString()) return; // let people copy text
    if ((e.target as HTMLElement).tagName !== 'A') input.focus({ preventScroll: true });
  });

  print(s.welcome.map((text) => ({ text, cls: 'dim' }) as Line));
}

initTerminal();
