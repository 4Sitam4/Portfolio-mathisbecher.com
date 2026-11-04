/** The tech-logo sprite referenced by TechLogo.astro (see components/logo-sprite.ts). */
import type { APIRoute } from 'astro';
import { SPRITE_SVG } from '../components/logo-sprite';

export const GET: APIRoute = () =>
  new Response(SPRITE_SVG, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
