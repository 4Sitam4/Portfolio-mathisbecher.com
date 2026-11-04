/** Texts of the terminal shell (FR / EN). */

import type { FsCode } from './vfs';

export const LOGO = String.raw`
 ███╗   ███╗ ██████╗
 ████╗ ████║ ██╔══██╗
 ██╔████╔██║ ██████╔╝
 ██║╚██╔╝██║ ██╔══██╗
 ██║ ╚═╝ ██║ ██████╔╝
 ╚═╝     ╚═╝ ╚═════╝`;

export const STR = {
  fr: {
    welcome: ['mathisbecher.com — session invité ouverte.', "tapez 'help' pour la liste des commandes, Tab pour compléter."],
    help: [
      'fichiers  ls [-a]  cd  pwd  tree  cat  nano  mkdir [-p]  touch  rm [-r]  mv  cp',
      "          echo … > fichier   reset (efface vos fichiers)",
      'infos     whoami  fastfetch  projects  contact  history  date  uname  uptime',
      'site      lang  terraform apply  matrix  reboot  clear  exit',
      '???       il en reste quelques-unes à découvrir… ou tapez help -a pour tout voir',
    ],
    whoami: [
      'Mathis Becher — Cloud Infrastructure Engineer.',
      'Alternant chez Open Lake Technology, étudiant à Epitech (promo 2027).',
      "Je monte des infras cloud le jour, et j'auto-héberge la nuit.",
    ],
    errors: {
      ENOENT: 'Aucun fichier ou dossier de ce nom',
      ENOTDIR: "N'est pas un dossier",
      EISDIR: 'Est un dossier',
      EACCES: 'Permission non accordée',
      EEXIST: 'Le fichier existe',
      ENOTEMPTY: "Le dossier n'est pas vide",
      ENOSPC: "Plus d'espace disponible (dans votre navigateur)",
      EINVAL: 'Argument invalide',
    } satisfies Record<FsCode, string>,
    notFound: (c: string) => `${c} : commande introuvable — essayez 'help'`,
    usage: (u: string) => `usage : ${u}`,
    sudo: "visitor n'est pas dans le fichier sudoers. Cet incident sera signalé. ;)",
    rmrf: ['suppression du homelab en cours…', '…', 'non. <3 vos données sont en sécurité (RAID + snapshots).'],
    matrix: 'réveille-toi, Neo…',
    exit: 'déconnexion. à bientôt.',
    langSwitch: 'bascule vers la version anglaise…',
    uptime: 'up depuis toujours (ou presque) — 99,9 % de disponibilité homelab',
    neofetch: "neofetch est archivé depuis avril 2024. Place à son successeur, fastfetch :",
    reset: 'vos fichiers ont été effacés, le terminal est comme neuf.',
    reboot: 'Broadcast message from root@mathisbecher: le système redémarre MAINTENANT.',
    destroy: [
      'Plan: 0 to add, 0 to change, 1 to destroy.',
      'Do you really want to destroy all resources? Only "yes" will be accepted.',
      '… non. Ce portfolio est en production.',
    ],
  },
  en: {
    welcome: ['mathisbecher.com — guest session opened.', "type 'help' to list commands, Tab to complete."],
    help: [
      'files     ls [-a]  cd  pwd  tree  cat  nano  mkdir [-p]  touch  rm [-r]  mv  cp',
      '          echo … > file   reset (wipes your files)',
      'info      whoami  fastfetch  projects  contact  history  date  uname  uptime',
      'site      lang  terraform apply  matrix  reboot  clear  exit',
      '???       a few more are left to discover… or type help -a to see them all',
    ],
    whoami: [
      'Mathis Becher — Cloud Infrastructure Engineer.',
      'Apprentice at Open Lake Technology, student at Epitech (class of 2027).',
      'I build cloud infrastructure by day, and self-host by night.',
    ],
    errors: {
      ENOENT: 'No such file or directory',
      ENOTDIR: 'Not a directory',
      EISDIR: 'Is a directory',
      EACCES: 'Permission denied',
      EEXIST: 'File exists',
      ENOTEMPTY: 'Directory not empty',
      ENOSPC: 'No space left on device (your browser)',
      EINVAL: 'Invalid argument',
    } satisfies Record<FsCode, string>,
    notFound: (c: string) => `${c}: command not found — try 'help'`,
    usage: (u: string) => `usage: ${u}`,
    sudo: 'visitor is not in the sudoers file. This incident will be reported. ;)',
    rmrf: ['deleting homelab…', '…', 'no. <3 your data is safe (RAID + snapshots).'],
    matrix: 'wake up, Neo…',
    exit: 'logout. see you around.',
    langSwitch: 'switching to the French version…',
    uptime: 'up since forever (almost) — 99.9% homelab availability',
    neofetch: 'neofetch has been archived since April 2024. Here is its successor, fastfetch:',
    reset: 'your files are gone, the terminal is as good as new.',
    reboot: 'Broadcast message from root@mathisbecher: the system is going down for reboot NOW.',
    destroy: [
      'Plan: 0 to add, 0 to change, 1 to destroy.',
      'Do you really want to destroy all resources? Only "yes" will be accepted.',
      '… no. This portfolio is in production.',
    ],
  },
} as const;

/** help -a: every command, secrets included, grouped. */
export const HELP_ALL: Record<'fr' | 'en', { title: string; items: [string, string][] }[]> = {
  fr: [
    {
      title: 'fichiers',
      items: [
        ['ls [-a]', 'lister (-a : fichiers cachés compris)'],
        ['cd [dossier]', 'changer de dossier (cd .. · cd - · cd ~)'],
        ['pwd', 'dossier courant'],
        ['tree [-a]', 'arborescence'],
        ['cat <fichier>', 'afficher un fichier'],
        ['nano <fichier>', 'éditer (^O écrire · ^X quitter · ^K couper · ^U coller)'],
        ['mkdir [-p] <dossier>', 'créer un dossier'],
        ['touch <fichier>', 'créer un fichier vide'],
        ['rm [-r] <chemin>', 'supprimer'],
        ['mv · cp [-r]', 'déplacer · copier'],
        ['echo … > fichier', 'écrire (>> pour ajouter à la fin)'],
        ['reset', 'effacer vos fichiers (ils ne vivent que dans votre navigateur)'],
      ],
    },
    {
      title: 'infos',
      items: [
        ['help [-a]', 'aide (-a : tout, secrets compris)'],
        ['whoami', 'qui suis-je'],
        ['fastfetch', 'infos système'],
        ['projects', 'mes projets'],
        ['contact', 'me contacter'],
        ['history', 'commandes précédentes (!! rejoue la dernière)'],
        ['date · uname -a · uptime · id', 'infos machine'],
      ],
    },
    {
      title: 'site',
      items: [
        ['lang', 'basculer FR ⇄ EN'],
        ['terraform apply', 'rejouer la construction de la page'],
        ['matrix', 'pluie matrix plein écran'],
        ['reboot', 'relancer la séquence de boot'],
        ['clear', "nettoyer l'écran (ou Ctrl+L)"],
        ['exit', 'fermer la session'],
      ],
    },
    {
      title: 'secrets',
      items: [
        ['fortune', 'une citation infra au hasard'],
        ['cowsay [texte]', 'une vache qui parle'],
        ['sl', 'vous vouliez taper ls ?'],
        ['neofetch', "l'ancien, archivé en 2024"],
        ['ping', 'vraie latence jusqu’à mon homelab (via Cloudflare)'],
        ['docker ps', 'le conteneur de ce site'],
        ['kubectl get pods', 'Kubernetes à la maison ?'],
        ['ssh homelab', 'tentez votre chance'],
        ['vim · vi · nvim · emacs · :q', 'la guerre des éditeurs'],
        ['make me a sandwich', 'puis avec sudo (xkcd)'],
        ['coffee · brew', 'HTTP 418'],
        ['terraform plan · destroy', 'en production, attention'],
        ['rm -rf /', "n'ayez pas peur"],
        ['sudo', 'bien tenté'],
        ['hire · hire-me', "m'écrire, tout simplement"],
        ['ls -a ~', 'deux fichiers cachés : .secret et .bash_history'],
        ['Tab · Ctrl+C · ↑ ↓', 'complétion, annuler, historique'],
      ],
    },
  ],
  en: [
    {
      title: 'files',
      items: [
        ['ls [-a]', 'list (-a: hidden files too)'],
        ['cd [dir]', 'change directory (cd .. · cd - · cd ~)'],
        ['pwd', 'current directory'],
        ['tree [-a]', 'directory tree'],
        ['cat <file>', 'print a file'],
        ['nano <file>', 'edit (^O write · ^X exit · ^K cut · ^U paste)'],
        ['mkdir [-p] <dir>', 'create a directory'],
        ['touch <file>', 'create an empty file'],
        ['rm [-r] <path>', 'delete'],
        ['mv · cp [-r]', 'move · copy'],
        ['echo … > file', 'write (>> to append)'],
        ['reset', 'wipe your files (they only live in your browser)'],
      ],
    },
    {
      title: 'info',
      items: [
        ['help [-a]', 'help (-a: everything, secrets included)'],
        ['whoami', 'who am I'],
        ['fastfetch', 'system info'],
        ['projects', 'my projects'],
        ['contact', 'reach me'],
        ['history', 'previous commands (!! replays the last one)'],
        ['date · uname -a · uptime · id', 'machine info'],
      ],
    },
    {
      title: 'site',
      items: [
        ['lang', 'switch FR ⇄ EN'],
        ['terraform apply', 'replay the page build'],
        ['matrix', 'full-screen matrix rain'],
        ['reboot', 'replay the boot sequence'],
        ['clear', 'clear the screen (or Ctrl+L)'],
        ['exit', 'close the session'],
      ],
    },
    {
      title: 'secrets',
      items: [
        ['fortune', 'a random infra quote'],
        ['cowsay [text]', 'a talking cow'],
        ['sl', 'did you mean ls?'],
        ['neofetch', 'the old one, archived in 2024'],
        ['ping', 'real latency to my homelab (through Cloudflare)'],
        ['docker ps', 'the container serving this site'],
        ['kubectl get pods', 'Kubernetes at home?'],
        ['ssh homelab', 'try your luck'],
        ['vim · vi · nvim · emacs · :q', 'the editor war'],
        ['make me a sandwich', 'then with sudo (xkcd)'],
        ['coffee · brew', 'HTTP 418'],
        ['terraform plan · destroy', 'careful, this is production'],
        ['rm -rf /', 'do not be afraid'],
        ['sudo', 'nice try'],
        ['hire · hire-me', 'just write to me'],
        ['ls -a ~', 'two hidden files: .secret and .bash_history'],
        ['Tab · Ctrl+C · ↑ ↓', 'completion, cancel, history'],
      ],
    },
  ],
};
