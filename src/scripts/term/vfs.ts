/**
 * A tiny in-memory file system for the terminal.
 *
 * The tree starts from a seed (the site's content). Everything the visitor
 * changes is recorded as a short list of operations and saved in their own
 * browser (localStorage) — nothing ever leaves the page. Only ~ and /tmp are
 * writable; `reset` drops the visitor's changes.
 */

export type Seed = { [name: string]: string | Seed };

interface Dir {
  type: 'dir';
  children: Map<string, FsNode>;
}
interface File {
  type: 'file';
  content: string;
}
type FsNode = Dir | File;

type Op = { op: 'mkdir'; path: string } | { op: 'write'; path: string; content: string } | { op: 'rm'; path: string };

export type FsCode = 'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EACCES' | 'EEXIST' | 'ENOTEMPTY' | 'ENOSPC' | 'EINVAL';

export class FsError extends Error {
  constructor(
    readonly code: FsCode,
    readonly path: string
  ) {
    super(`${code}: ${path}`);
  }
}

export const HOME = '/home/visitor';
const STORAGE_KEY = 'mb-term-fs-v1';
const MAX_STORED = 200_000; // characters of saved operations — "disk" size
const MAX_FILE = 20_000;

function build(seed: Seed): Dir {
  const dir: Dir = { type: 'dir', children: new Map() };
  for (const [name, value] of Object.entries(seed)) {
    dir.children.set(name, typeof value === 'string' ? { type: 'file', content: value } : build(value));
  }
  return dir;
}

const clone = (node: FsNode): FsNode =>
  node.type === 'file'
    ? { type: 'file', content: node.content }
    : { type: 'dir', children: new Map([...node.children].map(([k, v]) => [k, clone(v)])) };

export class VFS {
  cwd = HOME;
  private root: Dir;
  private ops: Op[] = [];

  constructor(private readonly seed: Seed) {
    this.root = build(seed);
    this.load();
  }

  /* --- paths ------------------------------------------------------------------ */

  /** Absolute, normalised path ("~", ".", ".." resolved). */
  resolve(path: string, from = this.cwd): string {
    let p = path.trim() || '.';
    if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : `${from}/${p}`).split('/');
    const out: string[] = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return `/${out.join('/')}`;
  }

  /** "~/projects" style, for the prompt. */
  display(abs: string): string {
    if (abs === HOME) return '~';
    return abs.startsWith(`${HOME}/`) ? `~${abs.slice(HOME.length)}` : abs;
  }

  get(abs: string): FsNode | undefined {
    let node: FsNode = this.root;
    for (const part of abs.split('/').filter(Boolean)) {
      if (node.type !== 'dir') return undefined;
      const next = node.children.get(part);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }

  isDir(abs: string): boolean {
    return this.get(abs)?.type === 'dir';
  }

  /** Directory entries, folders first then files, dotfiles only with `all`. */
  list(abs: string, all = false): { name: string; dir: boolean }[] {
    const node = this.get(abs);
    if (!node) throw new FsError('ENOENT', abs);
    if (node.type !== 'dir') return [{ name: abs.split('/').pop() ?? abs, dir: false }];
    return [...node.children]
      .filter(([name]) => all || !name.startsWith('.'))
      .map(([name, n]) => ({ name, dir: n.type === 'dir' }))
      .sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
  }

  read(abs: string): string {
    const node = this.get(abs);
    if (!node) throw new FsError('ENOENT', abs);
    if (node.type === 'dir') throw new FsError('EISDIR', abs);
    return node.content;
  }

  tree(abs: string, all = false): string[] {
    const lines: string[] = [this.display(abs)];
    const walk = (dir: string, prefix: string) => {
      const entries = this.list(dir, all);
      entries.forEach((e, i) => {
        const last = i === entries.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${e.name}${e.dir ? '/' : ''}`);
        if (e.dir) walk(`${dir === '/' ? '' : dir}/${e.name}`, `${prefix}${last ? '    ' : '│   '}`);
      });
    };
    if (!this.isDir(abs)) throw new FsError('ENOTDIR', abs);
    walk(abs, '');
    return lines;
  }

  /* --- changes ------------------------------------------------------------------ */

  writable(abs: string): boolean {
    return [HOME, '/tmp'].some((root) => abs === root || abs.startsWith(`${root}/`));
  }

  private parent(abs: string): { dir: Dir; name: string } {
    const name = abs.split('/').pop() ?? '';
    const parentPath = abs.slice(0, abs.length - name.length - 1) || '/';
    const dir = this.get(parentPath);
    if (!dir) throw new FsError('ENOENT', parentPath);
    if (dir.type !== 'dir') throw new FsError('ENOTDIR', parentPath);
    if (!name) throw new FsError('EINVAL', abs);
    return { dir, name };
  }

  private guard(abs: string): void {
    if (!this.writable(abs) || abs === HOME || abs === '/tmp') throw new FsError('EACCES', abs);
  }

  mkdir(abs: string, parents = false, record = true): void {
    if (parents) {
      const parts = abs.split('/').filter(Boolean);
      let path = '';
      for (const part of parts) {
        path += `/${part}`;
        const node = this.get(path);
        if (node?.type === 'file') throw new FsError('ENOTDIR', path);
        if (!node) this.mkdir(path, false, record);
      }
      return;
    }
    this.guard(abs);
    const { dir, name } = this.parent(abs);
    if (dir.children.has(name)) throw new FsError('EEXIST', abs);
    dir.children.set(name, { type: 'dir', children: new Map() });
    if (record) this.record({ op: 'mkdir', path: abs });
  }

  write(abs: string, content: string, append = false, record = true): void {
    this.guard(abs);
    const { dir, name } = this.parent(abs);
    const existing = dir.children.get(name);
    if (existing?.type === 'dir') throw new FsError('EISDIR', abs);
    const next = append && existing ? existing.content + content : content;
    if (next.length > MAX_FILE) throw new FsError('ENOSPC', abs);
    dir.children.set(name, { type: 'file', content: next });
    if (record) this.record({ op: 'write', path: abs, content: next });
  }

  rm(abs: string, recursive = false, record = true): void {
    this.guard(abs);
    const { dir, name } = this.parent(abs);
    const node = dir.children.get(name);
    if (!node) throw new FsError('ENOENT', abs);
    if (node.type === 'dir' && !recursive) throw new FsError('EISDIR', abs);
    dir.children.delete(name);
    if (record) this.record({ op: 'rm', path: abs });
  }

  copy(src: string, dst: string): void {
    const node = this.get(src);
    if (!node) throw new FsError('ENOENT', src);
    const target = this.isDir(dst) ? `${dst}/${src.split('/').pop()}` : dst;
    if (target === src || target.startsWith(`${src}/`)) throw new FsError('EINVAL', target);
    const put = (n: FsNode, path: string): void => {
      if (n.type === 'file') return this.write(path, n.content);
      this.mkdir(path);
      for (const [k, v] of n.children) put(v, `${path}/${k}`);
    };
    put(clone(node), target);
  }

  move(src: string, dst: string): void {
    this.guard(src);
    this.copy(src, dst);
    this.rm(src, true);
  }

  /** Drop every change made by the visitor. */
  reset(): void {
    this.ops = [];
    this.root = build(this.seed);
    this.cwd = HOME;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  /* --- persistence (visitor's browser only) ------------------------------------- */

  private record(op: Op): void {
    // Keep the log short: a new operation supersedes older ones on the same path.
    this.ops = this.ops.filter(
      (o) => o.path !== op.path && !(op.op === 'rm' && o.path.startsWith(`${op.path}/`))
    );
    this.ops.push(op);
    const json = JSON.stringify(this.ops);
    if (json.length > MAX_STORED) {
      this.ops.pop();
      this.root = build(this.seed);
      this.replay(this.ops);
      throw new FsError('ENOSPC', op.path);
    }
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch {}
  }

  private replay(ops: Op[]): void {
    for (const op of ops) {
      try {
        if (op.op === 'mkdir') this.mkdir(op.path, true, false);
        else if (op.op === 'write') {
          this.mkdir(op.path.slice(0, op.path.lastIndexOf('/')) || '/', true, false);
          this.write(op.path, op.content, false, false);
        } else this.rm(op.path, true, false);
      } catch {
        /* an operation that no longer applies is skipped */
      }
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw || raw.length > MAX_STORED) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      // Data from storage is untrusted: keep only well-formed operations.
      const ops = parsed.filter(
        (o): o is Op =>
          !!o &&
          typeof o.path === 'string' &&
          (o.op === 'mkdir' || o.op === 'rm' || (o.op === 'write' && typeof o.content === 'string'))
      );
      this.ops = ops;
      this.replay(ops);
    } catch {
      this.ops = [];
    }
  }
}
