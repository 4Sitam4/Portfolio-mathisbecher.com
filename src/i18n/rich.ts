/**
 * Light emphasis markup for the site's texts:
 *   **words**  → key idea, bold and bright (white)
 *   ==words==  → concrete fact (tech, figure, result), in the accent color
 * Texts stay plain strings; this only splits them into segments.
 */

export interface Segment {
  text: string;
  kind: 'plain' | 'strong' | 'key';
}

const MARKUP = /\*\*(.+?)\*\*|==(.+?)==/g;

export function parseRich(input: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of input.matchAll(MARKUP)) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), kind: 'plain' });
    out.push(m[1] !== undefined ? { text: m[1], kind: 'strong' } : { text: m[2]!, kind: 'key' });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), kind: 'plain' });
  return out;
}

/** The same text without markup (terminal, meta tags). */
export const plain = (input: string): string => input.replace(MARKUP, (_, strong, key) => strong ?? key);
