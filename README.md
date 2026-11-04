# mathisbecher.com

Mon portfolio de Cloud Infrastructure Engineer — en ligne sur **[mathisbecher.com](https://mathisbecher.com)**, auto-hébergé sur mon homelab.

*My Cloud Infrastructure Engineer portfolio, self-hosted on my homelab (French / English).*

## Le concept

La page se construit comme une infrastructure : au chargement, le homelab « démarre », puis un `terraform apply` provisionne chaque bloc du site. Des curseurs tirent des cadres de sélection autour de chaque ressource (`module.hero.name`, dimensions, guides) et une ligne de scan la révèle. Au scroll, ce qui sort de l'écran est détruit (`terraform destroy`) et ce qui y entre est reconstruit, à une vitesse proportionnelle à celle du scroll.

Autres détails :

- **Trace live** : le hero affiche les vrais en-têtes HTTP de la page que vous venez de charger et le temps de réponse mesuré par votre navigateur.
- **Terminal interactif** : `help`, `whoami`, `neofetch`, `ls projects`, `terraform apply`…
- **Pluie matrix** en canvas, avec un double tampon pour que les traînées disparaissent complètement.
- **Navigation latérale** cachée, qui pousse la page et se construit / se déconstruit.
- **Accessible** : contenu lisible sans JavaScript, `prefers-reduced-motion` respecté (aucune animation), navigation au clavier.
- **Bilingue** FR / EN.

## Stack

| | |
|---|---|
| Site | [Astro](https://astro.build) (100 % statique), TypeScript, [GSAP](https://gsap.com) |
| Polices | IBM Plex Sans, JetBrains Mono (auto-hébergées via Fontsource) |
| Conteneur | Build multi-stage → `nginx-unprivileged` (non-root), en-têtes de sécurité, CSP |
| CI | GitHub Actions : build de l'image et publication sur GHCR à chaque push sur `main` |
| Hébergement | Homelab Proxmox, container géré par Portainer derrière un reverse proxy TLS |

## Lancer en local

Prérequis : Node.js ≥ 22.23.

```bash
npm ci
npm run dev      # http://localhost:4321
npm run build    # site statique dans dist/
npm run preview  # sert dist/
npx astro check  # vérification des types
```

## Docker

```bash
docker build -t portfolio .
docker run --rm -p 8080:8080 portfolio   # http://localhost:8080
```

L'image publiée : `ghcr.io/4sitam4/portfolio-mathisbecher.com:latest`. Le fichier [`portainer-stack.yml`](portainer-stack.yml) donne un exemple de stack (port exposé ou reverse proxy type Traefik).

## Structure

```
src/
├── components/   sections de la page (Hero, Projects, Homelab, Terminal…)
├── i18n/ui.ts    tous les textes FR / EN et les données (parcours, projets…)
├── layouts/      squelette HTML, SEO, décision du boot avant le premier rendu
├── scripts/      effets : provision*.ts (apply / destroy), matrix, terminal, trace
└── styles/       design tokens (global.css) et styles des effets
nginx.conf, nginx/security-headers.conf   serveur et en-têtes de sécurité
```
