/** sitemap.xml: the two language versions of the page, linked to each other. */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const alternates = [
    ['fr', '/'],
    ['en', '/en/'],
    ['x-default', '/'],
  ]
    .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url(path)}"/>`)
    .join('\n');
  const today = new Date().toISOString().slice(0, 10);
  const entry = (path: string) =>
    `  <url>\n    <loc>${url(path)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry('/')}
${entry('/en/')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
