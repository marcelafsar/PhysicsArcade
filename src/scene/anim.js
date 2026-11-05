/* Outcome animations ("cinematics") — played only after all three steps are correct.
   Reusable archetypes driven by each composer's rig:
     elevator   – car fixed in frame, shaft scrolls; floor display counts
     shaftLift  – cable-hung car/platform: same camera idea
     translate  – objects slide / swing / get pulled along their real direction;
                  ropes stay attached and pulleys turn
     fall       – camera follows a falling (or rising) object; clouds stream past
     rest       – equilibrium: nothing moves; markers show v = 0 and a = 0
   Kinematics are qualitative (normalized time, no invented speeds or values):
     "speeding up"  s = 0.2u + 0.8u²     "slowing down" s = 2u − u² (comes to rest)
     "constant"     s = u
   Velocity marker (green) follows the real velocity; the acceleration marker (purple)
   points along the net force taken from the answer key (engine axisInfo), so a car
   moving down while slowing shows velocity ↓ and acceleration ↑. */
import { Graphics, TilingSprite, Container, Sprite } from 'pixi.js';
import { svgTexture } from './art/kit.js';
import { shaftTileSvg, SHAFT_X, SHAFT_Y, SHAFT_W, SHAFT_H } from './art/envs.js';
import { Sound } from '../audio.js';
import { T } from '../teacher/globals.js';

export const profileOf = note => {
  const n = (note || '').toLowerCase();
  if (n.includes('slow')) return 'slow';
  if (n.includes('speed')) return 'speed';
  if (n.includes('constant')) return 'const';
  return 'rest';
};
const S = { speed: u => .2 * u + .8 * u * u, slow: u => 2 * u - u * u, const: u => u, rest: () => 0 };
const V = { speed: u => .2 + 1.6 * u, slow: u => 2 - 2 * u, const: () => 1, rest: () => 0 };   // ds/du (max 2)
const VMAX = { speed: 1.8, slow: 2, const: 1, rest: 1 };
export const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

const VCOL = 0x2c9a55, ACOL = 0x8a46d8;
const words = ([x, y]) => {
  const a = Math.atan2(-y, x) * 180 / Math.PI, n = ((Math.round(a) % 360) + 360) % 360;
  if (n === 0) return 'right'; if (n === 90) return 'up'; if (n === 180) return 'left'; if (n === 270) return 'down';
  return n < 90 ? 'up and to the right' : n < 180 ? 'up and to the left' : n < 270 ? 'down and to the left' : 'down and to the right';
};

/** Build the cinematic controller for a composed scene. Returns null if the scene has nothing to show. */
export function makeCinematic(build, sc, scene) {
  const rig = build.cine; if (!rig) return null;
  const prof = profileOf(rig.change);
  const duration = rig.type === 'rest' ? 2.2 : rig.type === 'elevator' || rig.type === 'shaftLift' ? 4.2 : 3.4;
  const objs = build.objs.filter(Boolean);

  // acceleration direction for each scenario object, from the answer key (net force)
  const accel = sc.objects.map((_, i) => { const a = T.axisInfo(sc, i); if (!a.accel) return null; const r = a.ang * Math.PI / 180; return [Math.cos(r), -Math.sin(r)]; });
  // velocity direction per object (from the rig's motion description)
  const vel = sc.objects.map((_, i) => {
    if (prof === 'rest' || rig.type === 'rest') return null;
    if (rig.type === 'elevator' || rig.type === 'shaftLift') return rig.dir === 'up' || (rig.movers?.[0]?.dir?.[1] < 0) ? [0, -1] : [0, 1];
    if (rig.type === 'fall') return rig.up ? [0, -1] : [0, 1];
    const m = rig.movers?.find(m => m.node === build.objs[i]);
    return m ? m.dir : null;
  });

  const fx = new Container(); build.fx.addChild(fx);
  const markers = new Graphics(); fx.addChild(markers);
  const base = new Map();
  const remember = n => { if (n && !base.has(n)) base.set(n, { x: n.x, y: n.y, r: n.rotation }); };
  (rig.movers || []).forEach(m => remember(m.node)); objs.forEach(remember);
  let hum = null, hiss = null, wind = null, tile = null, tileBase = 0, floorTimer = 0;

  /* elevator / lift: a scrolling shaft wall over the backdrop */
  async function prepareShaft() {
    if (tile) return;
    const [vx, vy, vw, vh] = build.view;
    const r = Math.min(build.res, 2);
    const tex = await svgTexture(shaftTileSvg(), [0, 0, SHAFT_W, SHAFT_H], r, 'shaft-tile');
    build.keep(tex);
    tile = new TilingSprite({ texture: tex, width: vw + 40, height: vh + 40 });
    tile.tileScale.set(1 / r);
    tile.position.set(vx - 20, vy - 20);
    // align the tile with the static backdrop, which draws the same storeys at (SHAFT_X, SHAFT_Y + k·H)
    tile.tilePosition.set(SHAFT_X - (vx - 20), SHAFT_Y - (vy - 20));
    tileBase = tile.tilePosition.y; tile.alpha = 0;
    build.back.addChild(tile); build.tile = tile; build.tileBase = tileBase;
  }

  function drawMarkers(u) {
    markers.clear();
    if (!scene.showLabels()) return;
    objs.forEach((n, i) => {
      if (i >= sc.objects.length) return;
      const c = sc.objects[i].c, b0 = base.get(n) || { x: c[0], y: c[1] };
      const ox = n.x - b0.x, oy = n.y - b0.y;
      const p = [c[0] + ox + (sc.multi ? 0 : 0), c[1] + oy];
      const v = vel[i], a = accel[i];
      const side = c[0] > 420 ? -1 : 1, x0 = p[0] + side * 64, y0 = p[1] - 10;
      if (v) { const L = 14 + 56 * V[prof](u) / VMAX[prof]; arrow(markers, x0, y0, v, L, VCOL); }
      else dot(markers, x0, y0, VCOL);
      if (a) arrow(markers, x0 + side * 34, y0, a, 44, ACOL);
      else dot(markers, x0 + side * 34, y0, ACOL);
    });
  }

  function apply(u) {
    const s = S[prof](u), v = V[prof](u) / VMAX[prof];
    if (rig.type === 'translate') {
      for (const m of rig.movers) { const b = base.get(m.node); m.node.position.set(b.x + m.dir[0] * m.D * s, b.y + m.dir[1] * m.D * s); if (m.roll) m.node.rotation = b.r + s * m.D / m.roll; }
      for (const sp of build.spinners) sp.node.rotation = (rig.spinDir || 1) * s * 60 / sp.r;
      if (rig.walk) rig.walk.y = (base.get(rig.walk)?.y || 0) - Math.abs(Math.sin(u * Math.PI * 7)) * 3 * (prof === 'rest' ? 0 : 1);
    } else if (rig.type === 'elevator' || rig.type === 'shaftLift') {
      const dirY = (rig.dir || (rig.movers?.[0]?.dir[1] < 0 ? 'up' : 'down')) === 'up' ? 1 : -1;
      if (tile) tile.tilePosition.y = tileBase + dirY * s * 900;
      const car = rig.car || rig.movers?.[0]?.node;
      if (car && rig.type === 'elevator') { const b = base.get(car); const a = accel[0]; car.y = b.y + (a ? a[1] * -2.5 * Math.min(1, u * 8) * (1 - Math.max(0, u - .9) * 10) : 0); }
      hum?.rate(v);
    } else if (rig.type === 'fall') {
      const k = rig.up ? -1 : 1;
      for (const c of build.clouds) { c.__y0 ??= c.y; c.y = c.__y0 - k * s * 520; }
      const b = base.get(rig.node); rig.node.x = b.x + Math.sin(u * 9) * 2; rig.node.rotation = b.r + Math.sin(u * 7) * .02;
      wind?.rate(.3 + .7 * v);
    }
    hiss?.rate(rig.type === 'translate' && (rig.sound || prof === 'slow') ? v : 0);
    drawMarkers(u);
  }

  function legendHtml() {
    const icon = (vec, col) => vec ? `<svg viewBox="-13 -13 26 26"><g transform="rotate(${Math.atan2(vec[1], vec[0]) * 180 / Math.PI})"><path d="M-9 0 H6" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/><path d="M10 0 L3 -6 L3 6Z" fill="${col}"/></g></svg>` : `<svg viewBox="-13 -13 26 26"><circle r="5" fill="${col}"/></svg>`;
    const i = 0, v = vel[i], a = accel[i];
    const change = prof === 'speed' ? 'speeding up' : prof === 'slow' ? 'slowing down' : prof === 'const' ? 'constant speed' : 'at rest';
    const obj = sc.multi ? ` <small>(${sc.objects[0].name})</small>` : '';
    return `<div class="cine-chip">${icon(v, '#2c9a55')}<span class="v">Velocity</span>${v ? words(v) : 'zero'}${obj}</div>` +
      `<div class="cine-chip">${icon(a, '#8a46d8')}<span class="a">Acceleration</span>${a ? words(a) : 'zero'} <small>· ${change}</small></div>`;
  }

  let u = 0, playing = false, hold = 0;
  return {
    duration,
    async start() {
      for (const [n, b] of base) n.position.set(b.x, b.y);
      if (rig.type === 'elevator' || rig.type === 'shaftLift') { await prepareShaft(); tile.alpha = 1; hum = Sound.hum('motor'); }
      if (rig.type === 'translate' && (rig.sound || prof === 'slow')) hiss = Sound.slide(rig.sound || 'hard');
      if (rig.type === 'fall') wind = Sound.wind();
      u = 0; hold = 0; playing = true; floorTimer = 0;
      if (rig.type === 'elevator') scene.setFloor(rig.floor, 0, rig.dir, prof);
      apply(0);
      return legendHtml();
    },
    /** Advance by dt seconds of animation time; returns false when finished. */
    update(dt) {
      if (!playing) return false;
      if (u < 1) {
        u = Math.min(1, u + dt / duration);
        apply(u);
        if (rig.type === 'elevator') { floorTimer += dt * V[prof](u); scene.setFloor(rig.floor, floorTimer, rig.dir, prof, u); }
        if (u >= 1) { hum?.stop(); hiss?.stop(); wind?.stop(); hum = hiss = wind = null; if (rig.type === 'elevator' && prof === 'slow') Sound.play('bell'); else if (prof === 'slow') Sound.play('thud'); }
        return true;
      }
      hold += dt; return hold < 1.1;
    },
    stop() {
      playing = false; hum?.stop(); hiss?.stop(); wind?.stop(); hum = hiss = wind = null;
      for (const [n, b] of base) { n.position.set(b.x, b.y); n.rotation = b.r; }
      for (const sp of build.spinners) sp.node.rotation = 0;
      for (const c of build.clouds) if (c.__y0 != null) c.y = c.__y0;
      if (tile) { tile.alpha = 0; tile.tilePosition.y = tileBase; }
      markers.clear();
      if (rig.type === 'elevator') scene.setFloor(rig.floor, -1);
      for (const r of build.ropes) r.draw();
    },
    ropes: () => build.ropes.forEach(r => r.draw())
  };
}

function arrow(g, x, y, [ux, uy], L, col) {
  const hx = x + ux * L, hy = y + uy * L, px = -uy, py = ux, bx = hx - ux * 12, by = hy - uy * 12;
  g.moveTo(x, y).lineTo(bx, by).stroke({ width: 9, color: 0xffffff, alpha: .9, cap: 'round' });
  g.moveTo(x, y).lineTo(bx, by).stroke({ width: 5, color: col, cap: 'round' });
  g.poly([hx, hy, bx + px * 8, by + py * 8, bx - px * 8, by - py * 8]).fill(col).stroke({ width: 2, color: 0xffffff, alpha: .9 });
}
function dot(g, x, y, col) { g.circle(x, y, 6).fill(col).stroke({ width: 2.5, color: 0xffffff }); }
