/**
 * GPU side of the hero portrait (holo3d.ts): the glyph atlas and the shaders.
 *
 * A glyph is shown once "rained" into place. Two ways to rain:
 * - own timing (fallback): each column starts at its own time, the glyph
 *   falls a little and lands with a white flash;
 * - the hero background rain (uRain = 1): a glyph lights up when the head of
 *   the background column it sits in passes over it, flashing white just
 *   behind the head — the portrait is built by the rain behind it;
 * - a scan reveal (uRain = 2): a line sweeps down and the glyphs appear as it
 *   passes (quiet rebuilds, after the first one).
 */
import { CanvasTexture, SRGBColorSpace } from 'three';

const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const LATIN = '0123456789$>#=+*';
const ATLAS = 8; // 8×8 glyph cells
const GLYPH_COUNT = KANA.length + LATIN.length;

export const FALL = 1.1; // own rain speed, units/s
export const FALL_LEAD = 0.22; // s a glyph is seen falling before it lands
/** Extra brightness of the glyphs along the silhouette (rim light). */
const RIM = 0.6;
/** Light kept on the base cap, which the bottom fade would otherwise erase. */
const BASE_LIGHT = 0.55;
/** Scan reveal (rebuilds after the first): line speed, units/s. */
export const REVEAL = 1.6;
/** Background rain columns tracked at once (more than any canvas spans). */
export const RAIN_COLS = 64;

export function glyphAtlas(): CanvasTexture {
  const px = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px * ATLAS;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [...KANA, ...LATIN].slice(0, ATLAS * ATLAS).forEach((ch, i) => {
    const kana = i < KANA.length;
    ctx.save();
    ctx.translate((i % ATLAS) * px + px / 2, Math.floor(i / ATLAS) * px + px / 2);
    if (kana) ctx.scale(-1, 1); // mirrored, as in the film
    ctx.font = kana
      ? `700 ${px * 0.86}px "MS Gothic", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", monospace`
      : `700 ${px * 0.74}px "JetBrains Mono", monospace`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export const vertexShader = /* glsl */ `
  attribute float aLum;
  attribute float aSize;
  attribute float aSeed;
  attribute float aLand;
  uniform float uTime;
  uniform float uBuild;
  uniform float uSize;
  uniform float uScan;
  uniform float uGlitch;
  uniform float uBottom;
  uniform float uBias;
  uniform float uRain; // 0 own rain, 1 background rain, 2 scan reveal
  uniform float uTop;
  uniform vec4 uCanvas; // this canvas inside the rain canvas: left, top, width, height (CSS px)
  uniform float uFont;  // rain column width (CSS px)
  uniform float uCol0;  // first tracked column
  uniform float uReach[${RAIN_COLS}];
  uniform float uVeil;
  varying float vBright;
  varying float vFlash;
  varying float vGlyph;
  varying float vFade;
  varying float vVeil;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec3 p = position;
    float t = uBuild - aLand; // own timing: s since this glyph landed
    float lag = (uTop - position.y) / ${REVEAL.toFixed(2)}; // scan reveal: when the line passes
    if (uRain > 1.5) {
      if (uBuild < lag) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 0.0;
        return;
      }
    } else if (uRain < 0.5) {
      if (t < -${FALL_LEAD.toFixed(2)}) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 0.0;
        return;
      }
      p.y += max(-t, 0.0) * ${FALL.toFixed(2)}; // still falling
    }
    float band = 1.0 - smoothstep(0.0, 0.05, abs(p.y - uScan));
    p.x += band * uGlitch * (hash(aSeed * 91.0 + floor(uTime * 24.0)) - 0.5) * 0.05;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float flash = t < 0.0 ? 1.0 : exp(-t * 3.5);
    if (uRain > 1.5) flash = exp(-(uBuild - lag) * 6.0);
    else if (uRain > 0.5) {
      // where this glyph is on the background rain, and how far its column's head got
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vec2 q = uCanvas.xy + vec2(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5) * uCanvas.zw;
      int col = int(floor(q.x / uFont) - uCol0);
      float reach = (col >= 0 && col < ${RAIN_COLS}) ? uReach[col] : 1e6;
      if (q.y > reach) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 0.0;
        return;
      }
      flash = exp(-(reach - q.y) / (uFont * 2.5));
    }
#ifdef OCCLUDER
    // depth pass: a disc per glyph, pushed back a little along the view ray,
    // so only glyphs clearly behind the nearest surface get hidden. It also
    // veils what lies behind the bust (the background rain), fading out
    // with the bust at the bottom.
    mv.xyz += normalize(mv.xyz) * uBias;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize / -mv.z;
    vVeil = uVeil * max(smoothstep(uBottom, uBottom + 0.32, position.y), step(0.9, -normal.y));
    return;
#endif
    gl_PointSize = uSize * aSize * (0.8 + 0.45 * aLum) / -mv.z;
    // glyphs turned away fade out softly at the silhouette
    float facing = dot(normalize(normalMatrix * normal), normalize(-mv.xyz));

    vFlash = flash;
    float shimmer = 0.88 + 0.12 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 40.0);
    // rim light: glyphs seen edge-on, along the silhouette, glow brighter
    float rim = smoothstep(0.55, 0.08, facing) * smoothstep(-0.18, 0.04, facing);
    vBright = aLum * shimmer + band * 0.7 + ${RIM.toFixed(2)} * rim;
    float rate = 0.15 + 1.6 * fract(aSeed * 7.13);
    vGlyph = mod(floor(aSeed * 61.0 + uTime * rate), ${GLYPH_COUNT}.0);
    // the bust dissolves toward its cut at the bottom; the base cap (facing
    // down) stays, dimmer, so the bust is closed when seen from below
    float base = step(0.9, -normal.y) * ${BASE_LIGHT.toFixed(2)};
    vFade = max(smoothstep(uBottom, uBottom + 0.32, position.y), base) * smoothstep(-0.2, 0.12, facing);
  }`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  varying float vBright;
  varying float vFlash;
  varying float vGlyph;
  varying float vFade;
  void main() {
    float gx = mod(vGlyph, ${ATLAS}.0);
    float gy = floor(vGlyph / ${ATLAS}.0);
    vec2 pc = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    float a = texture2D(uAtlas, (pc + vec2(gx, ${ATLAS - 1}.0 - gy)) / ${ATLAS}.0).a;
    vec3 green = vec3(0.0, 1.0, 0.616);
    vec3 white = vec3(0.82, 1.0, 0.92);
    vec3 col = mix(green, white, max(vFlash, smoothstep(0.85, 1.3, vBright)));
    float b = 0.3 + 2.1 * pow(clamp(vBright, 0.0, 1.4), 1.25);
    // light only: alpha stays 0, so the page shows through (pure additive)
    gl_FragColor = vec4(col * a * b * vFade, 0.0);
  }`;

/** Depth pass: round discs, the page's own background colour, mostly opaque
 * (premultiplied), so the rain behind the bust is hidden, not seen through. */
export const occluderFragment = /* glsl */ `
  uniform vec3 uBg;
  varying float vVeil;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(uBg * vVeil, vVeil);
  }`;
