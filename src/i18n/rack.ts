/**
 * Hover cards of the 3D rack (Rack3D.astro). Specs come from the machines
 * themselves (pveversion, lscpu, free, lsblk…); nothing that identifies the
 * network (no addresses, no serials).
 */
import type { Lang } from './ui';

export type RackDevice = 'switch' | 'lab' | 'pve1' | 'pve2' | 'truenas';
export interface RackCard {
  title: string;
  lines: string[];
}
/** The mug on the rack: its card is live (temperature as it cools down). */
export interface MugTexts {
  title: string;
  temp: string;
  /** [from °C, status], hottest first */
  status: [number, string][];
}

export const rackCards: Record<Lang, Record<RackDevice, RackCard>> = {
  fr: {
    switch: { title: 'switch · Cisco Nexus 3064-T', lines: ['48 ports 10GBASE-T · 4 × 40G QSFP+', 'le cœur du réseau, 10 GbE vers chaque nœud'] },
    lab: { title: 'homelab de ma compagne', lines: ['son terrain de jeu'] },
    pve1: {
      title: 'pve1 · Proxmox VE 9',
      lines: ['Core i9-9900KF · 8 cœurs / 16 threads', '32 Go de RAM · 3 SSD', 'Intel Arc A380 · 10 GbE'],
    },
    pve2: {
      title: 'pve2 · Proxmox VE 9',
      lines: ['Core i9-13900K · 24 cœurs / 32 threads', '~80 Go de RAM · 3 NVMe de 1 To · 10 GbE', '7 VM, 14 LXC · héberge ce site'],
    },
    truenas: {
      title: 'truenas · TrueNAS SCALE 25.04',
      lines: ['HP ProLiant DL380p Gen8 · Xeon E5-2697 v2 · 384 Go', 'ZFS : 32,7 To (Tank) + 5,4 To + SSD et NVMe', 'Portainer : pilote tous les conteneurs'],
    },
  },
  en: {
    switch: { title: 'switch · Cisco Nexus 3064-T', lines: ['48 × 10GBASE-T · 4 × 40G QSFP+', 'the heart of the network, 10 GbE to every node'] },
    lab: { title: "my partner's homelab", lines: ['her playground'] },
    pve1: {
      title: 'pve1 · Proxmox VE 9',
      lines: ['Core i9-9900KF · 8 cores / 16 threads', '32 GB RAM · 3 SSDs', 'Intel Arc A380 · 10 GbE'],
    },
    pve2: {
      title: 'pve2 · Proxmox VE 9',
      lines: ['Core i9-13900K · 24 cores / 32 threads', '~80 GB RAM · 3 × 1 TB NVMe · 10 GbE', '7 VMs, 14 LXC · serves this site'],
    },
    truenas: {
      title: 'truenas · TrueNAS SCALE 25.04',
      lines: ['HP ProLiant DL380p Gen8 · Xeon E5-2697 v2 · 384 GB', 'ZFS: 32.7 TB (Tank) + 5.4 TB + SSD and NVMe', 'Portainer: drives every container'],
    },
  },
};

export const mugTexts: Record<Lang, MugTexts> = {
  fr: {
    title: 'café · posé sur le rack',
    temp: 'temp :',
    status: [
      [50, 'parfait, à boire maintenant'],
      [40, 'ça refroidit, faut se dépêcher'],
      [30, 'tiède… il fallait le boire avant'],
      [0, 'froid, oublié sur le rack, comme d’habitude'],
    ],
  },
  en: {
    title: 'coffee · left on the rack',
    temp: 'temp:',
    status: [
      [50, 'just right, drink it now'],
      [40, 'cooling down, better hurry'],
      [30, 'lukewarm… should have drunk it earlier'],
      [0, 'cold, forgotten on the rack, as usual'],
    ],
  },
};
