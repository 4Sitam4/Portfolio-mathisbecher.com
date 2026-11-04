/**
 * The terminal's initial file tree, generated from the site's own content
 * (same texts as the page, nothing more).
 */

import { contactLinks, projects, skillGroups, timeline, workProjects } from '../../i18n/ui';
import type { Seed } from './vfs';

type Lang = 'fr' | 'en';

const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '');

const TOPOLOGY = String.raw`INTERNET
   |
router / firewall
   | 10 Gbps
switch 10GbE
   |--- pve-node-*  (Proxmox VE cluster)
   |       '-- VMs / LXC / Docker
   |             '-- nginx --> mathisbecher.com
   '--- truenas     (TrueNAS Scale)`;

export function seed(lang: Lang): Seed {
  const L = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const projectFiles: Seed = {};
  for (const p of workProjects) {
    projectFiles[`${slug(p.name)}.md`] = [
      `# ${p.name} — ${p.subtitle[lang]}`,
      `${p.period[lang]} · Open Lake Technology`,
      '',
      `## ${L('Le besoin', 'The need')}`,
      p.need[lang],
      '',
      `## ${L('La solution', 'The solution')}`,
      p.solution[lang],
      '',
      `## ${L('Mon rôle', 'My role')}`,
      p.role[lang],
      '',
      ...p.figures.map((f) => `- ${f.value} ${f.label[lang]}`),
      '',
      `stack: ${p.tags.join(', ')}`,
    ].join('\n');
  }
  for (const p of projects) {
    if (p.anchor) continue; // the homelab has its own directory
    projectFiles[`${slug(p.name)}.md`] = [
      `# ${p.name}`,
      '',
      p.description[lang],
      '',
      `stack: ${p.tags.join(', ')}`,
      ...(p.url ? [`code: ${p.url}`] : []),
      ...(p.live ? [`live: ${p.live}`] : []),
    ].join('\n');
  }

  return {
    home: {
      visitor: {
        'README.md': L(
          "Bienvenue dans mon terminal.\n\nTout ce que vous créez ici reste dans votre navigateur.\nEssayez : ls, cd projects, cat about.txt, nano notes.txt, tree, fortune.\nTab complète les commandes et les fichiers.",
          'Welcome to my terminal.\n\nEverything you create here stays in your browser.\nTry: ls, cd projects, cat about.txt, nano notes.txt, tree, fortune.\nTab completes commands and files.'
        ),
        'about.txt': L(
          "Passionné d'informatique, obsédé par l'indépendance numérique. Terraform, Azure, Docker, Proxmox — et un homelab en 10 Gbps pour héberger tout ça, y compris ce site.",
          'Passionate about computers, obsessed with digital independence. Terraform, Azure, Docker, Proxmox — plus a 10 Gbps homelab hosting all of it, including this very website.'
        ),
        'contact.txt': [
          `mail      ${contactLinks.email}`,
          `github    ${contactLinks.github}`,
          `linkedin  ${contactLinks.linkedin}`,
          `source    ${contactLinks.source}`,
        ].join('\n'),
        'experience.log': timeline
          .map((e) => `[${e.period[lang]}] ${e.title[lang]} @ ${e.org}`)
          .join('\n'),
        'skills.json': JSON.stringify(
          Object.fromEntries(skillGroups.map((g) => [g.key.replace('skills.', ''), g.items])),
          null,
          2
        ),
        projects: projectFiles,
        homelab: {
          'topology.txt': TOPOLOGY,
          'proxmox-cluster': {
            'README.md': L(
              'Cluster Proxmox VE multi-nœuds : VMs, conteneurs LXC et Docker.',
              'Multi-node Proxmox VE cluster: VMs, LXC containers and Docker.'
            ),
          },
          'truenas-scale': {
            'README.md': L('Stockage réseau TrueNAS Scale.', 'TrueNAS Scale network storage.'),
          },
          'switch-10gbe': {
            'README.md': L('Backbone réseau en 10 Gbps.', '10 Gbps network backbone.'),
          },
          docker: {
            'portfolio.yml': [
              'services:',
              '  portfolio:',
              '    image: ghcr.io/4sitam4/portfolio-mathisbecher.com:latest',
              '    restart: unless-stopped',
              '    security_opt: [no-new-privileges:true]',
              '    ports: ["8080:8080"]',
            ].join('\n'),
          },
        },
        '.secret': L(
          "Bravo, vous avez trouvé le fichier caché.\nUn indice pour la suite : essayez 'sl', 'cowsay' ou 'sudo make me a sandwich'.",
          "Well done, you found the hidden file.\nA hint for what's next: try 'sl', 'cowsay' or 'sudo make me a sandwich'."
        ),
        '.bash_history': [
          'ssh homelab',
          'terraform plan',
          'terraform apply -auto-approve',
          'git push --force   # oups',
          'git push --force-with-lease',
          'docker compose up -d',
          'ping 1.1.1.1',
          'vim notes.md',
          ':q!',
          ':wq',
          'how to exit vim',
        ].join('\n'),
      },
    },
    etc: {
      hostname: 'mathisbecher',
      motd: L(
        'Ici, tout est auto-hébergé. Soyez sages.',
        'Everything here is self-hosted. Behave.'
      ),
      'os-release': 'NAME="Homelab Linux"\nPRETTY_NAME="Homelab Linux (Proxmox VE)"',
      passwd: L(
        'root:x:0:0:bien tenté:/root:/bin/nope\nvisitor:x:1000:1000:invité:/home/visitor:/bin/sh',
        'root:x:0:0:nice try:/root:/bin/nope\nvisitor:x:1000:1000:guest:/home/visitor:/bin/sh'
      ),
    },
    tmp: {},
  };
}
