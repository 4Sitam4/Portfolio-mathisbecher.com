/** Shared types between the shell and its command modules. */

export type Lang = 'fr' | 'en';

export type Line = string | { text: string; cls?: 'accent' | 'error' | 'dim' | 'art' };

export interface Io {
  lang: Lang;
  /** print lines (or capture them when the command is redirected to a file) */
  out(lines: Line | Line[]): void;
  /** a single on-screen line that a command can animate (sl, ping) */
  live(): HTMLElement;
}

export type Command = (args: string[], io: Io) => void | Promise<void>;
