/**
 * The homelab rack in 3D (model made in Blender: public/models/homelab-rack.glb).
 *  - Built like every block: on each build the machines slide into the rack,
 *    bottom to top, then power on (see Rack3D.astro for the provision hook).
 *  - Alive: disk and port LEDs flicker, the window of pve2 breathes, and a
 *    packet comes in through the router uplink and follows the cable to the
 *    LXC container that serves this site (pve2); now and then a smaller white
 *    one goes from Portainer (truenas) to its agent. The terminal's `ping`
 *    fires packets too. Port LEDs ripple as packets cross the switch, and a
 *    ZFS scrub sweeps the disks now and then (rack-extras.ts).
 *  - A coffee mug on the partner's machine, steaming and cooling for real.
 *  - Turns left/right only (the back is not detailed): drag or arrow keys,
 *    a slow sway when idle, back to it after a few seconds.
 *  - Hover (or tap) a machine: it lights up, slides out on its rails and its
 *    label shows (the mug's card gives its temperature, live).
 */
import {
  AmbientLight,
  Box3,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import data from '../data/rack.json';
import type { MugTexts, RackCard } from '../i18n/rack';
import { LedShow, Mug, Rails } from './rack-extras';

type Device = 'switch' | 'lab' | 'pve1' | 'pve2' | 'truenas';
const DEVICES: Device[] = ['truenas', 'pve2', 'pve1', 'lab', 'switch']; // racking order, bottom to top
/** The machine whose LXC container serves this site (where visits end up). */
const SITE_HOST: Device = 'pve2';
/** Portainer runs there and drives the agents of every other machine. */
const PORTAINER: Device = 'truenas';
/** Hover targets: the machines, and the mug racked last. */
type Target = Device | 'mug';
const MOVABLE = new Set<string>([...DEVICES, 'mug', 'blanks', 'cablemgr']);

const SWAY = 0.32; // rad each side when idle
const SWAY_SPEED = (Math.PI * 2) / 10;
const LIMIT = 0.7; // rad (≈ 40°): never far enough to show the plain back and sides
const IDLE_RETURN = 3000;
const GREEN = new Color(0x00ff9d);

export interface Rack3D {
  build(): void;
  reset(): void;
}

export async function mountRack3D(host: HTMLElement, labels: Record<Device, RackCard>, mugTexts: MugTexts): Promise<Rack3D> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'rack3d__canvas';
  host.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.05, 20);
  scene.add(new AmbientLight(0xffffff, 0.8));
  const key = new DirectionalLight(0xffffff, 2.8);
  key.position.set(-1.2, 1.8, 1.8);
  scene.add(key);
  const rim = new DirectionalLight(0x9dffd6, 1.1);
  rim.position.set(1.5, 1.2, -1.5);
  scene.add(rim);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync('/models/homelab-rack.glb');
  const model = gltf.scene;

  // Turn around the centre of the rack.
  const pivot = new Group();
  // Frame on the rack structure only: the router cable leaves the rack far to
  // the back, it must not shift the centre nor the framing.
  const frameBox = new Box3().setFromObject(model.getObjectByName('frame') ?? model);
  const centre = frameBox.getCenter(new Vector3());
  const rackSize = frameBox.getSize(new Vector3());
  model.position.sub(centre);
  pivot.add(model);
  scene.add(pivot);

  /* --- parts ------------------------------------------------------------------ */

  const deviceOf = (name: string): Target | null => {
    if (name === 'mug') return 'mug';
    if (name.startsWith('LED_disk') || name.startsWith('LED_truenas')) return 'truenas';
    if (name.startsWith('LED_port') || name.startsWith('LED_switch')) return 'switch';
    for (const d of DEVICES) if (name === d || name.startsWith(`LED_${d}`)) return d;
    return null;
  };
  const parts = new Map<Object3D, { home: Vector3; device: string }>();
  const leds: { mesh: Mesh<any, MeshStandardMaterial>; device: Target | null; kind: 'disk' | 'port' | 'steady'; next: number }[] = [];
  const pickable: Object3D[] = [];
  const deviceMeshes = new Map<Target, Mesh<any, MeshStandardMaterial>[]>();
  let glow: MeshStandardMaterial | null = null;
  // network cables, pulled one by one once the machines are racked
  const CABLE_ORDER = ['uplink_router', 'lab', 'pve1', 'pve1b', 'pve2', 'truenas', 'truenasb'];
  const cables: { mesh: Mesh; count: number; order: number; key: string }[] = [];
  model.traverse((o) => {
    const m = o as Mesh<any, MeshStandardMaterial>;
    if (!m.isMesh) return;
    // one material per mesh so each part can be lit on its own
    m.material = m.material.clone();
    if (m.material.name === 'Glow_green') glow = m.material;
    const name = m.name || m.parent?.name || '';
    const node = m.parent && m.parent !== model ? m.parent : m;
    const nodeName = node.name || name;
    if (nodeName.startsWith('LED_')) {
      // the exported strength (4) would clip the green to cyan on screen
      m.material.emissiveIntensity = 1.1;
      const kind = nodeName.startsWith('LED_disk') ? 'disk' : nodeName.startsWith('LED_port') ? 'port' : 'steady';
      leds.push({ mesh: m, device: deviceOf(nodeName), kind, next: 0 });
    }
    const dev = deviceOf(nodeName);
    if (dev) {
      m.userData.emissive = m.material.emissive.clone(); // hover adds to it
      pickable.push(m);
      m.userData.device = dev;
      if (!nodeName.startsWith('LED_')) deviceMeshes.set(dev, [...(deviceMeshes.get(dev) ?? []), m]);
    }
    if (nodeName.startsWith('Cable_')) {
      const count = m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position!.count;
      cables.push({ mesh: m, count, order: CABLE_ORDER.indexOf(nodeName.slice(6)), key: nodeName.slice(6) });
    }
    const group = nodeName.startsWith('LED_') ? dev : nodeName;
    if (group && MOVABLE.has(group)) parts.set(node, { home: node.position.clone(), device: group });
  });

  // left to right, for the LED shows
  const byX = (kind: string) =>
    leds.filter((l) => l.kind === kind).map((l) => l.mesh).sort((a, b) => a.getWorldPosition(new Vector3()).x - b.getWorldPosition(new Vector3()).x);
  const show = new LedShow(byX('port'), byX('disk'));
  const mugTop = new Vector3(...(data.labels.mug as [number, number, number]));
  const mug = new Mug(model, mugTop, mugTexts);
  const rails = new Rails(data.paths as Record<string, number[][]>, cables, model);
  const railOf = (t: string) => (t === 'mug' ? 'lab' : t); // the mug stands on the lab machine

  /* --- packets ------------------------------------------------------------------ */

  // paths and anchors are in the model's own space (packets live in it too)
  const toVec = (p: number[]) => new Vector3(p[0], p[1], p[2]);
  const paths = data.paths as Record<string, number[][]>;
  const curve = (key: string, reverse = false) => {
    const pts = paths[key]!.map(toVec);
    return new CatmullRomCurve3(reverse ? pts.reverse() : pts);
  };
  const ROUTES = {
    // a visit: router -> switch -> the site's container
    visit: { legs: [curve('uplink_router', true), curve(SITE_HOST)], keys: ['uplink_router', SITE_HOST], speed: 0.55, mat: new MeshBasicMaterial({ color: GREEN }), size: 1 },
    // Portainer talking to its agent: truenas -> switch -> pve2
    mgmt: { legs: [curve(PORTAINER, true), curve(SITE_HOST)], keys: [PORTAINER, SITE_HOST], speed: 0.45, mat: new MeshBasicMaterial({ color: 0xe4ede8 }), size: 0.7 },
  };
  const packetGeo = new SphereGeometry(0.008, 12, 12);
  const packets: { mesh: Mesh; t: number; leg: number; route: keyof typeof ROUTES }[] = [];
  let arrivalFlash = 0; // the site host lights up when a packet arrives
  const firePacket = (route: keyof typeof ROUTES = 'visit') => {
    const mesh = new Mesh(packetGeo, ROUTES[route].mat);
    mesh.scale.setScalar(ROUTES[route].size);
    model.add(mesh);
    packets.push({ mesh, t: 0, leg: 0, route });
    wake();
  };
  let nextMgmt = 4;
  const at = new Vector3();
  const hostLed = leds.find((l) => l.device === SITE_HOST && l.kind === 'steady');

  /* --- labels (DOM, above the canvas) ------------------------------------------- */

  const tag = document.createElement('div');
  tag.className = 'rack3d__tag';
  tag.setAttribute('aria-hidden', 'true');
  host.append(tag);
  const anchors = data.labels as Record<Target, number[]>;
  let hovered: Target | null = null;
  let shown = '';
  const fillTag = (card: RackCard) => {
    const text = card.title + card.lines.join('|');
    if (text === shown) return;
    shown = text;
    const title = document.createElement('strong');
    title.textContent = card.title;
    tag.replaceChildren(title, ...card.lines.map((l) => Object.assign(document.createElement('span'), { textContent: l })));
  };
  const setHover = (d: Target | null) => {
    if (d === hovered) return;
    for (const [dev, meshes] of deviceMeshes) {
      for (const m of meshes) m.material.emissive.copy(GREEN).multiplyScalar(dev === d ? 0.045 : 0).add(m.userData.emissive as Color);
    }
    hovered = d;
    if (d) fillTag(d === 'mug' ? mug.card() : labels[d]);
    tag.classList.toggle('is-on', Boolean(d));
    wake();
  };
  const placeTag = () => {
    if (!hovered) return;
    if (hovered === 'mug') fillTag(mug.card()); // live temperature
    // the mug stands on the lab machine: its card goes under it (bottom = top of pve1)
    const below = hovered === 'lab';
    const a = toVec(anchors[hovered]!);
    if (below) a.y = anchors.pve1[1]!;
    a.z += rails.z(railOf(hovered));
    const p = model.localToWorld(a).project(camera);
    const r = host.getBoundingClientRect();
    // centred above (or under) the machine, but always inside the box (narrow screens)
    const half = tag.offsetWidth / 2;
    const x = Math.min(Math.max(((p.x + 1) / 2) * r.width, half), r.width - half);
    const top = ((1 - p.y) / 2) * r.height;
    const y = Math.max(below ? Math.min(top + 10, r.height - tag.offsetHeight) : top - tag.offsetHeight - 10, 0);
    tag.style.transform = `translate(${x - half}px, ${y}px)`;
  };

  /* --- state ---------------------------------------------------------------------- */

  let mode: 'auto' | 'manual' | 'back' = 'auto';
  let phase = 0;
  let yaw = 0;
  let vel = 0;
  let dragging = false;
  let lastInput = 0;
  let buildT = -1; // seconds since the build started, -1: idle
  let powered = false;
  let raf = 0;
  let lastT = 0;
  let visible = true;
  let nextPacket = 2.5;

  const fit = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fits at every angle it can turn to: horizontally the footprint's half
    // diagonal, vertically half the height; the nearest corner comes closer
    // to the camera, hence the extra half-diagonal of distance.
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const halfDiag = Math.hypot(rackSize.x, rackSize.z) / 2;
    const dist = Math.max((rackSize.y / 2) * 1.1 / tanV, (halfDiag * 1.08) / (tanV * camera.aspect)) + halfDiag * 0.55;
    camera.position.set(0, rackSize.y * 0.12, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    wake();
  };

  const setPower = (on: boolean) => {
    powered = on;
    for (const l of leds) l.mesh.visible = on;
    if (glow) (glow as MeshStandardMaterial).emissiveIntensity = on ? 1 : 0;
  };

  const step = (dt: number, now: number) => {
    // racking: each machine slides in from the front, bottom to top
    if (buildT >= 0) {
      buildT += dt;
      let done = true;
      for (const [node, part] of parts) {
        const order = part.device === 'mug' ? DEVICES.length : DEVICES.indexOf(part.device as Device);
        const start = (order < 0 ? 0.2 : order * 0.28) + 0.15;
        const t = Math.min(Math.max((buildT - start) / 0.55, 0), 1);
        if (t < 1) done = false;
        const e = 1 - (1 - t) ** 3;
        node.position.copy(part.home).setZ(part.home.z + (1 - e) * 0.55);
        node.visible = t > 0 && !(node.name.startsWith('LED_') && !powered);
      }
      // last step: the cables, one after the other
      const RACKED = DEVICES.length * 0.28 + 0.15 + 0.55; // the mug is last
      for (const c of cables) {
        const start = RACKED + 0.1 + c.order * 0.32;
        const t = Math.min(Math.max((buildT - start) / 0.5, 0), 1);
        if (t < 1) done = false;
        const e = 1 - (1 - t) ** 2;
        c.mesh.visible = t > 0;
        c.mesh.geometry.setDrawRange(0, Math.floor((c.count * e) / 3) * 3);
      }
      if (done) {
        buildT = -1;
        host.dataset.phase = 'built';
        setPower(true);
        nextPacket = 0.6;
      }
    }
    // rails: the hovered machine slides out (not while racking)
    if (rails.update(dt, buildT < 0 && hovered !== 'mug' ? hovered : null) && buildT < 0) {
      for (const [node, part] of parts) node.position.z = part.home.z + rails.z(railOf(part.device));
      mug.shift = rails.z('lab');
    }
    // orientation: sway, free (clamped) handling, or easing back
    if (mode === 'auto') {
      phase += dt * SWAY_SPEED;
      yaw = SWAY * Math.sin(phase);
    } else if (mode === 'manual') {
      if (!dragging) {
        yaw += vel * dt;
        vel *= Math.exp(-dt * 5);
      }
      if (!dragging && Math.abs(vel) < 0.02 && now - lastInput > IDLE_RETURN) mode = 'back';
    } else {
      const target = SWAY * Math.sin(phase);
      yaw += (target - yaw) * (1 - Math.exp(-dt * 2.6));
      if (Math.abs(target - yaw) < 0.003) mode = 'auto';
    }
    yaw = Math.max(-LIMIT, Math.min(LIMIT, yaw));
    pivot.rotation.y = yaw;
    // life: LEDs, glow, packets
    mug.update(dt, powered);
    if (powered) {
      const busy = show.apply(now); // a ripple or a scrub drives those LEDs
      for (const l of leds) {
        if (l.kind === 'steady' || (l.kind === 'port' && busy.ports) || (l.kind === 'disk' && busy.disks)) continue;
        if (now > l.next) {
          l.mesh.visible = !l.mesh.visible || Math.random() < 0.3;
          l.next = now + (l.kind === 'disk' ? 40 + Math.random() * 380 : 60 + Math.random() * 900);
        }
      }
      arrivalFlash = Math.max(0, arrivalFlash - dt * 2.5);
      if (glow) (glow as MeshStandardMaterial).emissiveIntensity = 0.75 + 0.25 * Math.sin(now / 900) + 1.6 * arrivalFlash;
      nextPacket -= dt;
      if (nextPacket <= 0) {
        firePacket('visit');
        nextPacket = 6 + Math.random() * 3;
      }
      nextMgmt -= dt;
      if (nextMgmt <= 0) {
        firePacket('mgmt');
        nextMgmt = 9 + Math.random() * 6;
      }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i]!;
      const route = ROUTES[p.route];
      p.t += dt * route.speed;
      const legIndex = Math.min(Math.floor(p.t), route.legs.length - 1);
      route.legs[legIndex]!.getPointAt(Math.min(p.t - legIndex, 1), at);
      rails.bend(route.keys[legIndex]!, at);
      p.mesh.position.copy(at);
      if (legIndex !== p.leg) show.wave(now); // through the switch
      p.leg = legIndex;
      if (p.t >= route.legs.length) {
        model.remove(p.mesh);
        packets.splice(i, 1);
        arrivalFlash = p.route === 'visit' ? 1 : 0.5;
        if (hostLed) {
          hostLed.mesh.material.emissiveIntensity = 3;
          window.setTimeout(() => (hostLed.mesh.material.emissiveIntensity = 1.1), 260);
        }
      }
    }
    placeTag();
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min((now - (lastT || now)) / 1000, 0.05);
    lastT = now;
    step(dt, now);
    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(frame);
    else lastT = 0;
  };
  function wake() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  /* --- interaction ------------------------------------------------------------------ */

  const ray = new Raycaster();
  const ndc = new Vector2();
  const pick = (e: PointerEvent): Target | null => {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickable, false)[0];
    return (hit?.object.userData.device as Target) ?? null;
  };
  let px = 0;
  let pt = 0;
  host.addEventListener('pointerdown', (e) => {
    dragging = true;
    mode = 'manual';
    lastInput = performance.now();
    px = e.clientX;
    pt = lastInput;
    vel = 0;
    host.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging');
    if (e.pointerType !== 'mouse') setHover(pick(e)); // tap shows the label
    wake();
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) {
      if (e.pointerType === 'mouse') setHover(pick(e));
      return;
    }
    const now = performance.now();
    const d = ((e.clientX - px) * Math.PI) / Math.max(host.clientWidth * 1.6, 320);
    yaw += d;
    vel = 0.6 * vel + (0.4 * d) / Math.max((now - pt) / 1000, 1 / 240);
    px = e.clientX;
    pt = lastInput = now;
  });
  const release = (e: PointerEvent) => {
    dragging = false;
    lastInput = performance.now();
    host.classList.remove('is-dragging');
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
  host.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && setHover(null));
  host.addEventListener('keydown', (e) => {
    const v = e.key === 'ArrowLeft' ? -1.6 : e.key === 'ArrowRight' ? 1.6 : 0;
    if (!v) return;
    e.preventDefault();
    mode = 'manual';
    lastInput = performance.now();
    vel += v;
    wake();
  });
  // `ping` in the terminal: a few real packets through the rack
  window.addEventListener('homelab:ping', () => powered && firePacket('visit'));

  /* --- lifecycle ------------------------------------------------------------------ */

  new ResizeObserver(fit).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting) && !document.hidden;
    if (visible) wake();
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) wake();
  });
  fit();
  host.classList.add('is-live');

  const reset = () => {
    buildT = -1;
    setPower(false);
    for (const [node] of parts) node.visible = false;
    for (const c of cables) {
      c.mesh.visible = false;
      c.mesh.geometry.setDrawRange(0, 0);
    }
    for (const p of packets.splice(0)) model.remove(p.mesh);
    mug.reset();
    setHover(null);
    host.dataset.phase = 'empty';
    wake();
  };
  reset();
  return {
    build: () => {
      reset();
      buildT = 0;
      host.dataset.phase = 'building';
      wake();
    },
    reset,
  };
}
