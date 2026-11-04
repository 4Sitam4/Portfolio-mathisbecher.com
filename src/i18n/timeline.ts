/**
 * Experience and education, newest first. Descriptions accept the emphasis
 * markup of rich.ts: **key idea** and ==concrete fact==.
 */

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
      fr: "Infrastructure cloud ==Azure== en Infrastructure-as-Code. J'ai porté **de bout en bout trois projets majeurs** : la plateforme ==Terramate== qui gère les environnements clients, une plateforme de monitoring multi-tenant sur ==AKS==, et ==Shipyard==, l'outil de déploiement on-prem hors ligne.",
      en: 'Azure cloud infrastructure as code. I led **three major projects end to end**: the ==Terramate== platform that manages customer environments, a multi-tenant monitoring platform on ==AKS==, and ==Shipyard==, the offline on-prem deployment tool.',
    },
    tags: ['Azure', 'Terraform', 'Terramate', 'Kubernetes', 'Go', 'Docker'],
  },
  {
    type: 'edu',
    period: { fr: '2024 — 2027', en: '2024 — 2027' },
    title: { fr: "Architecte de systèmes d'information", en: 'Information Systems Architect' },
    org: 'Epitech',
    location: { fr: 'Strasbourg', en: 'Strasbourg, France' },
    description: {
      fr: 'Cursus **par projets** : systèmes, réseaux, cloud et développement. Diplôme préparé **en alternance**.',
      en: 'Project-based curriculum: systems, networking, cloud and software development. **Work-study** program.',
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
      fr: "Développement web au sein de l'équipe produit — **le stage qui a débouché sur mon alternance** actuelle.",
      en: 'Web development within the product team — **the internship that led to my current apprenticeship**.',
    },
    tags: ['JavaScript', 'HTML/CSS', 'Git'],
  },
  {
    type: 'edu',
    period: { fr: '2023 — 2024', en: '2023 — 2024' },
    title: { fr: "Prépa intégrée d'école d'ingénieur (2e année)", en: 'Integrated engineering prep (2nd year)' },
    org: 'CESI',
    location: { fr: 'Strasbourg', en: 'Strasbourg, France' },
    description: {
      fr: 'Systèmes ==embarqués== et microcontrôleurs, modélisation ==UML/SysML==, compilation, programmation orientée objet, **réseaux et systèmes**.',
      en: '==Embedded== systems and microcontrollers, ==UML/SysML== modelling, compilation, object-oriented programming, **networks and systems**.',
    },
    tags: ['Embedded', 'UML/SysML', 'OOP'],
  },
  {
    type: 'work',
    period: { fr: 'juil. 2022 — juil. 2023', en: 'Jul 2022 — Jul 2023' },
    title: { fr: 'Développeur web (alternance)', en: 'Web Developer (apprentice)' },
    org: 'BFECOM',
    location: { fr: 'Illkirch-Graffenstaden', en: 'Illkirch-Graffenstaden, France' },
    description: {
      fr: "Sites ==WordPress== et ==Shopify== (front-end, PHP, Liquid), **déploiement des serveurs et des CMS**, et gestion du parc informatique de l'entreprise.",
      en: "==WordPress== and ==Shopify== websites (front-end, PHP, Liquid), **deploying the servers and CMSs**, and managing the company's IT fleet.",
    },
    tags: ['WordPress', 'Shopify', 'PHP', 'Liquid', 'Front-end'],
  },
  {
    type: 'edu',
    period: { fr: 'juil. 2022 — juil. 2023', en: 'Jul 2022 — Jul 2023' },
    title: { fr: 'Développeur web', en: 'Web Developer' },
    org: 'OpenClassrooms',
    location: { fr: 'en ligne', en: 'online' },
    description: {
      fr: 'Titre ==RNCP niveau 5 (bac+2)== préparé en alternance chez BFECOM, **à distance et accompagné d’un mentor**.',
      en: '==RNCP level 5 (two-year degree)== qualification, work-study at BFECOM, **remote with a mentor**.',
    },
    tags: ['HTML/CSS', 'JavaScript', 'PHP'],
  },
  {
    type: 'work',
    period: { fr: '2021', en: '2021' },
    title: { fr: 'Technicien SAV', en: 'After-sales Technician' },
    org: 'IIOTECH (franchise LDLC)',
    location: { fr: 'Geispolsheim', en: 'Geispolsheim, France' },
    description: {
      fr: '**Diagnostic et réparation** hardware et software, ==montage de PC== sur mesure et conseil en boutique.',
      en: 'Hardware and software **diagnosis and repair**, custom ==PC builds== and in-store advice.',
    },
    tags: ['Hardware', 'Windows', 'Diagnostic'],
  },
  {
    type: 'edu',
    period: { fr: 'juil. 2017 — août 2017', en: 'Jul 2017 — Aug 2017' },
    title: { fr: 'Piscine', en: 'Piscine (selection bootcamp)' },
    org: 'École 42',
    location: { fr: 'Paris', en: 'Paris, France' },
    description: {
      fr: 'Un mois de sélection **intensive, sept jours sur sept** : ==C==, ==shell== (Bash/Zsh) et ==Git==, en apprentissage entre pairs.',
      en: 'A month-long selection bootcamp, **intensive, seven days a week**: ==C==, ==shell== (Bash/Zsh) and ==Git==, through peer learning.',
    },
    tags: ['C', 'Bash', 'Git'],
  },
];
