/**
 * The hero monogram, in real time (three.js): "MB" on a 5×7 terminal grid,
 * built by a Matrix rain. Each column's rain lights the pixels it reaches;
 * once the 38 pixels are up, the rain stops and fades out, leaving the
 * monogram alone. It can be turned freely (drag, touch, arrow keys) before,
 * during and after the build. Look and sizes come from the Blender mock-up.
 * Only loaded with effects on (see Logo3D.astro); reading mode shows a still.
 */
import {
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* --- the monogram ------------------------------------------------------------ */

const GLYPHS: Record<string, string[]> = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
  B: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'],
};
const CELL = 0.1; // pixel pitch
const SIZE = 0.084; // pixel size: a small gap, like a CRT grid
const DEPTH = 0.06;
const COLS = 11; // M, a blank column, B
const ROWS = 7;
const colX = (c: number) => (c - (COLS - 1) / 2) * CELL;
const rowY = (r: number) => ((ROWS - 1) / 2 - r) * CELL;
const LOGO_BOTTOM = rowY(ROWS - 1) - CELL / 2;

/* --- the rain ---------------------------------------------------------------- */

const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
const LATIN = '0123456789$>#=+*';
const ATLAS = 8; // 8×8 glyph cells
const TRAIL = [0.95, 0.7, 0.5, 0.36, 0.25, 0.17, 0.11, 0.06];
const STREAM_LEN = TRAIL.length + 1; // head + trail
const SPACING = 0.105;
const TOP = 1.1; // streams start above the frame
const FADE_OUT_BELOW = 0.25; // glyphs vanish this far under the logo
const RAIN_FADE = 1.6; // seconds for the rain to fade once the logo is built
const MAX_SPIN = 4; // rad/s: a flick spins it, never wildly
// Idle motion: a slow sway left and right around the front, never upside down.
const SWAY = 0.45; // rad (≈ 26°) each side
const SWAY_SPEED = (Math.PI * 2) / 8; // one full left-right-left in 8 s
const TILT = 0.12; // rad, seen slightly from above
const IDLE_RETURN = 3000; // ms without interaction before going back to the sway

const GREEN = new Color(0x00ff9d);
/** The canvas overflows its box by this factor (CSS inset), so a turned
 * monogram can spill out instead of being cut. Framing still follows the box. */
const OVERDRAW = 1.6;

function glyphAtlas(): CanvasTexture {
  const px = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px * ATLAS;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = [...KANA, ...LATIN].slice(0, ATLAS * ATLAS);
  chars.forEach((ch, i) => {
    const x = (i % ATLAS) * px + px / 2;
    const y = Math.floor(i / ATLAS) * px + px / 2;
    const kana = i < KANA.length;
    ctx.save();
    ctx.translate(x, y);
    if (kana) ctx.scale(-1, 1); // mirrored, as in the film
    ctx.font = kana
      ? `${px * 0.78}px "MS Gothic", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", monospace`
      : `600 ${px * 0.72}px "JetBrains Mono", monospace`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Fine horizontal lines for the pixels' glow (CRT scanlines). */
function scanlines(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 12;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < 12; y++) {
    const v = 0.72 + 0.28 * Math.sin((y / 12) * Math.PI * 2) ** 2;
    ctx.fillStyle = `rgb(${Math.round(255 * v)},${Math.round(255 * v)},${Math.round(255 * v)})`;
    ctx.fillRect(0, y, 1, 1);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 6);
  tex.magFilter = NearestFilter;
  return tex;
}

interface Pixel {
  mesh: Mesh<RoundedBoxGeometry, MeshStandardMaterial>;
  col: number;
  y: number;
  base: number;
  /** seconds since it lit up, -1 while dark */
  age: number;
}

interface Stream {
  col: number;
  y: number;
  speed: number;
  glyphs: number[];
}

export interface Logo3D {
  /** (re)play the Matrix build from an empty grid */
  build(): void;
  /** back to an empty grid and a fresh rain, ready for the next build */
  reset(): void;
}

export function mountLogo3D(host: HTMLElement): Logo3D {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'logo3d__canvas';
  host.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 3.1);

  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(-2, 2.5, 3);
  scene.add(key);
  const rim = new DirectionalLight(0x9dffd6, 0.8);
  rim.position.set(2.5, 1.5, -2);
  scene.add(rim);

  // Everything the visitor turns: the monogram and its rain.
  const root = new Group();
  const swayPose = (phase: number, out = new Quaternion()) =>
    out.setFromEuler(new Euler(TILT, SWAY * Math.sin(phase), 0, 'XYZ'));
  root.quaternion.copy(swayPose(0));
  scene.add(root);

  /* pixels */
  const rand = mulberry32(7);
  const geo = new RoundedBoxGeometry(SIZE, SIZE, DEPTH, 2, 0.006);
  const lines = scanlines();
  const pixels: Pixel[] = [];
  [...'MB'].forEach((ch, li) => {
    GLYPHS[ch]!.forEach((line, r) => {
      [...line].forEach((px, c) => {
        if (px !== 'X') return;
        const base = 0.75 + 0.25 * rand();
        const mat = new MeshStandardMaterial({
          color: 0x03140b,
          roughness: 0.45,
          metalness: 0.15,
          emissive: GREEN,
          emissiveMap: lines,
          emissiveIntensity: base,
        });
        const mesh = new Mesh(geo, mat);
        const col = li * 6 + c;
        mesh.position.set(colX(col), rowY(r), 0);
        mesh.scale.setScalar(0);
        root.add(mesh);
        pixels.push({ mesh, col, y: rowY(r), base, age: -1 });
      });
    });
  });

  /* rain: one stream per grid column, nothing outside the monogram */
  const atlas = glyphAtlas();
  const rainMat = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uAtlas: { value: atlas }, uFade: { value: 1 }, uFloor: { value: LOGO_BOTTOM - FADE_OUT_BELOW } },
    vertexShader: /* glsl */ `
      attribute float aGlyph;
      attribute float aBright;
      varying vec2 vUv;
      varying float vBright;
      varying float vY;
      void main() {
        float gx = mod(aGlyph, ${ATLAS}.0);
        float gy = floor(aGlyph / ${ATLAS}.0);
        vUv = (uv + vec2(gx, ${ATLAS - 1}.0 - gy)) / ${ATLAS}.0;
        vBright = aBright;
        vec4 local = instanceMatrix * vec4(position, 1.0);
        vY = local.y;
        gl_Position = projectionMatrix * modelViewMatrix * local;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas;
      uniform float uFade;
      uniform float uFloor;
      varying vec2 vUv;
      varying float vBright;
      varying float vY;
      void main() {
        float a = texture2D(uAtlas, vUv).a;
        vec3 green = vec3(0.0, 1.0, 0.616);
        vec3 head = vec3(0.78, 1.0, 0.9);
        vec3 col = vBright > 1.5 ? head : green;
        float b = min(vBright, 1.0);
        float floorFade = smoothstep(uFloor, uFloor + 0.18, vY);
        gl_FragColor = vec4(col, a * b * uFade * floorFade);
      }`,
  });
  const streams: Stream[] = [];
  for (let c = 0; c < COLS; c++) {
    streams.push({
      col: c,
      y: TOP + rand() * 0.9,
      speed: 0.85 + rand() * 0.4,
      glyphs: Array.from({ length: STREAM_LEN }, () => Math.floor(rand() * (KANA.length + LATIN.length))),
    });
  }
  const count = streams.length * STREAM_LEN;
  const plane = new PlaneGeometry(SPACING * 0.95, SPACING * 0.95);
  const rain = new InstancedMesh(plane, rainMat, count);
  const aGlyph = new InstancedBufferAttribute(new Float32Array(count), 1).setUsage(DynamicDrawUsage);
  const aBright = new InstancedBufferAttribute(new Float32Array(count), 1);
  for (let s = 0; s < streams.length; s++) {
    for (let k = 0; k < STREAM_LEN; k++) aBright.setX(s * STREAM_LEN + k, k === 0 ? 2 : TRAIL[k - 1]!);
  }
  plane.setAttribute('aGlyph', aGlyph);
  plane.setAttribute('aBright', aBright);
  rain.instanceMatrix.setUsage(DynamicDrawUsage);
  rain.frustumCulled = false;
  root.add(rain);

  const m4 = new Matrix4();
  const placeRain = () => {
    streams.forEach((st, s) => {
      for (let k = 0; k < STREAM_LEN; k++) {
        const i = s * STREAM_LEN + k;
        m4.makeTranslation(colX(st.col), st.y + k * SPACING, -0.05);
        rain.setMatrixAt(i, m4);
        aGlyph.setX(i, st.glyphs[k]!);
      }
    });
    rain.instanceMatrix.needsUpdate = true;
    aGlyph.needsUpdate = true;
  };
  placeRain();

  /* --- state ----------------------------------------------------------------- */

  let started = false;
  let built = false;
  let fade = 1; // rain opacity
  let lastT = 0;
  let raf = 0;
  let visible = true;
  const angVel = new Vector3(); // rad/s around world X/Y, for inertia
  let dragging = false;
  // auto: swaying · manual: the visitor holds it (plus inertia) · back: easing home
  let mode: 'auto' | 'manual' | 'back' = 'auto';
  let phase = 0;
  let lastInput = 0;
  const target = new Quaternion();
  const setMode = (next: typeof mode) => {
    mode = next;
    host.dataset.mode = next; // visible state (styles, tests)
  };
  const touch = () => {
    setMode('manual');
    lastInput = performance.now();
  };

  const BOX_FOV = 30;
  const fit = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width * OVERDRAW, height * OVERDRAW, false);
    camera.aspect = width / height;
    // Tight framing on the box: the monogram fills ~70 % of it (width or
    // height, whichever is limiting) …
    const view = 2 * Math.tan((BOX_FOV * Math.PI) / 360); // visible height per unit of distance
    camera.position.z = Math.max(1.55 / (view * camera.aspect), 1.0 / view);
    // … while the larger canvas shows OVERDRAW times that, at the same scale.
    camera.fov = (2 * Math.atan(Math.tan((BOX_FOV * Math.PI) / 360) * OVERDRAW) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    wake();
  };

  const rotate = (dx: number, dy: number) => {
    const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx);
    const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy);
    root.quaternion.premultiply(qy).premultiply(qx);
  };

  const step = (dt: number) => {
    // rain falls; a stream's head lights the pixels of its column it reaches
    if (started && fade > 0) {
      for (const st of streams) {
        st.y -= st.speed * dt;
        for (const p of pixels) if (p.col === st.col && p.age < 0 && st.y <= p.y) p.age = 0;
        if (st.y + STREAM_LEN * SPACING < LOGO_BOTTOM - FADE_OUT_BELOW) {
          st.y = TOP + Math.random() * 0.4; // loops until the monogram is complete
          st.speed = 0.85 + Math.random() * 0.4;
        }
        for (let k = 0; k < STREAM_LEN; k++) if (Math.random() < dt * 3) st.glyphs[k] = Math.floor(Math.random() * (KANA.length + LATIN.length));
      }
      placeRain();
      if (!built && pixels.every((p) => p.age >= 0)) {
        built = true;
        host.dataset.phase = 'built';
      }
      if (built) {
        fade = Math.max(0, fade - dt / RAIN_FADE);
        rainMat.uniforms.uFade!.value = fade;
        if (fade === 0) rain.visible = false;
      }
    }
    // pixels pop in with a flash
    for (const p of pixels) {
      if (p.age < 0) continue;
      p.age += dt;
      const t = Math.min(p.age / 0.22, 1);
      p.mesh.scale.setScalar(t < 1 ? easeOutBack(t) : 1);
      const flash = Math.exp(-p.age * 5);
      p.mesh.material.emissiveIntensity = p.base * (1 + 2.5 * flash);
    }
    // orientation: sway, free handling, or the way back to the sway
    if (mode === 'auto') {
      phase += dt * SWAY_SPEED;
      swayPose(phase, root.quaternion);
    } else if (mode === 'manual') {
      if (!dragging && angVel.lengthSq() > 1e-6) {
        rotate(angVel.y * dt, angVel.x * dt);
        angVel.multiplyScalar(Math.exp(-dt * 5));
      }
      const idle = !dragging && angVel.lengthSq() < 0.01 && performance.now() - lastInput > IDLE_RETURN;
      if (idle) {
        angVel.set(0, 0, 0);
        setMode('back');
      }
    } else {
      swayPose(phase, target);
      root.quaternion.slerp(target, 1 - Math.exp(-dt * 2.6));
      if (root.quaternion.angleTo(target) < 0.003) {
        root.quaternion.copy(target);
        setMode('auto');
      }
    }
  };

  // Always animating while on screen (sway); paused when hidden or scrolled away.
  const busy = () => true;

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - (lastT || now)) / 1000, 0.05);
    lastT = now;
    step(dt);
    renderer.render(scene, camera);
    if (visible && busy()) raf = requestAnimationFrame(frame);
    else lastT = 0;
  };
  function wake() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  /* --- interaction: free rotation, before, during and after the build ---------- */

  let px = 0;
  let py = 0;
  let pt = 0;
  host.addEventListener('pointerdown', (e) => {
    dragging = true;
    touch();
    px = e.clientX;
    py = e.clientY;
    pt = performance.now();
    angVel.set(0, 0, 0);
    host.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging');
    wake();
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const k = Math.PI / Math.max(host.clientWidth * 1.4, 320); // a drag across the box ≈ a third of a turn
    const dx = (e.clientX - px) * k;
    const dy = (e.clientY - py) * k;
    const now = performance.now();
    const dt = Math.max((now - pt) / 1000, 1 / 240);
    rotate(dx, dy);
    lastInput = now;
    angVel.set(dy / dt, dx / dt, 0).multiplyScalar(0.4).add(angVel.multiplyScalar(0.6));
    if (angVel.length() > MAX_SPIN) angVel.setLength(MAX_SPIN);
    px = e.clientX;
    py = e.clientY;
    pt = now;
    wake();
  });
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    lastInput = performance.now();
    host.classList.remove('is-dragging');
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    if (performance.now() - pt > 80) angVel.set(0, 0, 0); // held still before letting go
    wake();
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  host.addEventListener('keydown', (e) => {
    const step = 0.35;
    const impulse: Record<string, [number, number]> = {
      ArrowLeft: [0, -step * 6],
      ArrowRight: [0, step * 6],
      ArrowUp: [-step * 6, 0],
      ArrowDown: [step * 6, 0],
    };
    const v = impulse[e.key];
    if (!v) return;
    e.preventDefault();
    touch();
    angVel.x += v[0];
    angVel.y += v[1];
    wake();
  });

  /* --- lifecycle ---------------------------------------------------------------- */

  const ro = new ResizeObserver(fit);
  ro.observe(host);
  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting) && !document.hidden;
    if (visible) wake();
  });
  io.observe(host);
  const onVis = () => {
    visible = !document.hidden;
    if (visible) wake();
  };
  document.addEventListener('visibilitychange', onVis);
  fit();

  host.classList.add('is-live');

  const reset = () => {
    started = false;
    built = false;
    fade = 1;
    rainMat.uniforms.uFade!.value = 1;
    rain.visible = true;
    for (const st of streams) {
      st.y = TOP + Math.random() * 0.9;
      st.speed = 0.85 + Math.random() * 0.4;
    }
    for (const p of pixels) {
      p.age = -1;
      p.mesh.scale.setScalar(0);
      p.mesh.material.emissiveIntensity = p.base;
    }
    placeRain();
    host.dataset.phase = 'empty';
    wake();
  };
  return {
    build: () => {
      reset();
      started = true;
      host.dataset.phase = 'building';
      wake();
    },
    reset,
  };
}

/* --- helpers ------------------------------------------------------------------- */

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/** Small seeded PRNG: the same layout of brightness / start times on every visit. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
