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

    'hero.role': 'Cloud Infrastructure Engineer',
    'hero.tagline':
      "Je construis des infrastructures cloud, j'automatise tout ce qui peut l'être… et j'auto-héberge le reste.",
    'hero.status': 'Alternant chez Open Lake Technology, étudiant à Epitech (promo 2027)',
    'hero.cta.projects': 'Voir mes projets',
    'hero.cta.terminal': 'Ouvrir le terminal',

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
      "Je suis étudiant à Epitech (architecte de systèmes d'information, promo 2027) et alternant Cloud Infrastructure Engineer chez Open Lake Technology, où je travaille sur de l'infrastructure Azure avec Terraform et Terramate.",
    'about.p2':
      "Mon fil rouge : l'indépendance numérique. Plutôt que de dépendre des services des GAFAM, je monte, configure et maintiens ma propre infrastructure : un homelab avec cluster Proxmox, stockage TrueNAS Scale et réseau 10 Gbps. Ce portfolio tourne dessus.",
    'about.p3':
      "Du hardware au cloud en passant par le réseau et le CI/CD : j'aime comprendre toute la pile, pas juste une couche.",

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
      "Les deux plus gros projets de mon alternance. À chaque fois, j'ai identifié le besoin, choisi la solution, puis conçu, développé et livré le projet de bout en bout.",
    'projects.perso': 'perso',
    'projects.need': 'Le besoin',
    'projects.solution': 'La solution',
    'projects.role': 'Mon rôle',
    'projects.private': 'Repo privé',

    'homelab.title': 'homelab',
    'homelab.intro':
      'Mon terrain de jeu permanent : plusieurs machines physiques en cluster Proxmox, une machine TrueNAS Scale pour le stockage, le tout interconnecté en 10 Gbps.',
    'homelab.stat1.value': 'Proxmox VE',
    'homelab.stat1.label': 'cluster multi-nœuds',
    'homelab.stat2.value': 'TrueNAS Scale',
    'homelab.stat2.label': 'stockage réseau',
    'homelab.stat3.value': '10 Gbps',
    'homelab.stat3.label': 'backbone réseau',
    'homelab.stat4.value': '100 %',
    'homelab.stat4.label': 'auto-hébergé',
    'homelab.here': 'vous êtes ici',
    'homelab.diagram':
      'Schéma du homelab : internet, routeur et pare-feu, switch 10GbE, cluster Proxmox, TrueNAS Scale, puis les VMs et containers Docker dont le nginx qui sert ce site.',

    'term.title': 'terminal',
    'term.hint': 'Un vrai petit shell pour explorer ce portfolio. Tapez une commande ou essayez :',
    'term.input': 'Invite de commande',

    'contact.title': 'contact',
    'contact.intro':
      'Une opportunité, une question, ou juste envie de parler homelab ? Ma boîte mail est ouverte.',
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

    'hero.role': 'Cloud Infrastructure Engineer',
    'hero.tagline':
      'I build cloud infrastructure, automate everything that can be automated… and self-host the rest.',
    'hero.status': 'Apprentice at Open Lake Technology, student at Epitech (class of 2027)',
    'hero.cta.projects': 'View my projects',
    'hero.cta.terminal': 'Open the terminal',

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
      "I'm a student at Epitech (information systems architecture, class of 2027) and an apprentice Cloud Infrastructure Engineer at Open Lake Technology, working on Azure infrastructure with Terraform and Terramate.",
    'about.p2':
      'My common thread: digital independence. Rather than relying on big-tech services, I build, configure and maintain my own infrastructure: a homelab with a Proxmox cluster, TrueNAS Scale storage and 10 Gbps networking. This portfolio runs on it.',
    'about.p3':
      'From hardware to cloud, through networking and CI/CD: I like understanding the whole stack, not just one layer.',

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
      'The two biggest projects of my apprenticeship. Each time, I identified the need, chose the solution, then designed, built and shipped the project end to end.',
    'projects.perso': 'personal',
    'projects.need': 'The need',
    'projects.solution': 'The solution',
    'projects.role': 'My role',
    'projects.private': 'Private repo',

    'homelab.title': 'homelab',
    'homelab.intro':
      'My permanent playground: several physical machines running as a Proxmox cluster, a TrueNAS Scale box for storage, all interconnected at 10 Gbps.',
    'homelab.stat1.value': 'Proxmox VE',
    'homelab.stat1.label': 'multi-node cluster',
    'homelab.stat2.value': 'TrueNAS Scale',
    'homelab.stat2.label': 'network storage',
    'homelab.stat3.value': '10 Gbps',
    'homelab.stat3.label': 'network backbone',
    'homelab.stat4.value': '100%',
    'homelab.stat4.label': 'self-hosted',
    'homelab.here': 'you are here',
    'homelab.diagram':
      'Homelab diagram: internet, router and firewall, 10GbE switch, Proxmox cluster, TrueNAS Scale, then the VMs and Docker containers including the nginx serving this site.',

    'term.title': 'terminal',
    'term.hint': 'A small working shell to explore this portfolio. Type a command or try:',
    'term.input': 'Command prompt',

    'contact.title': 'contact',
    'contact.intro':
      'An opportunity, a question, or just want to talk homelab? My inbox is open.',
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

/* --------------------------------------------------------------------------
   Structured content (experience, skills, projects) — localized fields
   -------------------------------------------------------------------------- */

export interface TimelineEntry {
  type: 'work' | 'edu';
  period: { fr: string; en: string };
  title: { fr: string; en: string };
  org: string;
  location: { fr: string; en: string };
  description: { fr: string; en: string };
  tags: string[];
}

export const timeline: TimelineEntry[] = [
  {
    type: 'work',
    period: { fr: "janv. 2025 — aujourd'hui", en: 'Jan 2025 — present' },
    title: { fr: 'Alternant DevOps / Cloud Infrastructure Engineer', en: 'DevOps / Cloud Infrastructure Engineer (apprentice)' },
    org: 'Open Lake Technology',
    location: { fr: 'Paris · full remote', en: 'Paris · full remote' },
    description: {
      fr: "Infrastructure cloud Azure en Infrastructure-as-Code. J'ai porté de bout en bout deux projets majeurs : la plateforme Terramate qui gère les environnements clients, et Shipyard, l'outil de déploiement on-prem hors ligne.",
      en: 'Azure cloud infrastructure as code. I led two major projects end to end: the Terramate platform that manages customer environments, and Shipyard, the offline on-prem deployment tool.',
    },
    tags: ['Azure', 'Terraform', 'Terramate', 'Go', 'Docker', 'GitHub Actions'],
  },
  {
    type: 'edu',
    period: { fr: '2024 — 2027', en: '2024 — 2027' },
    title: { fr: "Architecte de systèmes d'information", en: 'Information Systems Architect' },
    org: 'Epitech',
    location: { fr: 'Strasbourg', en: 'Strasbourg, France' },
    description: {
      fr: "Cursus par projets : systèmes, réseaux, cloud et développement. Diplôme préparé en alternance.",
      en: 'Project-based curriculum: systems, networking, cloud and software development. Work-study program.',
    },
    tags: ['Systèmes', 'Cloud', 'Projets'],
  },
  {
    type: 'work',
    period: { fr: 'mars 2024 — juil. 2024', en: 'Mar 2024 — Jul 2024' },
    title: { fr: 'Stagiaire développement web', en: 'Web Development Intern' },
    org: 'Open Lake Technology',
    location: { fr: 'full remote', en: 'full remote' },
    description: {
      fr: "Développement web au sein de l'équipe produit — le stage qui a débouché sur mon alternance actuelle.",
      en: 'Web development within the product team — the internship that led to my current apprenticeship.',
    },
    tags: ['JavaScript', 'HTML/CSS', 'Git'],
  },
  {
    type: 'edu',
    period: { fr: '2023 — 2024', en: '2023 — 2024' },
    title: { fr: 'Ingénieur en informatique (1re année)', en: 'Computer Science Engineering (1st year)' },
    org: 'CESI',
    location: { fr: 'Strasbourg', en: 'Strasbourg, France' },
    description: {
      fr: 'Première année de cycle ingénieur informatique, avant de rejoindre Epitech.',
      en: 'First year of a CS engineering degree, before joining Epitech.',
    },
    tags: ['Informatique'],
  },
  {
    type: 'work',
    period: { fr: 'juil. 2022 — juil. 2023', en: 'Jul 2022 — Jul 2023' },
    title: { fr: 'Développeur web (alternance)', en: 'Web Developer (apprentice)' },
    org: 'BFECOM',
    location: { fr: 'Illkirch-Graffenstaden', en: 'Illkirch-Graffenstaden, France' },
    description: {
      fr: 'Création et maintenance de sites WordPress : développement front-end, PHP, intégration.',
      en: 'Building and maintaining WordPress websites: front-end development, PHP, integration.',
    },
    tags: ['WordPress', 'PHP', 'Front-end'],
  },
];

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
    items: ['Docker', 'Docker Compose', 'Proxmox VE', 'TrueNAS Scale', 'Linux'],
  },
  {
    key: 'skills.dev',
    prompt: 'git push origin main',
    items: ['Go', 'Python', 'JavaScript', 'HTML/CSS', 'PHP', 'YAML/JSON', 'Bash'],
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
      fr: "Chaque environnement client avait son propre repo Terraform : la même infrastructure était copiée dans des dizaines de repos et chaque changement commun devait être refait partout, à la main.",
      en: 'Every customer environment had its own Terraform repo: the same infrastructure was copied across dozens of repos, and every shared change had to be redone everywhere, by hand.',
    },
    solution: {
      fr: "Un monorepo Terramate et un catalogue de modules Terraform versionnés. Chaque environnement est une stack isolée qui hérite de ses valeurs sur trois niveaux et active ce dont il a besoin par feature flags ; le code Terraform est généré, et la détection de changements git ne cible que les stacks concernées. La migration s'est faite à côté de la production : déploiement en parallèle, validation, bascule DNS, puis décommissionnement de l'ancien.",
      en: 'A Terramate monorepo plus a catalogue of versioned Terraform modules. Each environment is an isolated stack that inherits its values over three levels and turns on what it needs through feature flags; the Terraform code is generated, and git change detection only targets the affected stacks. The migration ran next to production: parallel deployment, validation, DNS cutover, then decommissioning of the old setup.',
    },
    role: {
      fr: "J'ai identifié le problème, proposé Terramate, conçu l'architecture, écrit la grande majorité du code et des modules, mené la migration et documenté le tout.",
      en: 'I identified the problem, proposed Terramate, designed the architecture, wrote the vast majority of the code and modules, ran the migration and documented it all.',
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
      fr: "Installer la stack produit chez des clients sur des VM durcies, sans accès Internet et sous politiques de sécurité strictes, reposait sur environ 3 000 lignes de scripts bash et PowerShell.",
      en: 'Installing the product stack at customers on hardened VMs, with no internet access and under strict security policies, relied on about 3,000 lines of bash and PowerShell scripts.',
    },
    solution: {
      fr: "Une application web en Go (SSO Entra ID) qui génère en quelques minutes un kit d'installation autonome : images épinglées par digest, sommes SHA256 vérifiées, double-clic sur Windows Server ou une commande sur Linux. Un moteur d'installation en Go, idempotent et reprenable, remplace les scripts ; chaque révision livrée est conservée pour appliquer un correctif en quelques secondes.",
      en: 'A Go web app (Entra ID SSO) that builds a self-contained install kit in minutes: images pinned by digest, verified SHA256 sums, a double-click on Windows Server or one command on Linux. An idempotent, resumable Go install engine replaces the scripts; every delivered revision is kept so a hotfix can be applied in seconds.',
    },
    role: {
      fr: "Seul développeur : besoin, architecture (décisions documentées en ADR), code, tests, pipeline CI DevSecOps, infrastructure Azure en Terraform et validation sur un lab de VM Windows et Linux. En production chez des clients depuis la V1.0.",
      en: 'Sole developer: need, architecture (decisions recorded as ADRs), code, tests, DevSecOps CI pipeline, Azure infrastructure in Terraform and validation on a lab of Windows and Linux VMs. In production at customers since V1.0.',
    },
    figures: [
      { value: '~18k', label: { fr: 'lignes de Go', en: 'lines of Go' } },
      { value: '124', label: { fr: 'tests automatisés', en: 'automated tests' } },
      { value: '2', label: { fr: "familles d'OS : Windows Server et Linux", en: 'OS families: Windows Server and Linux' } },
    ],
    tags: ['Go', 'Docker', 'Portainer', 'WSL2', 'Azure Container Apps', 'Terraform', 'GitHub Actions', 'Trivy'],
  },
];

export interface Project {
  name: string;
  description: { fr: string; en: string };
  tags: string[];
  url?: string;
  /** in-page anchor, for projects documented on this page */
  anchor?: string;
  stars?: number;
  archived?: boolean;
}

export const projects: Project[] = [
  {
    name: 'Romifleur',
    description: {
      fr: "Application open source développée en Dart/Flutter — mon projet le plus populaire sur GitHub.",
      en: 'Open source app built with Dart/Flutter — my most popular project on GitHub.',
    },
    tags: ['Dart', 'Flutter'],
    url: 'https://github.com/4Sitam4/Romifleur',
    stars: 167,
    archived: true,
  },
  {
    name: 'Torrentarr',
    description: {
      fr: "Créer des fichiers .torrent facilement depuis un container Docker — pensé pour s'intégrer à un écosystème self-hosted.",
      en: 'Create .torrent files easily from a Docker container — designed to fit a self-hosted ecosystem.',
    },
    tags: ['JavaScript', 'Docker', 'Self-hosting'],
    url: 'https://github.com/4Sitam4/Torrentarr',
    stars: 2,
  },
  {
    name: 'Homelab',
    description: {
      fr: "Cluster Proxmox multi-machines, TrueNAS Scale, réseau 10 Gbps : l'infrastructure qui héberge ce site et mes services.",
      en: 'Multi-machine Proxmox cluster, TrueNAS Scale, 10 Gbps networking: the infrastructure hosting this website and my services.',
    },
    tags: ['Proxmox', 'TrueNAS', '10GbE', 'Docker'],
    anchor: '#homelab',
  },
  {
    name: 'mathisbecher.com',
    description: {
      fr: 'Ce portfolio : Astro + GSAP, conteneurisé avec Docker, buildé par GitHub Actions et auto-hébergé sur mon homelab.',
      en: 'This portfolio: Astro + GSAP, containerized with Docker, built by GitHub Actions and self-hosted on my homelab.',
    },
    tags: ['Astro', 'GSAP', 'Docker', 'GitHub Actions'],
    url: 'https://github.com/4Sitam4',
  },
];

export const contactLinks = {
  email: 'contact@mathisbecher.com',
  github: 'https://github.com/4Sitam4',
  linkedin: 'https://www.linkedin.com/in/mathisbecher/',
};
