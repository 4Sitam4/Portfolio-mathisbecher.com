/** Texts of the terminal shell (FR / EN). */

import type { FsCode } from './vfs';

export const NEOFETCH_LOGO = String.raw`
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
      'infos     whoami  neofetch  projects  contact  history  date  uname  uptime',
      'site      lang  terraform apply  matrix  reboot  clear  exit',
      '???       il en reste quelques-unes à découvrir…',
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
      'info      whoami  neofetch  projects  contact  history  date  uname  uptime',
      'site      lang  terraform apply  matrix  reboot  clear  exit',
      '???       a few more are left to discover…',
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
    reset: 'your files are gone, the terminal is as good as new.',
    reboot: 'Broadcast message from root@mathisbecher: the system is going down for reboot NOW.',
    destroy: [
      'Plan: 0 to add, 0 to change, 1 to destroy.',
      'Do you really want to destroy all resources? Only "yes" will be accepted.',
      '… no. This portfolio is in production.',
    ],
  },
} as const;
