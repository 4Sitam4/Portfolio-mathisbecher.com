/**
 * Icons, resolved at build time (never shipped as JS):
 *  - UI icons: a small subset of Lucide (ISC), drawn with a 1.5 stroke.
 *  - Tech logos: Simple Icons (CC0), filled, monochrome. Brands missing from
 *    it are vendored below from Devicon and Bootstrap Icons (both MIT); the
 *    few left without a logo fall back to a UI icon.
 */
import * as si from 'simple-icons';

export const UI = {
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  graduation:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  server:
    '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  userCheck:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  network:
    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  layers:
    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  loop: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
} as const;

export type UiIcon = keyof typeof UI;

/** Section key → icon (headings and side nav). */
export const SECTION_ICON: Record<string, UiIcon> = {
  about: 'user',
  experience: 'route',
  skills: 'wrench',
  projects: 'folder',
  homelab: 'server',
  terminal: 'terminal',
  contact: 'mail',
};

type Brand = { kind: 'brand'; id: string; viewBox: string; path: string };
type Logo = Brand | { kind: 'ui'; name: UiIcon };

/**
 * Brands Simple Icons does not carry (Microsoft had its logos removed), as
 * single-colour paths: Azure and Terramate from Devicon (MIT,
 * github.com/devicons/devicon), Windows from Bootstrap Icons (MIT,
 * github.com/twbs/icons).
 */
const EXTRA: Record<string, { viewBox: string; path: string }> = {
  xAzure: {
    viewBox: '0 0 128 128',
    path: 'M43.983 4.653a5.91 5.91 0 0 1 5.6 4.022l35.91 106.396a5.91 5.91 0 0 1-5.603 7.802h41.38a5.92 5.92 0 0 0 4.8-2.465a5.91 5.91 0 0 0 .798-5.34L90.961 8.672a5.91 5.91 0 0 0-5.602-4.022zm-1.336.478a5.92 5.92 0 0 0-5.61 4.029L1.132 115.55a5.91 5.91 0 0 0 5.6 7.8h28.893c1.239 0 2.446-.41 3.452-1.113a5.92 5.92 0 0 0 2.157-2.916l7.019-20.71l-13.411-12.857c-.246-.273-1.353-2.274-.369-4.002c1.108-1.659 2.955-1.659 2.955-1.659h17.285l9.074-26.145L48.274 8.321c-.042-.205-.914-1.365-2.281-2.28c-1.37-.915-3.345-.909-3.345-.909zm-4.88 75.74a2.724 2.724 0 0 0-1.86 4.718l37.83 35.31c1.101 1.03 2.502 1.631 4.007 1.631c0 0 1.282.068 2.055-.033c1.817-.273 3.525-1.768 4.09-2.39c1.457-1.939.794-4.95.794-4.95l-11.45-34.28z',
  },
  xWindows: {
    viewBox: '0 0 16 16',
    path: 'M6.555 1.375L0 2.237v5.45h6.555zM0 13.795l6.555.933V8.313H0zm7.278-5.4l.026 6.378L16 16V8.395zM16 0L7.33 1.244v6.414H16z',
  },
  xTerramate: {
    viewBox: '0 0 128 128',
    path: 'M23.992 11.913c.596.41.952 1.083.952 1.803v36.791c0 1.951-2.374 2.929-3.764 1.55L4.392 35.414a2.18 2.18 0 0 1-.647-1.551V2.195C3.745.428 5.74-.612 7.204.392zm41.712 80.423a2.216 2.216 0 0 1-3.14.022L30.1 60.164a2.18 2.18 0 0 1-.648-1.55V19.78c0-1.767 1.996-2.807 3.46-1.803l13.231 9.079c.369.253.806.388 1.254.388h33.667a2.2 2.2 0 0 0 1.255-.388l12.919-8.867c1.463-1.004 3.46.036 3.46 1.802v37.757c0 .57-.225 1.119-.625 1.528zm57.927-58.354c.4-.41.624-.957.624-1.528V2.514c0-1.766-1.996-2.807-3.458-1.803l-16.64 11.414a2.19 2.19 0 0 0-.952 1.803v35.516c0 1.967 2.407 2.938 3.787 1.528zM4.438 108.662a2.2 2.2 0 0 1-.693-1.595V79.732c0-1.943 2.356-2.924 3.751-1.562l15.55 15.18c.426.415.664.984.66 1.577l-.177 26.54c-.013 1.914-2.316 2.893-3.718 1.581zm60.628-10.224c-.131.132-.292.23-.468.284a2.4 2.4 0 0 1-.35.08a1.1 1.1 0 0 1-.587-.072a1.1 1.1 0 0 1-.365-.242l-8.356-8.285c-1.39-1.379-3.764-.4-3.764 1.55v23.54c0 .587.237 1.15.658 1.561l10.757 10.517a2.216 2.216 0 0 0 3.121-.027l9.724-9.834c.405-.41.632-.961.632-1.535V92.598c0-1.967-2.406-2.937-3.787-1.528zm42.932-13.77c-1.38 1.394-3.764.432-3.778-1.521l-.157-23.572c-.004-.575.22-1.13.624-1.542l15.781-16.117c1.381-1.41 3.787-.439 3.787 1.528v23.914c0 .574-.227 1.127-.633 1.536zm-84.07-24.3a2.18 2.18 0 0 0-.647-1.565L7.508 43.165c-1.39-1.378-3.763-.4-3.763 1.55v24.239c0 .587.237 1.15.66 1.562l15.613 15.24c1.39 1.355 3.739.387 3.752-1.55zm80.355 33.652a2.18 2.18 0 0 1 .634-1.551l15.56-15.707c1.384-1.397 3.777-.424 3.777 1.537v29.086c0 .604-.25 1.181-.693 1.595l-15.377 14.387c-1.403 1.312-3.705.332-3.718-1.581z',
  },
};

// Label as written on the site → Simple Icons export, or a UI fallback.
const TECH: Record<string, string | UiIcon> = {
  azure: 'xAzure',
  'azure container apps': 'xAzure',
  'container apps': 'xAzure',
  'entra id': 'shield',
  'azure backup': 'xAzure',
  terraform: 'siTerraform',
  terramate: 'xTerramate',
  'github actions': 'siGithubactions',
  'ci/cd': 'loop',
  git: 'siGit',
  docker: 'siDocker',
  'docker compose': 'siDocker',
  kubernetes: 'siKubernetes',
  'kubernetes (aks)': 'siKubernetes',
  aks: 'siKubernetes',
  helm: 'siHelm',
  cilium: 'siCilium',
  'cert-manager': 'lock',
  'proxmox ve': 'siProxmox',
  proxmox: 'siProxmox',
  'truenas scale': 'siTruenas',
  truenas: 'siTruenas',
  linux: 'siLinux',
  'windows server': 'xWindows',
  windows: 'xWindows',
  wsl2: 'siLinux',
  portainer: 'siPortainer',
  trivy: 'shield',
  go: 'siGo',
  python: 'siPython',
  javascript: 'siJavascript',
  typescript: 'siTypescript',
  'html/css': 'siHtml5',
  php: 'siPhp',
  c: 'siC',
  'yaml/json': 'siYaml',
  bash: 'siGnubash',
  grafana: 'siGrafana',
  elasticsearch: 'siElasticsearch',
  astro: 'siAstro',
  gsap: 'zap',
  dart: 'siDart',
  flutter: 'siFlutter',
  directus: 'siDirectus',
  postgresql: 'siPostgresql',
  'three.js': 'siThreedotjs',
  blender: 'siBlender',
  webgl: 'siWebgl',
  wordpress: 'siWordpress',
  shopify: 'siShopify',
  liquid: 'siShopify',
  'front-end': 'code',
  'networking 10gbe': 'network',
  '10gbe': 'network',
  hardware: 'cpu',
  'self-hosting': 'home',
  'dns/dhcp': 'globe',
  firewalling: 'shield',
  'private networking': 'lock',
  systèmes: 'server',
  cloud: 'cloud',
  projets: 'folder',
  embedded: 'cpu',
  'uml/sysml': 'layers',
  oop: 'code',
  diagnostic: 'wrench',
};

export function techLogo(label: string): Logo | null {
  const ref = TECH[label.trim().toLowerCase()];
  if (!ref) return null;
  const extra = EXTRA[ref];
  if (extra) return { kind: 'brand', id: `logo-${ref.slice(1).toLowerCase()}`, ...extra };
  if (ref.startsWith('si')) {
    const icon = (si as unknown as Record<string, { path: string } | undefined>)[ref];
    return icon ? { kind: 'brand', id: `logo-${ref.slice(2).toLowerCase()}`, viewBox: '0 0 24 24', path: icon.path } : null;
  }
  return { kind: 'ui', name: ref as UiIcon };
}

/** Brand logos used by these labels, once each: drawn once in a sprite, then referenced. */
export function brandSymbols(labels: Iterable<string>): Brand[] {
  const out = new Map<string, Brand>();
  for (const label of labels) {
    const logo = techLogo(label);
    if (logo?.kind === 'brand') out.set(logo.id, logo);
  }
  return [...out.values()];
}
