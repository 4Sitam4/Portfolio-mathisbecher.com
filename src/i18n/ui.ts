export const languages = {
  fr: 'Français',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'fr';

export const ui = {
  fr: {
    'meta.title': 'Mathis Becher, Cloud Infrastructure Engineer',
    'meta.description':
      'Mathis Becher, Cloud Infrastructure Engineer. Terraform, Azure, Docker, Proxmox. Portfolio auto-hébergé sur mon homelab.',
    'meta.ogAlt': 'Mathis Becher, Cloud Infrastructure Engineer : aperçu du portfolio',
    'skip': 'Aller au contenu',
    'nav.label': 'Navigation principale',
    'nav.about': 'à propos',
    'nav.experience': 'parcours',
    'nav.skills': 'compétences',
    'nav.projects': 'projets',
    'nav.homelab': 'homelab',
    'nav.terminal': 'terminal',
    'nav.contact': 'contact',
    'nav.menu': 'menu',
    'nav.close': 'fermer',
    'nav.switch': 'Read this page in English',
    'calm.on': 'mode lecture',
    'calm.short': 'lecture',
    'calm.label': 'Mode lecture : couper les animations',

    'hero.role': 'Cloud Infrastructure Engineer',
    'logo3d.label': 'Portrait de Mathis Becher en hologramme 3D, construit par une pluie de caractères façon Matrix. Faites-le tourner à la souris, au doigt ou avec les flèches.',
    'hero.tagline':
      "Le jour, j'**automatise** des ==infrastructures cloud==. Le soir, j'**héberge les miennes** à la maison.",
    'hero.status': 'Alternant chez Open Lake Technology, étudiant à Epitech (promo 2027)',
    'hero.cta.projects': 'Mes projets',
    'hero.cta.terminal': 'Ouvrir le terminal',
    'hero.cta.cv': 'Télécharger mon CV',
    'cv.channel': 'CV',
    'cv.channel.value': 'PDF, 1 page',

    'trace.title': 'votre requête',
    'trace.pending': 'mesure en cours…',
    'trace.error': 'en-têtes indisponibles',
    'trace.route': 'trajet',
    'trace.you': 'vous',
    'trace.ttfb': 'premier octet',
    'trace.at': 'reçue à',
    'trace.caption': 'Réponse réelle de ce serveur, mesurée dans votre navigateur au chargement de la page.',

    'about.title': 'à propos',
    'about.p1':
      "Je suis étudiant à **Epitech** (architecte de systèmes d'information, promo 2027) et **alternant Cloud Infrastructure Engineer** chez Open Lake Technology, où je travaille sur de l'infrastructure ==Azure== avec ==Terraform== et ==Terramate==.",
    'about.p2':
      "Mon fil rouge : **l'indépendance numérique**. Plutôt que de dépendre des services des GAFAM, je monte, configure et maintiens ma propre infrastructure : un homelab avec cluster ==Proxmox==, stockage ==TrueNAS Scale== et réseau ==10 Gbps==. **Ce portfolio tourne dessus.**",
    'about.p3':
      "Technicien hardware, puis développeur web, aujourd'hui ingénieur cloud : **du hardware au cloud**, en passant par le réseau et le CI/CD, j'aime **comprendre toute la pile**, pas juste une couche.",

    'xp.title': 'parcours',
    'xp.work': 'Expérience',
    'xp.edu': 'Formation',
    'xp.now': 'en cours',

    'skills.title': 'compétences',
    'skills.cloud': 'Cloud et IaC',
    'skills.infra': 'Virtualisation et containers',
    'skills.dev': 'Développement',
    'skills.net': 'Réseau et hardware',

    'projects.title': 'projets',
    'projects.source': 'Code source',
    'projects.archived': 'archivé',
    'projects.stars': 'étoiles sur GitHub',
    'projects.homelab': 'Voir le homelab',
    'projects.work': 'open-lake',
    'projects.work.lede':
      "Les **trois projets majeurs** de mon alternance. À chaque fois, j'ai **identifié le besoin**, choisi la solution, puis conçu, développé et **livré le projet de bout en bout**.",
    'projects.perso': 'perso',
    'projects.need': 'Le besoin',
    'projects.solution': 'La solution',
    'projects.role': 'Mon rôle',
    'projects.private': 'Repo privé',
    'projects.live': 'Voir en ligne',

    'homelab.title': 'homelab',
    'homelab.intro':
      'Mon **terrain de jeu permanent** : plusieurs machines physiques en cluster Proxmox, une machine TrueNAS Scale pour le stockage, le tout interconnecté en ==10 Gbps==.',
    'homelab.stat1.value': 'Proxmox VE',
    'homelab.stat1.label': 'cluster multi-nœuds',
    'homelab.stat2.value': 'TrueNAS Scale',
    'homelab.stat2.label': 'stockage réseau',
    'homelab.stat3.value': '10 Gbps',
    'homelab.stat3.label': 'backbone réseau',
    'homelab.stat4.value': '100 %',
    'homelab.stat4.label': 'auto-hébergé',
    'rack.label': 'Mon rack en 3D : switch, homelab de ma compagne, deux nœuds Proxmox et le serveur TrueNAS. Faites-le tourner à la souris, au doigt ou avec les flèches.',
    'homelab.here': 'vous êtes ici',
    'homelab.diagram':
      'Schéma du homelab : internet, proxy Cloudflare, routeur et pare-feu, switch 10GbE, cluster Proxmox, TrueNAS Scale, puis les VMs et containers Docker dont le nginx qui sert ce site.',

    'term.title': 'terminal',
    'term.hint': 'Un vrai petit shell pour explorer ce portfolio. Tapez une commande ou essayez :',
    'term.input': 'Invite de commande',

    'contact.title': 'contact',
    'contact.intro':
      'Une opportunité, une question, ou juste envie de parler homelab ? **Ma boîte mail est ouverte.**',
    'contact.cta': 'Écrire un e-mail',
    'contact.copy': "Copier l'adresse",
    'contact.copied': 'Adresse copiée',

    'footer.served': 'Servi depuis mon homelab',
    'footer.built': 'Astro, GSAP et Docker',
  },
  en: {
    'meta.title': 'Mathis Becher, Cloud Infrastructure Engineer',
    'meta.description':
      'Mathis Becher, Cloud Infrastructure Engineer. Terraform, Azure, Docker, Proxmox. Portfolio self-hosted on my homelab.',
    'meta.ogAlt': 'Mathis Becher, Cloud Infrastructure Engineer: portfolio preview',
    'skip': 'Skip to content',
    'nav.label': 'Main navigation',
    'nav.about': 'about',
    'nav.experience': 'experience',
    'nav.skills': 'skills',
    'nav.projects': 'projects',
    'nav.homelab': 'homelab',
    'nav.terminal': 'terminal',
    'nav.contact': 'contact',
    'nav.menu': 'menu',
    'nav.close': 'close',
    'nav.switch': 'Lire cette page en français',
    'calm.on': 'reading mode',
    'calm.short': 'read',
    'calm.label': 'Reading mode: turn animations off',

    'hero.role': 'Cloud Infrastructure Engineer',
    'logo3d.label': 'Portrait of Mathis Becher as a 3D hologram, built by a Matrix-style rain of characters. Turn it with the mouse, a finger or the arrow keys.',
    'hero.tagline':
      'By day, I **automate** ==cloud infrastructure==. By night, I **host my own** at home.',
    'hero.status': 'Apprentice at Open Lake Technology, student at Epitech (class of 2027)',
    'hero.cta.projects': 'My projects',
    'hero.cta.terminal': 'Open the terminal',
    'hero.cta.cv': 'Download résumé',
    'cv.channel': 'Résumé',
    'cv.channel.value': 'PDF, 1 page',

    'trace.title': 'your request',
    'trace.pending': 'measuring…',
    'trace.error': 'headers unavailable',
    'trace.route': 'route',
    'trace.you': 'you',
    'trace.ttfb': 'first byte',
    'trace.at': 'received at',
    'trace.caption': 'A real response from this server, measured in your browser when the page loaded.',

    'about.title': 'about',
    'about.p1':
      "I'm a student at **Epitech** (information systems architecture, class of 2027) and an **apprentice Cloud Infrastructure Engineer** at Open Lake Technology, working on ==Azure== infrastructure with ==Terraform== and ==Terramate==.",
    'about.p2':
      'My common thread: **digital independence**. Rather than relying on big-tech services, I build, configure and maintain my own infrastructure: a homelab with a ==Proxmox== cluster, ==TrueNAS Scale== storage and ==10 Gbps== networking. **This portfolio runs on it.**',
    'about.p3':
      'Hardware technician, then web developer, now cloud engineer: **from hardware to cloud**, through networking and CI/CD, I like **understanding the whole stack**, not just one layer.',

    'xp.title': 'experience',
    'xp.work': 'Work',
    'xp.edu': 'Education',
    'xp.now': 'current',

    'skills.title': 'skills',
    'skills.cloud': 'Cloud and IaC',
    'skills.infra': 'Virtualization and containers',
    'skills.dev': 'Development',
    'skills.net': 'Network and hardware',

    'projects.title': 'projects',
    'projects.source': 'Source code',
    'projects.archived': 'archived',
    'projects.stars': 'stars on GitHub',
    'projects.homelab': 'See the homelab',
    'projects.work': 'open-lake',
    'projects.work.lede':
      'The **three major projects** of my apprenticeship. Each time, I **identified the need**, chose the solution, then designed, built and **shipped the project end to end**.',
    'projects.perso': 'personal',
    'projects.need': 'The need',
    'projects.solution': 'The solution',
    'projects.role': 'My role',
    'projects.private': 'Private repo',
    'projects.live': 'See it live',

    'homelab.title': 'homelab',
    'homelab.intro':
      'My **permanent playground**: several physical machines running as a Proxmox cluster, a TrueNAS Scale box for storage, all interconnected at ==10 Gbps==.',
    'homelab.stat1.value': 'Proxmox VE',
    'homelab.stat1.label': 'multi-node cluster',
    'homelab.stat2.value': 'TrueNAS Scale',
    'homelab.stat2.label': 'network storage',
    'homelab.stat3.value': '10 Gbps',
    'homelab.stat3.label': 'network backbone',
    'homelab.stat4.value': '100%',
    'homelab.stat4.label': 'self-hosted',
    'rack.label': "My rack in 3D: switch, my partner's homelab, two Proxmox nodes and the TrueNAS server. Turn it with the mouse, a finger or the arrow keys.",
    'homelab.here': 'you are here',
    'homelab.diagram':
      'Homelab diagram: internet, Cloudflare proxy, router and firewall, 10GbE switch, Proxmox cluster, TrueNAS Scale, then the VMs and Docker containers including the nginx serving this site.',

    'term.title': 'terminal',
    'term.hint': 'A small working shell to explore this portfolio. Type a command or try:',
    'term.input': 'Command prompt',

    'contact.title': 'contact',
    'contact.intro':
      'An opportunity, a question, or just want to talk homelab? **My inbox is open.**',
    'contact.cta': 'Send an email',
    'contact.copy': 'Copy address',
    'contact.copied': 'Address copied',

    'footer.served': 'Served from my homelab',
    'footer.built': 'Astro, GSAP and Docker',
  },
} as const;

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export { timeline, type TimelineEntry } from './timeline';

/* --------------------------------------------------------------------------
   Structured content (experience, skills, projects) — localized fields
   -------------------------------------------------------------------------- */

export interface SkillGroup {
  key: 'skills.cloud' | 'skills.infra' | 'skills.dev' | 'skills.net';
  prompt: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    key: 'skills.cloud',
    prompt: 'terraform plan',
    items: ['Azure', 'Terraform', 'Terramate', 'GitHub Actions', 'CI/CD', 'Git'],
  },
  {
    key: 'skills.infra',
    prompt: 'docker compose up -d',
    items: ['Docker', 'Docker Compose', 'Kubernetes (AKS)', 'Helm', 'Proxmox VE', 'TrueNAS Scale', 'Linux', 'Windows Server'],
  },
  {
    key: 'skills.dev',
    prompt: 'git push origin main',
    items: ['Go', 'Python', 'JavaScript', 'HTML/CSS', 'PHP', 'C', 'YAML/JSON', 'Bash'],
  },
  {
    key: 'skills.net',
    prompt: 'ip link set eth0 up',
    items: ['Networking 10GbE', 'Hardware', 'Self-hosting', 'DNS/DHCP', 'Firewalling'],
  },
];

/**
 * Work projects at Open Lake Technology (private repos). Written from the
 * code, docs and history of each repo — technique only, never customers.
 */
export interface WorkProject {
  name: string;
  subtitle: { fr: string; en: string };
  period: { fr: string; en: string };
  need: { fr: string; en: string };
  solution: { fr: string; en: string };
  role: { fr: string; en: string };
  /** a few figures that show the scale (numbers only) */
  figures: { value: string; label: { fr: string; en: string } }[];
  tags: string[];
}

export const workProjects: WorkProject[] = [
  {
    name: 'Terramate',
    subtitle: { fr: 'Plateforme IaC multi-environnements', en: 'Multi-environment IaC platform' },
    period: { fr: 'mars — août 2026', en: 'Mar — Aug 2026' },
    need: {
      fr: "Chaque environnement client avait son propre repo Terraform : la même infrastructure était copiée dans des dizaines de repos et **chaque changement commun devait être refait partout, à la main**.",
      en: 'Every customer environment had its own Terraform repo: the same infrastructure was copied across dozens of repos, and **every shared change had to be redone everywhere, by hand**.',
    },
    solution: {
      fr: "Un **monorepo Terramate** et un catalogue de ==modules Terraform versionnés==. Chaque environnement est une stack isolée qui hérite de ses valeurs sur trois niveaux et active ce dont il a besoin par feature flags ; le code Terraform est généré, et la détection de changements git ne cible que les stacks concernées. La migration s'est faite **à côté de la production** : déploiement en parallèle, validation, bascule DNS, puis décommissionnement de l'ancien.",
      en: 'A **Terramate monorepo** plus a catalogue of ==versioned Terraform modules==. Each environment is an isolated stack that inherits its values over three levels and turns on what it needs through feature flags; the Terraform code is generated, and git change detection only targets the affected stacks. The migration ran **next to production**: parallel deployment, validation, DNS cutover, then decommissioning of the old setup.',
    },
    role: {
      fr: "J'ai **identifié le problème, proposé Terramate**, conçu l'architecture, écrit la grande majorité du code et des modules, mené la migration et documenté le tout.",
      en: 'I **identified the problem, proposed Terramate**, designed the architecture, wrote the vast majority of the code and modules, ran the migration and documented it all.',
    },
    figures: [
      { value: '16', label: { fr: 'environnements de production migrés', en: 'production environments migrated' } },
      { value: '45', label: { fr: 'modules Terraform partagés', en: 'shared Terraform modules' } },
      { value: '~50', label: { fr: 'feature flags pour composer chaque stack', en: 'feature flags to compose each stack' } },
    ],
    tags: ['Terramate', 'Terraform', 'Azure', 'Container Apps', 'Entra ID', 'AKS', 'Private networking'],
  },
  {
    name: 'Shipyard',
    subtitle: { fr: 'Kits de déploiement on-prem hors ligne', en: 'Offline on-prem deployment kits' },
    period: { fr: 'sept. — nov. 2026', en: 'Sep — Nov 2026' },
    need: {
      fr: "Installer la stack produit chez des clients sur des VM durcies, sans accès Internet et sous politiques de sécurité strictes, reposait sur ==environ 3 000 lignes de scripts== bash et PowerShell.",
      en: 'Installing the product stack at customers on hardened VMs, with no internet access and under strict security policies, relied on ==about 3,000 lines of== bash and PowerShell ==scripts==.',
    },
    solution: {
      fr: "Une application web en Go (SSO Entra ID) qui génère **en quelques minutes un kit d'installation autonome** : images épinglées par digest, sommes SHA256 vérifiées, double-clic sur Windows Server ou une commande sur Linux. Un moteur d'installation en ==Go==, **idempotent et reprenable**, remplace les scripts ; chaque révision livrée est conservée pour appliquer un correctif en quelques secondes.",
      en: 'A Go web app (Entra ID SSO) that builds **a self-contained install kit in minutes**: images pinned by digest, verified SHA256 sums, a double-click on Windows Server or one command on Linux. An **idempotent, resumable** ==Go== install engine replaces the scripts; every delivered revision is kept so a hotfix can be applied in seconds.',
    },
    role: {
      fr: "**Seul développeur** : besoin, architecture (décisions documentées en ADR), code, tests, pipeline CI DevSecOps, infrastructure Azure en Terraform et validation sur un lab de VM Windows et Linux. **En production chez des clients** depuis la V1.0.",
      en: '**Sole developer**: need, architecture (decisions recorded as ADRs), code, tests, DevSecOps CI pipeline, Azure infrastructure in Terraform and validation on a lab of Windows and Linux VMs. **In production at customers** since V1.0.',
    },
    figures: [
      { value: '~18k', label: { fr: 'lignes de Go', en: 'lines of Go' } },
      { value: '124', label: { fr: 'tests automatisés', en: 'automated tests' } },
      { value: '2', label: { fr: "familles d'OS : Windows Server et Linux", en: 'OS families: Windows Server and Linux' } },
    ],
    tags: ['Go', 'Docker', 'Portainer', 'WSL2', 'Azure Container Apps', 'Terraform', 'GitHub Actions', 'Trivy'],
  },
  {
    name: 'AKS multi-tenant',
    subtitle: { fr: 'Plateforme de monitoring sur Kubernetes', en: 'Monitoring platform on Kubernetes' },
    period: { fr: "déc. 2025 — aujourd'hui", en: 'Dec 2025 — present' },
    need: {
      fr: "Chaque tenant d'un client avait son propre environnement Azure Container Apps et un Elasticsearch managé : chaque nouveau tenant demandait **du DNS et des certificats faits à la main**, et la plateforme se heurtait aux limites de capacité d'Azure.",
      en: "Each of a customer's tenants had its own Azure Container Apps environment and a managed Elasticsearch: every new tenant meant **manual DNS and certificate work**, and the platform kept hitting Azure capacity limits.",
    },
    solution: {
      fr: "Un **cluster AKS unique** en Terraform (Cilium, NetworkPolicy, ingress-nginx, cert-manager) où chaque tenant, isolé dans son namespace, reçoit son Elasticsearch, son Grafana avec SSO Entra ID et ses jobs de traitement planifiés. **Ajouter un tenant tient en une entrée de configuration** et un ==terraform apply==. La migration a suivi un runbook **sans perte de données** (snapshots et comptages avant et après chaque étape), avec sauvegardes AKS, snapshots Elasticsearch et restaurations testées.",
      en: 'A **single AKS cluster** in Terraform (Cilium, NetworkPolicy, ingress-nginx, cert-manager) where each tenant, isolated in its own namespace, gets its Elasticsearch, a Grafana with Entra ID SSO and its scheduled processing jobs. **Adding a tenant takes one config entry** and one ==terraform apply==. The migration followed a **zero-data-loss** runbook (snapshots and record counts before and after each step), with AKS backups, Elasticsearch snapshots and tested restores.',
    },
    role: {
      fr: "J'ai **conçu la plateforme**, écrit tout le code Terraform et les scripts d'exploitation, mené la migration jusqu'au décommissionnement de l'ancienne infrastructure, puis **optimisé les coûts** et dimensionné la capacité. En production depuis ==octobre 2026==.",
      en: 'I **designed the platform**, wrote all the Terraform code and operations scripts, ran the migration through to decommissioning the old infrastructure, then **optimized costs** and planned capacity. In production since ==October 2026==.',
    },
    figures: [
      { value: '10', label: { fr: 'tenants isolés sur un seul cluster', en: 'isolated tenants on one cluster' } },
      { value: '÷40', label: { fr: 'volume de logs ingérés après optimisation', en: 'log ingestion volume after tuning' } },
      { value: '1', label: { fr: 'terraform apply pour ajouter un tenant', en: 'terraform apply to add a tenant' } },
    ],
    tags: ['AKS', 'Kubernetes', 'Cilium', 'Helm', 'Elasticsearch', 'Grafana', 'cert-manager', 'Terraform', 'Azure Backup'],
  },
];

export interface Project {
  name: string;
  description: { fr: string; en: string };
  tags: string[];
  /** source code */
  url?: string;
  /** the project running online (when the source is private) */
  live?: string;
  /** in-page anchor, for projects documented on this page */
  anchor?: string;
  stars?: number;
  archived?: boolean;
}

export const projects: Project[] = [
  {
    name: 'Romifleur',
    description: {
      fr: "Application open source développée en ==Dart/Flutter== — **mon projet le plus populaire sur GitHub**.",
      en: 'Open source app built with ==Dart/Flutter== — **my most popular project on GitHub**.',
    },
    tags: ['Dart', 'Flutter'],
    url: 'https://github.com/4Sitam4/Romifleur',
    stars: 167,
    archived: true,
  },
  {
    name: 'Torrentarr',
    description: {
      fr: "Créer des fichiers .torrent facilement depuis un **container Docker** — pensé pour s'intégrer à un écosystème self-hosted.",
      en: 'Create .torrent files easily from a **Docker container** — designed to fit a self-hosted ecosystem.',
    },
    tags: ['JavaScript', 'Docker', 'Self-hosting'],
    url: 'https://github.com/4Sitam4/Torrentarr',
    stars: 2,
  },
  {
    name: 'artlilou.com',
    description: {
      fr: "Le site de ma sœur, artiste peintre : ==187 œuvres== migrées depuis WordPress, CMS headless ==Directus== **pour qu'elle gère tout elle-même**, vue des toiles **en réalité augmentée**, accessibilité ==WCAG 2.2 AA==. Auto-hébergé sur mon homelab, avec déploiement continu.",
      en: 'My sister\'s website, a painter: ==187 artworks== migrated from WordPress, a headless ==Directus== CMS **so she manages everything herself**, **augmented-reality** view of the paintings, ==WCAG 2.2 AA== accessibility. Self-hosted on my homelab, with continuous deployment.',
    },
    tags: ['Astro', 'Directus', 'PostgreSQL', 'Docker', 'Portainer'],
    live: 'https://artlilou.com',
  },
  {
    name: 'musee.artlilou.com',
    description: {
      fr: "Un **musée virtuel en 3D** relié au site : salle modélisée et pré-éclairée dans ==Blender==, visite libre au clavier ou au joystick sur mobile, œuvres et cadres (12 styles) choisis par l'artiste depuis le CMS.",
      en: 'A **3D virtual museum** linked to the site: a room modelled and pre-lit in ==Blender==, free walk with the keyboard or a joystick on mobile, artworks and frames (12 styles) picked by the artist from the CMS.',
    },
    tags: ['three.js', 'Blender', 'TypeScript', 'WebGL', 'Directus'],
    live: 'https://musee.artlilou.com',
  },
  {
    name: 'Homelab',
    description: {
      fr: "Cluster Proxmox multi-machines, TrueNAS Scale, réseau ==10 Gbps== : **l'infrastructure qui héberge ce site** et mes services.",
      en: 'Multi-machine Proxmox cluster, TrueNAS Scale, ==10 Gbps== networking: **the infrastructure hosting this website** and my services.',
    },
    tags: ['Proxmox', 'TrueNAS', '10GbE', 'Docker'],
    anchor: '#homelab',
  },
  {
    name: 'mathisbecher.com',
    description: {
      fr: 'Ce portfolio : ==Astro + GSAP==, conteneurisé avec Docker, buildé par GitHub Actions et **auto-hébergé sur mon homelab**.',
      en: 'This portfolio: ==Astro + GSAP==, containerized with Docker, built by GitHub Actions and **self-hosted on my homelab**.',
    },
    tags: ['Astro', 'GSAP', 'Docker', 'GitHub Actions'],
    url: 'https://github.com/4Sitam4/Portfolio-mathisbecher.com',
  },
];

export const contactLinks = {
  email: 'contact@mathisbecher.com',
  github: 'https://github.com/4Sitam4',
  linkedin: 'https://www.linkedin.com/in/mathisbecher/',
  /** this site's source code */
  source: 'https://github.com/4Sitam4/Portfolio-mathisbecher.com',
};
