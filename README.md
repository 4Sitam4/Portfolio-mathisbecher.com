# mathisbecher.com

Mon portfolio de Cloud Infrastructure Engineer — en ligne sur **[mathisbecher.com](https://mathisbecher.com)**, auto-hébergé sur mon homelab.

*My Cloud Infrastructure Engineer portfolio, self-hosted on my homelab (French / English).*

## Le concept

La page se construit sous vos yeux, avec le vocabulaire visuel de l'infrastructure. Au chargement, une séquence de boot s'affiche, puis chaque bloc du site apparaît : des curseurs tirent un cadre de sélection autour de lui (nom du bloc façon `module.hero.name`, dimensions, guides) et une ligne de scan le révèle. Au scroll, ce qui sort de l'écran s'efface (cadre rouge) et ce qui y entre se reconstruit, d'autant plus vite que vous scrollez vite.

C'est une animation : aucun vrai Terraform ne tourne dans votre navigateur.

Autres détails :

- **Trace live** : le hero affiche les vrais en-têtes HTTP de la page que vous venez de charger et le temps de réponse mesuré par votre navigateur.
- **Terminal interactif** : un petit shell sur un système de fichiers virtuel. `ls`, `cd`, `tree`, `cat`, `mkdir`, `touch`, `rm`, `mv`, `cp`, `echo … > fichier`, un éditeur `nano` (`^O` / `^X`), la complétion avec Tab et l'historique. Ce que vous créez reste uniquement dans votre navigateur (`reset` pour tout effacer). Quelques easter eggs sont à découvrir…
- **Pluie matrix** en canvas, avec un double tampon pour que les traînées disparaissent complètement.
- **Navigation latérale** cachée, qui pousse la page et se construit / se déconstruit.
- **CV PDF généré depuis le site** : la page `/cv/` (une sélection cloud / DevOps, dans `src/i18n/cv.ts`) est imprimée en PDF au build, en FR et en EN, avec Chrome headless. Le build échoue si le CV dépasse une page A4. L'image d'aperçu des liens (`og.png`) est générée de la même façon.
- **Mode lecture** : un bouton coupe toutes les animations pour ceux qui veulent juste lire (choix mémorisé dans le navigateur).
- **Accessible** : contenu lisible sans JavaScript, `prefers-reduced-motion` respecté (aucune animation), navigation au clavier.
- **Bilingue** FR / EN.

## Stack

| | |
|---|---|
| Site | [Astro](https://astro.build) (100 % statique), TypeScript, [GSAP](https://gsap.com) |
| Polices | IBM Plex Sans, JetBrains Mono (auto-hébergées via Fontsource) |
| Conteneur | Build multi-stage → `nginx-unprivileged` (non-root), en-têtes de sécurité, CSP |
| CI | GitHub Actions : build de l'image et publication sur GHCR à chaque push sur `main` |
| Hébergement | Homelab Proxmox, container géré par Portainer, derrière Cloudflare (proxy) et un reverse proxy TLS |

## Lancer en local

Prérequis : Node.js ≥ 22.23, et Chrome ou Chromium pour générer le CV PDF et l'image d'aperçu (sinon cette étape est sautée avec un avertissement ; chemin personnalisé via `CHROME_BIN`).

```bash
npm ci
npm run dev      # http://localhost:4321
npm run build    # site statique dans dist/, CV PDF et og.png compris
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
├── i18n/        textes FR / EN et données : ui.ts, timeline.ts (parcours), cv.ts
│                (**gras** et ==vert== dans les textes : voir rich.ts)
├── layouts/      squelette HTML, SEO, décision du boot avant le premier rendu
├── scripts/      effets : provision*.ts (construction / effacement), matrix, trace
│   └── term/     terminal : système de fichiers, complétion, nano, easter eggs
└── styles/       design tokens (global.css) et styles des effets
scripts/render-assets.mjs                 CV PDF et og.png, après le build
nginx.conf, nginx/security-headers.conf   serveur et en-têtes de sécurité
```

## Licence

- **Code** (composants, scripts, styles, configuration) : [MIT](LICENSE). Réutilisez les effets, le terminal ou la config librement.
- **Contenu personnel** (textes, nom, parcours, descriptions de projets et toute information me concernant) : tous droits réservés. Merci de ne pas le reprendre tel quel.
