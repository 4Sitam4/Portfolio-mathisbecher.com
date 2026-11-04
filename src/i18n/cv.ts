/**
 * The one-page CV (/cv/ and /en/cv/), printed to PDF at build time
 * (scripts/render-assets.mjs). A cloud / DevOps selection of the site's
 * content, rewritten short to fit one A4 page (the build checks it).
 * Texts accept the emphasis markup of rich.ts: **key idea**, ==fact==.
 */
import type { Lang } from './ui';

type L = Record<Lang, string>;

export const cvPdf: L = {
  fr: '/cv/Mathis-Becher-CV.pdf',
  en: '/en/cv/Mathis-Becher-CV-EN.pdf',
};

export const cvText = {
  fr: {
    title: 'CV — Mathis Becher, Cloud Infrastructure Engineer',
    profile: 'Profil',
    experience: 'Expérience',
    personal: 'Projets personnels',
    education: 'Formation',
    contact: 'Contact',
    skills: 'Compétences',
    homelab: 'Homelab',
    languages: 'Langues',
    interests: "Centres d'intérêt",
    generated: 'CV généré depuis mathisbecher.com',
    updated: 'mis à jour le',
    download: 'Télécharger le PDF',
    back: 'Retour au site',
  },
  en: {
    title: 'Résumé — Mathis Becher, Cloud Infrastructure Engineer',
    profile: 'Profile',
    experience: 'Experience',
    personal: 'Personal projects',
    education: 'Education',
    contact: 'Contact',
    skills: 'Skills',
    homelab: 'Homelab',
    languages: 'Languages',
    interests: 'Interests',
    generated: 'Résumé generated from mathisbecher.com',
    updated: 'updated on',
    download: 'Download the PDF',
    back: 'Back to the site',
  },
} as const;

export interface CvJob {
  title: L;
  org: string;
  period: L;
  meta: L;
  text?: L;
  /** highlights, one line or two each */
  items?: { name: string; text: L }[];
  tags?: string[];
}

export const cv = {
  profile: {
    fr: "Ingénieur cloud en alternance (Epitech, promo 2027). J'**automatise l'infrastructure Azure** en ==Terraform==, je fais tourner des plateformes sur ==Kubernetes== et je **livre mes projets de bout en bout**, du besoin à la production. Le reste du temps, j'administre mon propre homelab.",
    en: 'Apprentice cloud engineer (Epitech, class of 2027). I **automate Azure infrastructure** with ==Terraform==, run platforms on ==Kubernetes== and **ship my projects end to end**, from the need to production. The rest of the time, I run my own homelab.',
  } satisfies L,

  jobs: [
    {
      title: { fr: 'DevOps / Cloud Infrastructure Engineer', en: 'DevOps / Cloud Infrastructure Engineer' },
      org: 'Open Lake Technology',
      period: { fr: "mars 2024 — aujourd'hui", en: 'Mar 2024 — present' },
      meta: { fr: 'stage puis alternance · full remote', en: 'internship, then apprenticeship · full remote' },
      items: [
        {
          name: 'Terramate',
          text: {
            fr: "Migration de ==16 environnements de production== vers un monorepo Terramate et ==45 modules Terraform== partagés : **un changement commun ne se fait plus qu'une fois**. Solution proposée, architecture, code et migration en parallèle de la production.",
            en: '==16 production environments== migrated to a Terramate monorepo and ==45 shared Terraform modules==: **a shared change is now made once**. Proposed the solution, designed it, wrote it and ran the migration alongside production.',
          },
        },
        {
          name: 'AKS multi-tenant',
          text: {
            fr: "Plateforme de monitoring sur **un seul cluster AKS** (Cilium, cert-manager, Grafana en SSO Entra ID) : ==10 tenants isolés==, un tenant de plus = ==1 terraform apply==, logs ingérés ==÷40==. Migration **sans perte de données**.",
            en: 'Monitoring platform on **a single AKS cluster** (Cilium, cert-manager, Grafana with Entra ID SSO): ==10 isolated tenants==, one more tenant = ==1 terraform apply==, log ingestion ==÷40==. **Zero-data-loss** migration.',
          },
        },
        {
          name: 'Shipyard',
          text: {
            fr: "**Seul développeur** d'un outil en ==Go== qui génère des kits d'installation hors ligne pour serveurs durcis Windows et Linux. Remplace ~3 000 lignes de scripts ; ==124 tests==, CI DevSecOps (Trivy). **En production chez des clients.**",
            en: '**Sole developer** of a ==Go== tool that builds offline install kits for hardened Windows and Linux servers. Replaces ~3,000 lines of scripts; ==124 tests==, DevSecOps CI (Trivy). **In production at customers.**',
          },
        },
      ],
      tags: ['Azure', 'Terraform', 'Terramate', 'AKS', 'Helm', 'Go', 'Docker', 'GitHub Actions'],
    },
    {
      title: { fr: 'Développeur web (alternance)', en: 'Web Developer (apprentice)' },
      org: 'BFECOM',
      period: { fr: 'juil. 2022 — juil. 2023', en: 'Jul 2022 — Jul 2023' },
      meta: { fr: 'Illkirch-Graffenstaden', en: 'Illkirch-Graffenstaden, France' },
      text: {
        fr: "**Déploiement des serveurs et des CMS**, sites ==WordPress== et ==Shopify==, gestion du parc informatique de l'entreprise.",
        en: "**Deploying servers and CMSs**, ==WordPress== and ==Shopify== websites, managing the company's IT fleet.",
      },
    },
  ] satisfies CvJob[],

  projects: [
    {
      name: 'artlilou.com',
      text: {
        fr: "Site d'une artiste peintre : CMS headless ==Directus==, ==187 œuvres== migrées depuis WordPress, musée virtuel en 3D. **Auto-hébergé sur mon homelab**, avec déploiement continu.",
        en: "A painter's website: headless ==Directus== CMS, ==187 artworks== migrated from WordPress, a 3D virtual museum. **Self-hosted on my homelab**, with continuous deployment.",
      },
    },
    {
      name: 'Romifleur',
      stars: 167,
      text: {
        fr: "Application open source en ==Dart/Flutter== : **mon projet le plus suivi sur GitHub**.",
        en: 'Open source ==Dart/Flutter== app: **my most followed project on GitHub**.',
      },
    },
  ] satisfies { name: string; stars?: number; text: L }[],

  education: [
    {
      title: { fr: "Architecte de systèmes d'information (alternance)", en: 'Information Systems Architect (work-study)' },
      org: 'Epitech',
      period: { fr: '2024 — 2027', en: '2024 — 2027' },
    },
    {
      title: { fr: "Prépa intégrée d'école d'ingénieur (2e année)", en: 'Integrated engineering prep (2nd year)' },
      org: 'CESI',
      period: { fr: '2023 — 2024', en: '2023 — 2024' },
    },
    {
      title: { fr: 'Développeur web, RNCP niveau 5 (bac+2)', en: 'Web Developer, RNCP level 5 (2-year degree)' },
      org: 'OpenClassrooms',
      period: { fr: '2022 — 2023', en: '2022 — 2023' },
    },
  ],

  skills: [
    { name: { fr: 'Cloud et IaC', en: 'Cloud and IaC' }, items: 'Azure (AKS, Container Apps, Entra ID) · Terraform · Terramate' },
    { name: { fr: 'Conteneurs', en: 'Containers' }, items: 'Kubernetes · Helm · Cilium · Docker' },
    { name: { fr: 'CI/CD et sécurité', en: 'CI/CD and security' }, items: 'GitHub Actions · Trivy · Git' },
    { name: { fr: 'Observabilité', en: 'Observability' }, items: 'Elasticsearch · Grafana' },
    { name: { fr: 'Langages', en: 'Languages' }, items: 'Go · Bash · Python' },
    { name: { fr: 'Systèmes et réseau', en: 'Systems and network' }, items: 'Linux · Windows Server · Proxmox · TrueNAS · 10 GbE' },
  ] satisfies { name: L; items: string }[],

  homelab: {
    fr: "Cluster ==Proxmox==, stockage ==TrueNAS Scale==, réseau ==10 GbE==. Héberge en conteneurs ce site et artlilou.com : images construites par GitHub Actions, publiées sur GHCR, **conteneurs non-root**.",
    en: 'A ==Proxmox== cluster, ==TrueNAS Scale== storage, ==10 GbE== networking. Hosts this site and artlilou.com in containers: images built by GitHub Actions, published to GHCR, **non-root containers**.',
  } satisfies L,

  languages: { fr: 'Français (natif) · Anglais (C1)', en: 'French (native) · English (C1)' } satisfies L,

  interests: {
    fr: 'Self-hosting · Counter-Strike en équipe, haut niveau · Voyages',
    en: 'Self-hosting · Competitive team Counter-Strike · Travel',
  } satisfies L,
};
