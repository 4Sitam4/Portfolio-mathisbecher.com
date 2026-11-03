/**
 * Hero trace: shows the real HTTP response headers of this page and the
 * time-to-first-byte measured by the browser. Nothing here is invented —
 * every value comes from the live response or the Navigation Timing API.
 */

/** Headers worth showing, in display order. Others are ignored. */
const SHOWN_HEADERS = [
  'server',
  'content-type',
  'cache-control',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
] as const;

const STATUS_TEXT: Record<number, string> = { 200: 'OK', 304: 'Not Modified' };

const PROTOCOLS: Record<string, string> = {
  'http/1.0': 'HTTP/1.0',
  'http/1.1': 'HTTP/1.1',
  h2: 'HTTP/2',
  h3: 'HTTP/3',
};

export interface TraceRow {
  key: string;
  value: string;
  kind?: 'status' | 'muted';
}

/** Pure: turn a response into the rows the window displays. */
export function toRows(status: number, statusText: string, protocol: string, headers: Headers): TraceRow[] {
  const proto = PROTOCOLS[protocol] ?? 'HTTP';
  const text = statusText || STATUS_TEXT[status] || '';
  const rows: TraceRow[] = [{ key: `${proto} ${status}`, value: text, kind: 'status' }];
  for (const name of SHOWN_HEADERS) {
    const value = headers.get(name);
    if (value) rows.push({ key: `${name}:`, value });
  }
  return rows;
}

function renderRows(list: HTMLElement, rows: TraceRow[]): HTMLElement[] {
  list.replaceChildren();
  delete list.dataset.pending;
  return rows.map((row) => {
    const wrap = document.createElement('div');
    wrap.className = `trace__row${row.kind ? ` trace__row--${row.kind}` : ''}`;
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = row.key;
    dd.textContent = row.value;
    if (row.kind === 'status') dd.className = 'trace__ok';
    dd.title = row.value;
    wrap.append(dt, dd);
    list.append(wrap);
    return wrap;
  });
}

async function run(): Promise<void> {
  const root = document.getElementById('trace');
  const list = document.getElementById('trace-headers');
  const dot = document.getElementById('trace-dot');
  const state = document.getElementById('trace-state');
  const ttfbEl = document.getElementById('trace-ttfb');
  const timeEl = document.getElementById('trace-time');
  if (!root || !list) return;

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const locale = root.dataset.locale ?? 'fr-FR';

  if (nav && ttfbEl && nav.responseStart > 0) {
    ttfbEl.textContent = `${Math.max(1, Math.round(nav.responseStart - nav.requestStart))} ms`;
  }
  if (timeEl) {
    timeEl.textContent = new Date(performance.timeOrigin).toLocaleTimeString(locale, { hour12: false });
  }

  try {
    const res = await fetch(location.pathname, { method: 'HEAD', cache: 'no-store' });
    const rows = toRows(res.status, res.statusText, nav?.nextHopProtocol ?? '', res.headers);
    const els = renderRows(list, rows);
    dot?.setAttribute('data-state', res.ok ? 'ok' : 'error');
    window.dispatchEvent(new CustomEvent('trace:ready', { detail: els }));
  } catch {
    renderRows(list, [{ key: root.dataset.error ?? 'error', value: '', kind: 'muted' }]);
    dot?.setAttribute('data-state', 'error');
    if (state) state.textContent = 'offline';
  }
}

run();
