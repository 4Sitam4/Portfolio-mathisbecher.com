/** The fun part of the terminal: easter eggs and jokes. */

import { contactLinks } from '../../i18n/ui';
import type { Command, Io, Lang } from './io';

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const L = (io: Io, fr: string, en: string) => (io.lang === 'fr' ? fr : en);

const FORTUNES: Record<Lang, string[]> = {
  fr: [
    "Le cloud, c'est juste l'ordinateur de quelqu'un d'autre. Le mien est dans mon salon.",
    "C'est toujours le DNS. Même quand ce n'est pas le DNS, c'est le DNS.",
    'terraform destroy : la commande la plus honnête de l’informatique.',
    '99,9 % de disponibilité, c’est 8 h 45 de panne par an. J’en ai utilisé 3 pour une mise à jour de firmware.',
    'Déployer un vendredi ? Seulement sur mon homelab.',
    '« Ça marche sur ma machine. » — Alors on livrera ta machine. (Docker)',
    'Il y a deux sortes de gens : ceux qui font des sauvegardes, et ceux qui vont en faire.',
    'Un homelab, ce n’est jamais fini. C’est juste en production.',
  ],
  en: [
    "The cloud is just someone else's computer. Mine is in my living room.",
    "It's always DNS. Even when it's not DNS, it's DNS.",
    'terraform destroy: the most honest command in IT.',
    '99.9% uptime is 8h45 of downtime a year. I spent 3 of them on a firmware update.',
    'Deploy on a Friday? Only on my homelab.',
    '"It works on my machine." — Then we will ship your machine. (Docker)',
    'There are two kinds of people: those who make backups, and those who will.',
    'A homelab is never finished. It is just in production.',
  ],
};

const COW = String.raw`        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||`;

const TRAIN = String.raw`      ====        ________                ___________
  _D _|  |_______/        \__I_I_____===__|_________|
   |(_)---  |   H\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|_
__/ =| o |=-~~\  /~~\  /~~\  /~~\ ____Y___________|__
 |/-=|___|=    ||    ||    ||    |_____/~\___/
  \_/      \O=====O=====O=====O_/      \_/`;

function bubble(text: string): string[] {
  const words = text.split(/\s+/);
  const rows: string[] = [];
  let row = '';
  for (const w of words) {
    if ((row + ' ' + w).trim().length > 40) {
      rows.push(row.trim());
      row = w;
    } else row += ` ${w}`;
  }
  if (row.trim()) rows.push(row.trim());
  const width = Math.max(...rows.map((r) => r.length));
  return [
    ` ${'_'.repeat(width + 2)}`,
    ...rows.map((r, i) => {
      const [l, rgt] = rows.length === 1 ? ['<', '>'] : i === 0 ? ['/', '\\'] : i === rows.length - 1 ? ['\\', '/'] : ['|', '|'];
      return `${l} ${r.padEnd(width)} ${rgt}`;
    }),
    ` ${'-'.repeat(width + 2)}`,
  ];
}

export const easterEggs: Record<string, Command> = {
  fortune: (_, io) => io.out(pick(FORTUNES[io.lang])),

  cowsay: (args, io) => {
    const text = args.join(' ') || pick(FORTUNES[io.lang]);
    io.out([...bubble(text), ...COW.split('\n')].map((t) => ({ text: t, cls: 'art' as const })));
  },

  sl: async (_, io) => {
    const el = io.live();
    el.className = 'term-line--art';
    const rows = TRAIN.split('\n');
    const width = Math.max(...rows.map((r) => r.length));
    const cols = 90;
    for (let x = cols; x > -width; x -= 3) {
      el.textContent = rows
        .map((r) => (x >= 0 ? ' '.repeat(x) + r : r.slice(-x)).slice(0, cols))
        .join('\n');
      await sleep(30);
    }
    el.remove();
  },

  ping: async (args, io) => {
    const host = args.find((a) => !a.startsWith('-')) ?? 'mathisbecher.com';
    if (!/^(mathisbecher\.com|localhost)$/.test(host)) {
      io.out({ text: L(io, `ping: ${host} : seul mathisbecher.com répond d'ici.`, `ping: ${host}: only mathisbecher.com answers from here.`), cls: 'dim' });
    }
    io.out(L(io, 'PING mathisbecher.com — 4 vraies requêtes HTTP, via Cloudflare jusqu’à mon homelab', 'PING mathisbecher.com — 4 real HTTP requests, through Cloudflare to my homelab'));
    const times: number[] = [];
    for (let seq = 1; seq <= 4; seq++) {
      const t0 = performance.now();
      try {
        await fetch(location.pathname, { method: 'HEAD', cache: 'no-store' });
        const ms = Math.max(1, Math.round(performance.now() - t0));
        times.push(ms);
        io.out(L(io, `réponse de mathisbecher.com : seq=${seq} temps=${ms} ms`, `reply from mathisbecher.com: seq=${seq} time=${ms} ms`));
      } catch {
        io.out({ text: L(io, `seq=${seq} : délai dépassé`, `seq=${seq}: request timed out`), cls: 'error' });
      }
      if (seq < 4) await sleep(400);
    }
    if (times.length) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      io.out({
        text: `--- ${times.length}/4 ${L(io, 'reçus', 'received')}, min/moy/max = ${Math.min(...times)}/${avg}/${Math.max(...times)} ms`,
        cls: 'accent',
      });
    }
  },

  ssh: (args, io) =>
    io.out([
      { text: `ssh: connect to host ${args[0] ?? 'homelab'} port 22: Permission denied (publickey).`, cls: 'error' },
      L(io, 'Bien tenté — le homelab ne fait confiance qu’aux clés qu’il connaît.', 'Nice try — the homelab only trusts keys it knows.'),
    ]),

  docker: (args, io) => {
    if (args[0] !== 'ps') return io.out({ text: 'usage: docker ps', cls: 'dim' });
    io.out([
      'CONTAINER ID   IMAGE                                                  STATUS                PORTS      NAMES',
      `4b1d2e9c7a3f   ghcr.io/4sitam4/portfolio-mathisbecher.com:latest      Up ${Math.floor(Math.random() * 20) + 2} hours (healthy)   8080/tcp   portfolio`,
    ]);
  },

  kubectl: (_, io) =>
    io.out([
      'No resources found in homelab namespace.',
      L(io, 'Kubernetes, c’est pour le boulot. À la maison, c’est Proxmox et Docker.', 'Kubernetes is for work. At home, it is Proxmox and Docker.'),
    ]),

  vim: (_, io) =>
    io.out([
      '~',
      '~',
      L(io, '~   « Comment quitter vim ? » — des millions de vues sur Stack Overflow.', '~   "How do I exit vim?" — millions of views on Stack Overflow.'),
      L(io, '~   Pour vous épargner ça, essayez plutôt : nano', '~   To spare you that, try: nano'),
    ]),

  ':q': (_, io) => io.out(L(io, "Vous n'êtes pas dans vim. Mais bravo pour le réflexe.", 'You are not in vim. Nice reflex though.')),

  make: (args, io) =>
    io.out(args.join(' ') === 'me a sandwich' ? L(io, 'Quoi ? Fais-le toi-même.', 'What? Make it yourself.') : 'make: *** No targets specified and no makefile found.  Stop.'),

  coffee: (_, io) =>
    io.out([
      { text: '   ( (', cls: 'art' },
      { text: '    ) )', cls: 'art' },
      { text: '  ........', cls: 'art' },
      { text: '  |      |]', cls: 'art' },
      { text: '  \\      /', cls: 'art' },
      { text: "   `----'", cls: 'art' },
      { text: "HTTP/1.1 418 I'm a teapot", cls: 'accent' },
    ]),

  hire: (_, io) => {
    io.out({ text: L(io, 'Excellente idée. Ouverture de votre messagerie…', 'Excellent idea. Opening your mail client…'), cls: 'accent' });
    setTimeout(() => (location.href = `mailto:${contactLinks.email}`), 600);
  },

  id: (_, io) => io.out('uid=1000(visitor) gid=1000(visitor) groups=1000(visitor),42(curious)'),
};

easterEggs.vi = easterEggs.vim!;
easterEggs.nvim = easterEggs.vim!;
easterEggs.emacs = (_, io) => io.out(L(io, 'emacs : un excellent système d’exploitation, il ne lui manque qu’un bon éditeur. Essayez nano.', 'emacs: a great operating system, lacking only a decent editor. Try nano.'));
easterEggs[':wq'] = easterEggs[':q']!;
easterEggs[':q!'] = easterEggs[':q']!;
easterEggs.brew = easterEggs.coffee!;
easterEggs['hire-me'] = easterEggs.hire!;
