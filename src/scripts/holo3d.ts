/**
 * The hero portrait, in real time (three.js): a full 3D bust (front and back)
 * drawn as a point-cloud hologram of Matrix glyphs (data: assets/3d/holo/).
 * On the page's first build, the hero's background rain builds it: the rain
 * starts again from the top, and each glyph lights up as its column's head
 * passes. Later builds (back to the top) are a quick scan line reveal; with
 * no background rain running, it falls in its own rain. Then the glyphs keep
 * changing, a scan line sweeps the face now and then, and it can be turned
 * freely (drag, touch, arrow keys). Glyphs hidden behind a nearer part of the
 * bust are not drawn. Only loaded with effects on (see Logo3D.astro);
 * reading mode shows a still. Shaders and glyphs: holo3d-gl.ts.
 */
import {
  AddEquation,
  BufferGeometry,
  Color,
  CustomBlending,
  Euler,
  Float32BufferAttribute,
  Group,
  LessEqualDepth,
  LinearSRGBColorSpace,
  NoBlending,
  OneFactor,
  PerspectiveCamera,
  Points,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
  WebGLRenderer,
  ZeroFactor,
} from 'three';
import { FALL, RAIN_COLS, REVEAL, fragmentShader, glyphAtlas, occluderFragment, vertexShader } from './holo3d-gl';
import { getHeroRain } from './matrix';

const WIDTH = 1; // the bust spans x ∈ [-0.5, 0.5]
const GLYPH_SCALE = 1.5; // glyph size, in point spacings
const COL_DELAY = 0.9; // s, the latest a column starts (own timed rain)
const RAIN_TIMEOUT = 6; // s: a rain-driven build is completed anyway after this
const SCAN_EVERY = 6; // s between two scan sweeps
const MAX_SPIN = 4; // rad/s
const SWAY = 0.38; // rad each side
const SWAY_SPEED = (Math.PI * 2) / 9;
const TILT = 0.06;
const IDLE_RETURN = 3000; // ms
/** The canvas overflows its box by this factor (CSS inset): a turned
 * portrait spills out instead of being cut. Framing still follows the box. */
const OVERDRAW = 1.6;

interface Cloud {
  geometry: BufferGeometry;
  pitch: number;
  top: number;
  bottom: number;
  height: number;
  depth: number;
  /** when the last glyph lands (own timed rain), s after the build starts */
  done: number;
}

/** 'HOL3' u32 count, f32 pitch, int16 xyz (/16384), int8 normals (/127),
 * u8 brightness, then optionally u8 glyph size (/200 of the pitch). */
function parse(buf: ArrayBuffer): Cloud {
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== 0x334c4f48) throw new Error('not HOL3');
  const n = view.getUint32(4, true);
  const pitch = view.getFloat32(8, true);
  const q = new Int16Array(buf, 12, n * 3);
  const nq = new Int8Array(buf, 12 + n * 6, n * 3);
  const lum = new Uint8Array(buf, 12 + n * 9, n);
  // glyph sizes are optional (uniform when absent)
  const size = buf.byteLength >= 12 + n * 11 ? new Uint8Array(buf, 12 + n * 10, n) : null;

  const pos = new Float32Array(n * 3);
  const nrm = new Float32Array(n * 3);
  let top = -Infinity;
  let bottom = Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 0; i < n * 3; i++) {
    pos[i] = q[i]! / 16384;
    nrm[i] = nq[i]! / 127;
  }
  for (let i = 0; i < n; i++) {
    top = Math.max(top, pos[i * 3 + 1]!);
    bottom = Math.min(bottom, pos[i * 3 + 1]!);
    zMin = Math.min(zMin, pos[i * 3 + 2]!);
    zMax = Math.max(zMax, pos[i * 3 + 2]!);
  }

  // own timed rain: columns one glyph wide, each starting at its own time
  const rand = mulberry32(11);
  const cols = Math.ceil(WIDTH / pitch) + 1;
  const colStart = Array.from({ length: cols }, () => rand() * COL_DELAY);
  const aLum = new Float32Array(n);
  const aSize = new Float32Array(n);
  const aSeed = new Float32Array(n);
  const aLand = new Float32Array(n);
  let done = 0;
  for (let i = 0; i < n; i++) {
    const c = Math.min(cols - 1, Math.max(0, Math.floor((pos[i * 3]! + WIDTH / 2) / pitch)));
    aLum[i] = lum[i]! / 255;
    aSize[i] = size ? size[i]! / 200 : 1;
    aSeed[i] = rand();
    aLand[i] = colStart[c]! + (top - pos[i * 3 + 1]!) / FALL;
    done = Math.max(done, aLand[i]!);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  geometry.setAttribute('aLum', new Float32BufferAttribute(aLum, 1));
  geometry.setAttribute('aSize', new Float32BufferAttribute(aSize, 1));
  geometry.setAttribute('aSeed', new Float32BufferAttribute(aSeed, 1));
  geometry.setAttribute('aLand', new Float32BufferAttribute(aLand, 1));
  return { geometry, pitch, top, bottom, height: top - bottom, depth: zMax - zMin, done };
}

export interface Holo3D {
  /** (re)play the Matrix build from nothing */
  build(): void;
  /** back to empty, ready for the next build */
  reset(): void;
}

export function mountHolo3D(host: HTMLElement, src: string): Holo3D {
  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'logo3d__canvas';

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 20);
  const root = new Group();
  const swayPose = (phase: number, out = new Quaternion()) =>
    out.setFromEuler(new Euler(TILT, SWAY * Math.sin(phase), 0, 'XYZ'));
  root.quaternion.copy(swayPose(0));
  scene.add(root);

  // shared by both passes (same objects: one update reaches both)
  const uniforms = {
    uAtlas: { value: glyphAtlas() },
    uTime: { value: 0 },
    uBuild: { value: -1e4 },
    uSize: { value: 1 },
    uScan: { value: 99 },
    uGlitch: { value: 0 },
    uBottom: { value: -1 },
    uBias: { value: 0 },
    uRain: { value: 0 },
    uTop: { value: 1 },
    uCanvas: { value: new Vector4() },
    uFont: { value: 16 },
    uCol0: { value: 0 },
    uReach: { value: new Float32Array(RAIN_COLS) },
    uVeil: { value: 0.9 },
    // the page background, so the veil is invisible except where it hides the rain
    // (raw sRGB values: the shader writes them straight to the canvas)
    uBg: {
      value: new Color().setStyle(
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#070b09',
        LinearSRGBColorSpace,
      ),
    },
  };
  // 1) the nearest surface, as discs: depth, plus a veil hiding what is behind
  const occluder = new ShaderMaterial({
    defines: { OCCLUDER: '' },
    blending: NoBlending,
    depthWrite: true,
    depthTest: true,
    uniforms,
    vertexShader,
    fragmentShader: occluderFragment,
  });
  // 2) the glyphs, additive light, hidden where a nearer surface is in front
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    depthFunc: LessEqualDepth,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
    uniforms,
    vertexShader,
    fragmentShader,
  });
  const u = uniforms as unknown as Record<string, { value: number }>;
  let cloud: Cloud | null = null;

  /* --- state ----------------------------------------------------------------- */

  let started = false;
  let buildT = -1e4;
  /** the background rain building the bust, while it does */
  let rainBuild: ReturnType<typeof getHeroRain> = null;
  /** a quiet rebuild: a scan line reveals the bust */
  let revealing = false;
  let time = 0;
  let scanT = SCAN_EVERY * 0.5;
  let lastT = 0;
  let raf = 0;
  let visible = true;
  const angVel = new Vector3();
  let dragging = false;
  let mode: 'auto' | 'manual' | 'back' = 'auto';
  let phase = 0;
  let lastInput = 0;
  const target = new Quaternion();
  const setMode = (next: typeof mode) => {
    mode = next;
    host.dataset.mode = next;
  };
  const touch = () => {
    setMode('manual');
    lastInput = performance.now();
  };

  const BOX_FOV = 30;
  const fit = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || !cloud) return;
    renderer.setSize(width * OVERDRAW, height * OVERDRAW, false);
    camera.aspect = width / height;
    // the portrait fills the box's height (or width, whichever is limiting)
    const view = 2 * Math.tan((BOX_FOV * Math.PI) / 360);
    const dist = Math.max((WIDTH * 1.08) / (view * camera.aspect), (cloud.height * 1.02) / view);
    camera.position.set(0, 0, dist + cloud.depth / 2);
    camera.fov = (2 * Math.atan(Math.tan((BOX_FOV * Math.PI) / 360) * OVERDRAW) * 180) / Math.PI;
    camera.updateProjectionMatrix();
    // glyphs a bit larger than their cell, so neighbours touch and the face reads
    const bufferHeight = height * OVERDRAW * renderer.getPixelRatio();
    u.uSize!.value = (cloud.pitch * GLYPH_SCALE * bufferHeight) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    wake();
  };

  const rotate = (dx: number, dy: number) => {
    root.quaternion
      .premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx))
      .premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy));
  };

  /** Rain-driven build: follow the background columns; true once all of them
   * have passed below the box (or the rain stopped, or it took too long). */
  const followRain = (): boolean => {
    if (!rainBuild) return true;
    const { rain, canvas: bg } = rainBuild;
    const rr = bg.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const hb = host.getBoundingClientRect();
    const fs = rain.fontSize;
    uniforms.uCanvas.value.set(cr.left - rr.left, cr.top - rr.top, cr.width, cr.height);
    rain.reachInto(uniforms.uCol0.value, uniforms.uReach.value);
    if (!rain.running || buildT > RAIN_TIMEOUT) return true;
    const bottom = hb.bottom - rr.top;
    const first = Math.floor((hb.left - rr.left) / fs) - uniforms.uCol0.value;
    const last = Math.ceil((hb.right - rr.left) / fs) - uniforms.uCol0.value;
    for (let k = Math.max(0, first); k < Math.min(RAIN_COLS, last); k++) {
      if (uniforms.uReach.value[k]! < bottom) return false;
    }
    return true;
  };

  const step = (dt: number) => {
    time += dt;
    u.uTime!.value = time;
    if (started && cloud) {
      buildT += dt;
      if (rainBuild && followRain()) {
        // done: everything shown, as if the own rain had long finished
        rainBuild.rain.uncue();
        rainBuild = null;
        u.uRain!.value = 0;
        buildT = cloud.done + 1.5;
      }
      if (revealing) {
        // the scan line leads the reveal down the bust
        u.uGlitch!.value = 0;
        u.uScan!.value = cloud.top - buildT * REVEAL;
        if (buildT > cloud.height / REVEAL + 0.35) {
          revealing = false;
          u.uRain!.value = 0;
          u.uScan!.value = 99;
          buildT = cloud.done + 1.5;
        }
      }
      u.uBuild!.value = buildT;
      const building = rainBuild !== null || revealing;
      if (!building && buildT > cloud.done + 0.6 && host.dataset.phase !== 'built') host.dataset.phase = 'built';
      // a scan line now and then once built, glitching one sweep in three
      if (!building && buildT > cloud.done) {
        scanT += dt;
        const sweep = 1.6;
        if (scanT > SCAN_EVERY) {
          scanT = 0;
          u.uGlitch!.value = Math.random() < 0.34 ? 1 : 0;
        }
        u.uScan!.value = scanT < sweep ? cloud.top - (scanT / sweep) * (cloud.height + 0.1) : 99;
      }
    }
    if (mode === 'auto') {
      // still while being built: the rain columns stay on their glyphs
      if (host.dataset.phase !== 'building') phase += dt * SWAY_SPEED;
      swayPose(phase, root.quaternion);
    } else if (mode === 'manual') {
      if (!dragging && angVel.lengthSq() > 1e-6) {
        rotate(angVel.y * dt, angVel.x * dt);
        angVel.multiplyScalar(Math.exp(-dt * 5));
      }
      if (!dragging && angVel.lengthSq() < 0.01 && performance.now() - lastInput > IDLE_RETURN) {
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

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - (lastT || now)) / 1000, 0.05);
    lastT = now;
    step(dt);
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(frame);
    else lastT = 0;
  };
  function wake() {
    if (!raf && visible && cloud) raf = requestAnimationFrame(frame);
  }

  /* --- interaction ------------------------------------------------------------ */

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
    const k = Math.PI / Math.max(host.clientWidth * 1.4, 320);
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
  });
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    lastInput = performance.now();
    host.classList.remove('is-dragging');
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    if (performance.now() - pt > 80) angVel.set(0, 0, 0);
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
  host.addEventListener('keydown', (e) => {
    const impulse: Record<string, [number, number]> = {
      ArrowLeft: [0, -2.1],
      ArrowRight: [0, 2.1],
      ArrowUp: [-2.1, 0],
      ArrowDown: [2.1, 0],
    };
    const v = impulse[e.key];
    if (!v) return;
    e.preventDefault();
    touch();
    angVel.x += v[0];
    angVel.y += v[1];
  });

  /* --- lifecycle ---------------------------------------------------------------- */

  new ResizeObserver(fit).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting) && !document.hidden;
    wake();
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    wake();
  });

  const reset = () => {
    started = false;
    buildT = -1e4;
    rainBuild?.rain.uncue();
    rainBuild = null;
    revealing = false;
    u.uRain!.value = 0;
    u.uBuild!.value = buildT;
    u.uScan!.value = 99;
    scanT = SCAN_EVERY * 0.5;
    host.dataset.phase = 'empty';
    wake();
  };
  let pendingBuild = false;
  let rainUsed = false;
  const build = () => {
    if (!cloud) {
      pendingBuild = true;
      return;
    }
    reset();
    started = true;
    buildT = 0;
    host.dataset.phase = 'building';
    // On the page's first build only, the background rain builds it: it
    // starts again from the top and the columns over the portrait are
    // followed. Later builds (back to the top) are a quiet scan reveal.
    const hr = rainUsed ? null : getHeroRain();
    if (hr?.rain.running) {
      rainUsed = true;
      const rr = hr.canvas.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const fs = hr.rain.fontSize;
      hr.rain.cue(cr.left - rr.left, cr.right - rr.left);
      uniforms.uFont.value = fs;
      uniforms.uCol0.value = Math.floor((cr.left - rr.left) / fs);
      u.uRain!.value = 1;
      rainBuild = hr;
      followRain();
    } else if (rainUsed) {
      // back to the top: a quick scan line reveals it, the rain left alone
      revealing = true;
      u.uRain!.value = 2;
    }
    host.dataset.build = rainBuild ? 'rain' : revealing ? 'scan' : 'own'; // visible state (tests)
    wake();
  };

  // The still stays until the data is in; then the canvas takes over.
  void fetch(src)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((buf) => {
      cloud = parse(buf);
      u.uBottom!.value = cloud.bottom;
      u.uTop!.value = cloud.top;
      u.uBias!.value = cloud.pitch * 2.2;
      const depthPass = new Points(cloud.geometry, occluder);
      depthPass.renderOrder = 0;
      const glyphs = new Points(cloud.geometry, material);
      glyphs.renderOrder = 1;
      root.add(depthPass, glyphs);
      host.append(canvas);
      host.classList.add('is-live');
      fit();
      if (pendingBuild) build();
      else reset();
    })
    .catch(() => {
      /* the still render stays */
    });

  return { build, reset };
}

/** Small seeded PRNG: the same rain on every visit. */
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
