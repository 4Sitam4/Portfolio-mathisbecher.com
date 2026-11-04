/**
 * Every brand logo the site uses, in one external SVG sprite (/logos.svg):
 * cached by the browser instead of being repeated in each page's HTML.
 * The ?v= hash changes with the content, so a new logo is never stale.
 */
import { brandSymbols } from './icons';
import { projects, skillGroups, timeline, workProjects } from '../i18n/ui';

const symbols = brandSymbols([
  ...skillGroups.flatMap((g) => g.items),
  ...timeline.flatMap((e) => e.tags),
  ...workProjects.flatMap((p) => p.tags),
  ...projects.flatMap((p) => p.tags),
]);

export const SPRITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg">${symbols
  .map((s) => `<symbol id="${s.id}" viewBox="${s.viewBox}"><path d="${s.path}"/></symbol>`)
  .join('')}</svg>\n`;

/** FNV-1a: a cache-busting version, not a security hash. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const SPRITE_URL = `/logos.svg?v=${fnv1a(SPRITE_SVG)}`;
