/**
 * Tab completion, bash style (pure function, no DOM):
 *  - first word → command names; then sub-commands or paths;
 *  - one match → completed (dirs end with "/", others with a space);
 *  - several → extended to their common prefix, or listed if it cannot grow.
 */

export interface Entry {
  name: string;
  dir: boolean;
}

export interface CompletionContext {
  commands: string[];
  /** e.g. { terraform: ['apply', 'destroy', 'plan'] } */
  subcommands: Record<string, string[]>;
  /** commands that only take directories (cd) */
  dirsOnly: string[];
  /** entries of a directory written as typed ("", "projects/", "~/", "../") */
  list(typedDir: string): Entry[] | null;
}

export interface Completion {
  line: string;
  /** shown to the user when the completion is ambiguous */
  options: string[];
}

function commonPrefix(values: string[]): string {
  let prefix = values[0] ?? '';
  for (const v of values) {
    while (!v.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function complete(line: string, ctx: CompletionContext): Completion {
  const start = line.length - line.trimStart().length;
  const lastSpace = line.lastIndexOf(' ');
  const head = line.slice(0, lastSpace + 1);
  const word = line.slice(lastSpace + 1);
  const tokens = line.trim().split(/\s+/);
  const first = lastSpace < start; // still typing the command name

  let candidates: string[];
  let shown: (c: string) => string = (c) => c;

  if (first) {
    candidates = ctx.commands.filter((c) => c.startsWith(word));
  } else {
    const cmd = tokens[0] ?? '';
    const subs = ctx.subcommands[cmd];
    if (subs && tokens.length <= 2 && !word.includes('/')) {
      candidates = subs.filter((s) => s.startsWith(word));
    } else {
      const slash = word.lastIndexOf('/');
      const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
      const base = word.slice(slash + 1);
      const entries = ctx.list(dirPart) ?? [];
      const dirsOnly = ctx.dirsOnly.includes(cmd);
      candidates = entries
        .filter((e) => e.name.startsWith(base))
        .filter((e) => base.startsWith('.') || !e.name.startsWith('.'))
        .filter((e) => !dirsOnly || e.dir)
        .map((e) => `${dirPart}${e.name}${e.dir ? '/' : ''}`);
      shown = (c) => c.slice(dirPart.length);
    }
  }

  if (candidates.length === 0) return { line, options: [] };
  if (candidates.length === 1) {
    const only = candidates[0]!;
    return { line: head + only + (only.endsWith('/') ? '' : ' '), options: [] };
  }
  const prefix = commonPrefix(candidates);
  if (prefix.length > word.length) return { line: head + prefix, options: [] };
  return { line, options: candidates.map(shown) };
}
