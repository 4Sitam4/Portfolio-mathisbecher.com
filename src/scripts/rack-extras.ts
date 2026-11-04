/**
 * Extras of the 3D rack (rack3d.ts):
 *  - the sysadmin's mug: steaming coffee that cools down in real time
 *    (Newton's law of cooling); its hover card shows the temperature, and
 *    a fresh cup is poured once it has gone cold for a while;
 *  - LED shows: a wave on the switch ports when a packet crosses it, and
 *    now and then a ZFS scrub sweeping across the 12 disks of truenas;
 *  - rails: the hovered machine slides out a little, as if pulled out of the
 *    rack; the end of its cables (plugged at the back) stretches along.
 */
import { type BufferAttribute, CanvasTexture, Matrix4, type Mesh, type Object3D, Sprite, SpriteMaterial, Vector3 } from 'three';
import type { MugTexts } from '../i18n/rack';

// A cup at a normal drinking temperature that cools down (sped up a bit,
// so the change shows while someone looks at it).
const ROOM = 21; // °C
const FRESH = 60; // °C, ready to drink
const COOLING = 180; // s, time constant
const POURED_UP_TO = 40; // s: on arrival, poured a moment ago
const REFILL_BELOW = 25; // °C: cold enough that someone pours a new one…
const REFILL_AFTER = 30; // …after this many seconds

function puff(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(225,235,230,0.6)');
  g.addColorStop(0.5, 'rgba(225,235,230,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export class Mug {
  private t = 0; // seconds since poured
  /** moved with the machine it stands on (rails) */
  shift = 0;
  private coldFor = 0;
  private readonly puffs: { sprite: Sprite; age: number; life: number; drift: number }[] = [];
  private readonly mat = new SpriteMaterial({ map: puff(), transparent: true, depthWrite: false, opacity: 0 });

  constructor(
    parent: Object3D,
    private readonly top: Vector3,
    private readonly texts: MugTexts
  ) {
    for (let i = 0; i < 22; i++) {
      const sprite = new Sprite(this.mat.clone());
      sprite.scale.setScalar(0.03);
      sprite.visible = false;
      parent.add(sprite);
      this.puffs.push({ sprite, age: Math.random() * 2, life: 1.6 + Math.random() * 1.2, drift: Math.random() * Math.PI * 2 });
    }
  }

  get temp(): number {
    return ROOM + (FRESH - ROOM) * Math.exp(-this.t / COOLING);
  }

  /** fresh: just poured (a refill); otherwise poured a little while ago */
  reset(fresh = false): void {
    this.t = fresh ? 0 : Math.random() * POURED_UP_TO;
    this.coldFor = 0;
    for (const p of this.puffs) p.sprite.visible = false;
  }

  update(dt: number, on: boolean): void {
    if (!on) return;
    this.t += dt;
    if (this.temp < REFILL_BELOW) {
      this.coldFor += dt;
      if (this.coldFor > REFILL_AFTER) this.reset(true);
    }
    // steam: thick when hot, gone when lukewarm
    const strength = Math.max(0, Math.min(1, (this.temp - 30) / 25));
    for (const p of this.puffs) {
      p.age += dt;
      if (p.age > p.life) {
        p.age = 0;
        p.drift = Math.random() * Math.PI * 2;
      }
      const k = p.age / p.life;
      const wobble = Math.sin(p.drift + p.age * 2.4) * (0.008 + k * 0.022);
      p.sprite.position.set(this.top.x + wobble, this.top.y + 0.005 + k * 0.11, this.top.z + this.shift + Math.cos(p.drift) * 0.006);
      p.sprite.scale.setScalar(0.03 + k * 0.06);
      (p.sprite.material as SpriteMaterial).opacity = strength * 0.42 * Math.sin(Math.PI * k);
      p.sprite.visible = strength > 0;
    }
  }

  card(): { title: string; lines: string[] } {
    const temp = this.temp;
    const status = this.texts.status.find(([min]) => temp >= min)?.[1] ?? '';
    const fmt = new Intl.NumberFormat(document.documentElement.lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return { title: this.texts.title, lines: [`${this.texts.temp} ${fmt.format(temp)} °C`, status] };
  }
}

/** LED shows that take over the random blinking for a moment. */
export class LedShow {
  private waveAt = -1;
  private scrubAt = -1;
  private nextScrub = 12000 + Math.random() * 10000;

  constructor(
    private readonly ports: Mesh[], // switch port LEDs, left to right
    private readonly disks: Mesh[] // truenas disk LEDs, left to right then top to bottom
  ) {}

  /** a packet just crossed the switch */
  wave(now: number): void {
    this.waveAt = now;
  }

  /** true while a show drives these LEDs (the caller then leaves them alone) */
  apply(now: number): { ports: boolean; disks: boolean } {
    if (this.scrubAt < 0 && now > this.nextScrub) this.scrubAt = now;
    let ports = false;
    let disks = false;
    if (this.waveAt >= 0) {
      const k = (now - this.waveAt) / 450;
      if (k > 1.3) this.waveAt = -1;
      else {
        ports = true;
        this.ports.forEach((m, i) => (m.visible = Math.abs(k - i / this.ports.length) < 0.18));
      }
    }
    if (this.scrubAt >= 0) {
      const k = (now - this.scrubAt) / 1800;
      if (k > 1.2) {
        this.scrubAt = -1;
        this.nextScrub = now + 20000 + Math.random() * 15000;
      } else {
        disks = true;
        this.disks.forEach((m, i) => (m.visible = Math.abs(k - i / this.disks.length) < 0.12));
      }
    }
    return { ports, disks };
  }
}

/* --- rails ------------------------------------------------------------------------ */

const SLIDE = 0.1; // model units (≈ 10 cm out of the rack)
const REACH = 0.3; // length of cable, from the plug, that follows the machine
/** cable -> machine it is plugged into (the switch stays put) */
const CABLE_OF: Record<string, string> = { lab: 'lab', pve1: 'pve1', pve1b: 'pve1', pve2: 'pve2', truenas: 'truenas', truenasb: 'truenas' };
const MACHINES = [...new Set(Object.values(CABLE_OF))];

/** 0 at REACH or more from the plug, 1 on it, smooth in between */
function pull(end: Vector3, p: Vector3): number {
  const k = Math.max(0, 1 - p.distanceTo(end) / REACH);
  return k * k * (3 - 2 * k);
}

export class Rails {
  private readonly out = new Map<string, number>(); // machine -> 0 (racked) … 1 (out)
  private readonly ends = new Map<string, Vector3>(); // cable -> plug, model space
  private readonly wires: { pos: BufferAttribute; device: string; base: Float32Array; weight: Float32Array; dir: Vector3; last: number }[] = [];

  constructor(paths: Record<string, number[][]>, cables: { mesh: Mesh; key: string }[], model: Object3D) {
    for (const [key, pts] of Object.entries(paths)) {
      const p = pts[pts.length - 1];
      if (CABLE_OF[key] && p) this.ends.set(key, new Vector3(p[0], p[1], p[2]));
    }
    model.updateMatrixWorld(true);
    const toModel = new Matrix4();
    const v = new Vector3();
    for (const { mesh, key } of cables) {
      const device = CABLE_OF[key];
      const end = this.ends.get(key);
      if (!device || !end) continue;
      // vertices may be quantized: work in the model's space, write back in the mesh's
      toModel.copy(model.matrixWorld).invert().multiply(mesh.matrixWorld);
      const back = toModel.clone().invert();
      const dir = new Vector3(0, 0, 1).applyMatrix4(back).sub(new Vector3().applyMatrix4(back));
      const pos = mesh.geometry.attributes.position as BufferAttribute;
      const base = new Float32Array(pos.count * 3);
      const weight = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).toArray(base, i * 3);
        weight[i] = pull(end, v.applyMatrix4(toModel));
      }
      this.wires.push({ pos, device, base, weight, dir, last: 0 });
    }
  }

  /** how far (model units) a machine is out */
  z(device: string): number {
    return (this.out.get(device) ?? 0) * SLIDE;
  }

  /** a point on a cable (packets), moved like the cable */
  bend(key: string, p: Vector3): void {
    const end = this.ends.get(key);
    if (end) p.z += this.z(CABLE_OF[key]!) * pull(end, p);
  }

  /** eases the machines towards their place; true when something moved */
  update(dt: number, target: string | null): boolean {
    let moved = false;
    for (const d of MACHINES) {
      const cur = this.out.get(d) ?? 0;
      const goal = d === target ? 1 : 0;
      let next = cur + (goal - cur) * (1 - Math.exp(-dt * 8));
      if (Math.abs(goal - next) < 0.002) next = goal;
      if (next === cur) continue;
      this.out.set(d, next);
      moved = true;
    }
    if (moved)
      for (const w of this.wires) {
        const dz = this.z(w.device);
        if (dz === w.last) continue;
        w.last = dz;
        for (let i = 0; i < w.pos.count; i++) {
          const k = dz * w.weight[i]!;
          w.pos.setXYZ(i, w.base[i * 3]! + w.dir.x * k, w.base[i * 3 + 1]! + w.dir.y * k, w.base[i * 3 + 2]! + w.dir.z * k);
        }
        w.pos.needsUpdate = true;
      }
    return moved;
  }
}
