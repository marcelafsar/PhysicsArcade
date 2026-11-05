/* Composer: turns a captured scenario scene into layered PixiJS art.
   One composer per teacher scene builder (same geometry formulas, so every surface,
   rope angle and pulley lands where the original put it), plus composers for the
   scenarios whose pictures were drawn inline. Composers also describe the scenario's
   motion for the outcome animation (anim.js); they never invent numbers. */
import { Container, Sprite, Graphics, TilingSprite, Texture } from 'pixi.js';
import { P, R, C as Cc, E, Pth, Ln, Tx, G, paper, block, shade, light, mix, svgTexture, retain } from './art/kit.js';
import { PROPS } from './art/props.js';
import { ENVS, BLEED, inclineEnv } from './art/envs.js';
import { makePerson, POSE } from './art/people.js';
import { captureScene, identify, identifySvg, rampStyle } from './capture.js';

const decorUrls = import.meta.glob('../../assets/vendor/kenney/background-elements/*.png', { eager: true, query: '?url', import: 'default' });
const DECOR = Object.fromEntries(Object.entries(decorUrls).map(([p, u]) => [p.split('/').pop().replace('.png', ''), u]));
const decorTex = new Map();
async function decorTexture(name) {
  if (!decorTex.has(name)) decorTex.set(name, new Promise((res, rej) => { const img = new Image(); img.onload = () => res(Texture.from(img)); img.onerror = rej; img.src = DECOR[name]; }));
  return decorTex.get(name);
}
export const rad = d => d * Math.PI / 180;
const at = (c, ang, L) => [c[0] + L * Math.cos(rad(ang)), c[1] - L * Math.sin(rad(ang))];
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/* Character appearance for drawn arms (sleeve, skin) — sampled from the Kenney sheets. */
const LOOK = { femalePerson: ['#3ab675', '#9a6247'], malePerson: ['#e6e9ec', '#a86a46'], femaleAdventurer: ['#74a6c3', '#efb894'], maleAdventurer: ['#3ab776', '#f0b48e'] };

/* =====================================================================
   Build — collects layers, raster jobs, annotations and the motion rig
   ===================================================================== */
export class Build {
  constructor(res, view) {
    this.res = res; this.view = view;
    this.root = new Container();
    for (const n of ['back', 'decor', 'mid', 'actors', 'front', 'fx']) { this[n] = new Container(); this[n].label = n; this.root.addChild(this[n]); }
    this.jobs = []; this.textures = new Set(); this.setSvg = ''; this.envSvg = ''; this.info = '';
    this.objs = []; this.ropes = []; this.spinners = []; this.clouds = []; this.fxList = []; this.cine = null; this.ambient = [];
  }
  job(p) { this.jobs.push(p); return p; }
  keep(t) { if (!this.textures.has(t)) { this.textures.add(t); retain(t); } return t; }
  async finish() {
    const [vx, vy, vw, vh] = this.view;
    const tex = await svgTexture(this.envSvg + this.setSvg, [vx, vy, vw, vh], this.res);
    this.keep(tex);
    const bg = new Sprite(tex); bg.position.set(vx, vy); bg.scale.set(1 / this.res); this.back.addChildAt(bg, 0);
    await Promise.all(this.jobs);
    for (const r of this.ropes) r.draw();
    return this;
  }
  /* ---- environment ---- */
  env(name, opts = {}) {
    const e = (typeof name === 'object') ? name : ENVS[name](opts);
    this.envSvg += e.svg;
    for (const d of e.decor || []) this.job(this.decorSprite(d));
    for (const [img, x, y, s] of e.clouds || []) this.job(this.cloud(img, x, y, s));
    this.fxList.push(...(e.fx || []));
    return this;
  }
  set(svg) { this.setSvg += svg; return this; }
  async decorSprite({ img, x, y, h, layer = 'back', flip }) {
    const tex = await decorTexture(img); const s = new Sprite(tex);
    s.anchor.set(.5, 1); const k = h / tex.height; s.scale.set(flip ? -k : k, k); s.position.set(x, y);
    (layer === 'mid' ? this.mid : this.decor).addChild(s);
  }
  async cloud(img, x, y, s) {
    const tex = await decorTexture(img); const sp = new Sprite(tex);
    sp.anchor.set(.5); sp.scale.set(s); sp.position.set(x, y); sp.alpha = .95;
    this.decor.addChildAt(sp, 0); this.clouds.push(sp);
  }
  /* ---- objects ---- */
  /** spec: identify() result. Placed at c, rotated by rot degrees (SVG/Pixi clockwise-positive). */
  prop(spec, c, rot = 0, layer = 'actors') {
    const node = new Container(); node.position.set(c[0], c[1]); node.rotation = rad(rot); node.label = `prop:${spec.kind}`;
    this[layer].addChild(node);
    this.job(this.fillProp(node, spec));
    return node;
  }
  async fillProp(node, spec) {
    const fn = PROPS[spec.kind];
    let out = fn ? fn(spec.w, spec.h, spec) : paper(spec.svg || '');
    if (typeof out === 'string') out = { svg: out, people: [] };
    const w = spec.w || 80, h = spec.h || 80, pad = Math.max(w, h) * .6 + 26;
    const box = [-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + 2 * pad];
    const people = await Promise.all((out.people || []).map(p => makePerson(p, this.res)));
    people.forEach((p, i) => { if (out.people[i].behind) node.addChild(p); });
    if (out.svg) {
      const tex = await svgTexture(out.svg, box, this.res, `${spec.kind}:${w}x${h}:${spec.col}:${spec.txt}`);
      this.keep(tex);
      const s = new Sprite(tex); s.position.set(box[0], box[1]); s.scale.set(1 / this.res); node.addChild(s);
    }
    people.forEach((p, i) => { if (!out.people[i].behind) node.addChild(p); });
  }
  /** Static or animated SVG piece drawn in its own local coordinates. */
  piece(svg, box, x = 0, y = 0, layer = 'mid', key) {
    const node = new Container(); node.position.set(x, y); this[layer].addChild(node);
    this.job(svgTexture(svg, box, this.res, key).then(tex => { this.keep(tex); const s = new Sprite(tex); s.position.set(box[0], box[1]); s.scale.set(1 / this.res); node.addChild(s); }));
    return node;
  }
  person(spec, layer = 'actors') {
    const node = new Container(); this[layer].addChild(node);
    this.job(makePerson(spec, this.res).then(p => node.addChild(p)));
    return node;
  }
  /** Rigged puller/pusher: Kenney body with a drawn arm whose hand sits exactly at `hand`.
   *  side = +1 when the body stands to the right of the hand. */
  puller({ hand, ground, side = 1, H = 176, char = 'malePerson', pose = 'behindBack', reach = .42 }, layer = 'actors') {
    const node = new Container(); this[layer].addChild(node);
    const sh = ground - .45 * H;                                       // shoulder height
    const vy = sh - hand[1], armLen = reach * H;
    const dx = Math.sqrt(Math.max(0, armLen * armLen - vy * vy)) * .85 + .12 * H;
    const footX = hand[0] + side * dx;
    const shoulder = [footX - side * .16 * H, sh];
    const [sleeve, skin] = LOOK[char] || LOOK.malePerson;
    this.job(makePerson({ pose, char, x: footX, y: ground, height: H, flip: side > 0 }, this.res).then(p => {
      node.addChildAt(p, 0);
      const arm = new Graphics();
      const ex = shoulder[0] + (hand[0] - shoulder[0]) * .5, ey = shoulder[1] + (hand[1] - shoulder[1]) * .5;
      arm.moveTo(...shoulder).lineTo(ex, ey).stroke({ width: .085 * H, color: sleeve, cap: 'round' });
      arm.moveTo(ex, ey).lineTo(...hand).stroke({ width: .062 * H, color: skin, cap: 'round' });
      arm.circle(hand[0], hand[1], .05 * H).fill(skin);
      node.addChild(arm);
    }));
    node.__hand = hand;
    return node;
  }
  /** Rope/cable whose end points are live getters (so they follow objects during motion). */
  rope(points, { color = P.rope, width = 2.6, layer = 'mid' } = {}) {
    const g = new Graphics(); this[layer].addChild(g);
    const r = { g, points, draw() { const pts = points.map(p => typeof p === 'function' ? p() : p); g.clear(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q); g.stroke({ width, color, cap: 'round', join: 'round' }); } };
    this.ropes.push(r); return r;
  }
  pulley(x, y, r, layer = 'front') {
    const node = this.piece(paper(Cc(0, 0, r, '#d5dbe0') + Cc(0, 0, r - Math.max(3, r * .18), '#b8c0c8') + Ln(`M${-r * .7} 0 H${r * .7} M0 ${-r * .7} V${r * .7}`, '#8f979f', Math.max(2, r * .12)) + Cc(0, 0, Math.max(3, r * .2), '#5d5566')), [-r - 10, -r - 10, 2 * r + 20, 2 * r + 24], x, y, layer, `pulley${r}`);
    this.spinners.push({ node, r }); return node;
  }
  /* ---- annotations (crisp SVG overlay in the diagram's own coordinates) ---- */
  motionCue(dir, x, y, note, onDark = false) {
    const [dx, dy] = DIRV[dir], L = 96, x2 = x + dx * L, y2 = y + dy * L, px = -dy, py = dx;
    const col = onDark ? '#f5efe4' : '#3b3140', halo = onDark ? '#2b2730' : '#fffaf1';
    const head = `${x2},${y2} ${x2 - dx * 13 + px * 7},${y2 - dy * 13 + py * 7} ${x2 - dx * 13 - px * 7},${y2 - dy * 13 - py * 7}`;
    const horiz = dx !== 0, tx = horiz ? (x + x2) / 2 : x + 14, ty = horiz ? y - 26 : Math.min(y, y2) + 36, anchor = horiz ? 'middle' : 'start';
    this.info += `<g class="cue" style="--halo:${halo}"><line x1="${x}" y1="${y}" x2="${x2 - dx * 11}" y2="${y2 - dy * 11}" stroke="${col}" stroke-width="3.2" stroke-dasharray="8 6" stroke-linecap="round"/><polygon points="${head}" fill="${col}"/>
      <text class="cue-k" x="${tx}" y="${ty}" text-anchor="${anchor}" fill="${col}">motion</text>${note ? `<text class="cue-n" x="${tx}" y="${ty + 16}" text-anchor="${anchor}" fill="${col}">${note}</text>` : ''}</g>`;
  }
  slopeCue({ x, y, ang, t1, t2 }) {
    this.info += `<g class="cue" style="--halo:#fffaf1"><g transform="translate(${x} ${y}) rotate(${-ang})"><path d="M0 0 h80" stroke="#3b3140" stroke-width="3.2" stroke-dasharray="8 6" stroke-linecap="round"/><polygon points="94,0 80,-7 80,7" fill="#3b3140"/></g>
      <text class="cue-k" x="${x}" y="${y + 34}" fill="#3b3140">${t1}</text><text class="cue-n" x="${x}" y="${y + 50}" fill="#3b3140">${t2}</text></g>`;
  }
  label(x, y, t, anchor = 'middle') {
    this.info += `<text class="tag-label" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  }
  angleMark(px, py, theta) {
    const t = rad(theta), s = Math.sin(t), co = Math.cos(t), Rr = 62;
    this.info += `<g class="angle"><line x1="${px}" y1="${py}" x2="${px + Rr + 30}" y2="${py}" stroke="#3d2f1a" stroke-width="1.6" stroke-dasharray="5 4"/>
      <path d="M${px + Rr} ${py} A${Rr} ${Rr} 0 0 0 ${px + Rr * co} ${py - Rr * s}" fill="none" stroke="#3d2f1a" stroke-width="2"/>
      <text x="${px + (Rr + 14) * Math.cos(t / 2)}" y="${py - (Rr + 14) * Math.sin(t / 2) + 5}">${theta}°</text></g>`;
  }
  /* ---- motion rig ---- */
  obj(i, node) { this.objs[i] = node; return node; }
}

/* =====================================================================
   Composers for the teacher's scene builders
   ===================================================================== */
const SURF = { counter: 'kitchen', floor: 'livingroom', gym: 'gym', stage: 'stage' };
const COMPOSE = {
  restScene(b, [setting, o, c], sc) {
    const y0 = c[1] + o.h / 2;
    if (setting === 'stand') b.env('stand', { y: y0, x: c[0] });
    else b.env(sc.id === 'backpack' ? 'classroom' : SURF[setting] || 'room', { y: y0 });
    b.obj(0, b.prop(identify(o), c));
    b.cine = { type: 'rest' };
  },
  hangScene(b, [top, o, c], sc) {
    const ty = c[1] - o.h / 2;
    const ay = { ceiling: 26, beam: 30, crane: 46, branch: 42, helicopter: 42, cliff: 0, well: 30, shaft: 0 }[top] ?? 26;
    const envName = { ceiling: 'lobby', beam: 'gymBeam', crane: 'construction', branch: 'park', helicopter: 'heliSky', cliff: 'cliff', well: 'well', shaft: 'shaft' }[top];
    b.env(envName, top === 'well' ? { y: 300, x: c[0] } : top === 'ceiling' ? { ceil: 26 } : { y: 404 });
    if (top === 'branch') b.set(paper(Pth('M-60 18 Q200 52 420 32 Q520 24 700 44 L700 64 Q520 46 420 54 Q200 74 -60 42Z', '#7b4f33') + Pth('M-60 18 Q200 52 420 32 L420 38 Q200 58 -60 26Z', light('#7b4f33', .2))) + Cc(80, 18, 54, '#4f9a52') + Cc(30, 0, 40, '#5fae5c') + Cc(540, 22, 62, '#4f9a52') + Cc(600, 4, 46, '#5fae5c'));
    if (top === 'helicopter') b.heli = b.piece(paper(Pth('M-80 20 h140 q32 0 32 24 h-204 q0 -24 32 -24z', '#d9433a') + Pth('M-50 24 h70 q10 0 10 10 h-90z', '#cfe8f6') + R(60, 30, 130, 8, '#d9433a', 4) + R(180, 16, 8, 26, '#b8352a', 3) + R(-40, 44, 120, 4, '#3a3640', 2) + Ln('M-30 44 v8 M50 44 v8', '#3a3640', 3) + R(-130, 4, 260, 5, '#3a3640', 2) + R(-4, 9, 8, 11, '#3a3640')), [-150, -10, 360, 80], c[0], 0, 'front', 'heli');
    const node = b.obj(0, b.prop(identify(o), c));
    b.rope([[c[0], ay], () => [node.x, node.y - o.h / 2]], { color: top === 'shaft' || top === 'crane' ? P.cable : P.rope, width: top === 'shaft' ? 3.4 : 2.8 });
    const m = b.capture.motions[0];
    if (m) b.motionCue(m.dir, m.x, m.y, m.note, top === 'shaft');
    b.cine = m ? { type: top === 'shaft' ? 'shaftLift' : 'translate', change: m.note, movers: [{ node, dir: DIRV[m.dir], D: 70 }] } : { type: 'rest', sway: top !== 'shaft' };
  },
  fallScene(b, [o, c, note]) {
    b.env('skydive');
    const node = b.obj(0, b.prop(identify(o), c));
    b.motionCue('down', 540, 120, note);
    b.cine = { type: 'fall', change: note, node };
  },
  slideScene(b, [surface, o, c, dir, note]) {
    const y0 = c[1] + o.h / 2;
    b.env({ warehouse: 'warehouse', infield: 'infield', counter: 'diner', shuffle: 'shuffle', labtable: 'labtable' }[surface] || 'room', { y: y0 });
    const node = b.obj(0, b.prop(identify(o), c));
    b.motionCue(dir, dir === 'right' ? 420 : 200, 110, note);
    b.cine = { type: 'translate', change: note, movers: [{ node, dir: DIRV[dir], D: 130 }], sound: surface === 'shuffle' || surface === 'counter' ? 'hard' : 'hard' };
  },
  floatScene(b, [o, c, setting]) {
    const wl = c[1] + 4;
    if (setting === 'tub') b.env('bathroom', { y: wl }); else b.env('pond', { y: wl });
    const node = b.obj(0, b.prop(identify(o), c));
    water(b, wl, setting === 'tub' ? [34, 600] : null);
    b.cine = { type: 'rest', bob: node };
  },
  springScene(b, [o, c, mount], sc) {
    const ty = c[1] - o.h / 2;
    let sy;
    if (mount === 'lab') { b.env('lab', { y: 404 }); b.set(paper(R(120, 26, 14, 380, '#5d6670', 4) + R(120, 20, 220, 10, '#5d6670', 4) + R(80, 398, 140, 12, '#3c3742', 4) + Cc(330, 25, 7, '#8f979f'))); sy = 30; }
    else {
      b.env(sc.id === 'grocery-scale' ? 'market' : 'doorframe', { ceil: 26 });
      b.set(paper(R(c[0] - 24, 26, 48, 40, '#f4efe6', 8) + Cc(c[0], 46, 14, '#fffaf1') + Ln(`M${c[0]} 46 l7 -8`, '#d9433a', 2.5) + Cc(c[0], 46, 2.5, '#2b2730')));
      sy = 66;
    }
    const node = b.obj(0, b.prop(identify(o), c));
    const spring = new Graphics(); b.mid.addChild(spring);
    const draw = () => { const bottom = node.y - o.h / 2 - 8, n = 12, seg = (bottom - sy) / n; spring.clear(); spring.moveTo(c[0], sy); for (let i = 0; i < n; i++) spring.lineTo(c[0] + (i % 2 ? -10 : 10), sy + seg * (i + .5)); spring.lineTo(c[0], bottom).lineTo(c[0], node.y - o.h / 2); spring.stroke({ width: 3, color: '#5d6670', join: 'round', cap: 'round' }); };
    b.ropes.push({ draw });
    b.cine = { type: 'rest', spring: node };
  },
  elevator(b, [dir, note, floor], sc) { elevatorScene(b, dir, note, floor, sc); },
  skydiver(b, [note], sc) {
    b.env('skydive');
    const node = b.obj(0, b.prop({ kind: 'skydiver', w: 150, h: 60 }, sc.objects[0].c));
    b.motionCue('down', 540, 120, note);
    b.cine = { type: 'fall', change: note, node };
  },
  incline(b, [opts], sc) { inclineScene(b, opts, sc); },
  pullScene(b, [o, c, ang, ground, note, col, L = 150], sc) {
    const gy = c[1] + o.h / 2, h = at(c, ang, L);
    flatGround(b, ground, gy);
    const node = b.obj(0, b.prop(identify(o), c));
    const p = b.puller({ hand: h, ground: gy, side: 1, H: 150, char: ['malePerson', 'femalePerson', 'maleAdventurer'][sc.id.length % 3] });
    b.rope([() => [node.x, node.y], () => [p.x + h[0], p.y + h[1]]], { color: '#8d6e3f', width: 3, layer: 'actors' });
    b.motionCue('right', 60, 90, note);
    b.cine = { type: 'translate', change: note, movers: [{ node, dir: [1, 0], D: 110 }, { node: p, dir: [1, 0], D: 110 }], walk: p };
  },
  pushScene(b, [o, c, below, ground, note, col, L = 165], sc) {
    const gy = c[1] + o.h / 2, h = at(c, 180 - below, L);
    flatGround(b, ground, gy);
    const node = b.obj(0, b.prop(identify(o), c));
    const handle = new Graphics(); b.actors.addChild(handle);
    const p = b.puller({ hand: h, ground: gy, side: -1, H: 150, char: ['femaleAdventurer', 'malePerson', 'femalePerson'][sc.id.length % 3] });
    b.ropes.push({ draw: () => { handle.clear(); handle.moveTo(node.x, node.y).lineTo(p.x + h[0], p.y + h[1]).stroke({ width: 5, color: '#3c3742', cap: 'round' }); } });
    b.motionCue('right', 440, 90, note);
    b.cine = { type: 'translate', change: note, movers: [{ node, dir: [1, 0], D: 110 }, { node: p, dir: [1, 0], D: 110 }], walk: p };
  },
  twoCableScene(b, [o, c, a1, a2, bg], sc) {
    const p1 = at(c, 180 - a1, 250), p2 = at(c, a2, 250), top = c[1] - o.h / 2;
    const kind = sc.id;
    if (kind === 'spotlight') b.env('stage', { y: 404 });
    else if (kind === 'shop-sign') b.env('sidewalk', { y: 410 });
    else b.env('park', { y: 410 });
    const post = (p, flip) => paper(R(p[0] - 8, p[1], 16, 470 - p[1], kind === 'pinata' ? '#7b4f33' : '#5d6670', 4) + R(p[0] - 12, p[1] - 6, 24, 10, shade(kind === 'pinata' ? '#7b4f33' : '#5d6670', .2), 4));
    b.set(post(p1) + post(p2));
    b.rope([[c[0], top], p1], { color: P.cable, width: 3 });
    b.rope([[c[0], top], p2], { color: P.cable, width: 3 });
    b.obj(0, b.prop(identify(o), c));
    b.label(c[0] + 0.78 * (p1[0] - c[0]) + 6, top + 0.78 * (p1[1] - top) - 10, 'cable 1', 'start');
    b.label(c[0] + 0.78 * (p2[0] - c[0]) - 6, top + 0.78 * (p2[1] - top) - 10, 'cable 2', 'end');
    b.cine = { type: 'rest', sway: false };
  },
  heldScene(b, [o, c, phi, kind]) {
    const top = at(c, 90 + phi, 230);
    if (kind === 'swing') {
      b.env('playground', { y: 404 });
      b.set(paper(R(top[0] - 120, top[1] - 8, 280, 14, '#c8433a', 5) + Pth(`M${top[0] - 120} ${top[1]} L${top[0] - 150} 404 L${top[0] - 136} 404 L${top[0] - 108} ${top[1]}Z`, '#c8433a') + Pth(`M${top[0] + 150} ${top[1]} L${top[0] + 180} 404 L${top[0] + 166} 404 L${top[0] + 138} ${top[1]}Z`, '#c8433a')));
    } else { b.env('gymBeam'); b.set(paper(R(X(-400), 0, 1500, top[1] + 4, '#4b4652'))); }
    const node = b.obj(0, b.prop(identify(o), c));
    b.rope([top, () => [node.x, node.y]], { color: '#5d6670', width: kind === 'swing' ? 3 : 4 });
    const side = kind === 'swing' ? 1 : -1;
    b.puller({ hand: [c[0] + side * (o.w / 2 + 4), c[1]], ground: 404, side, H: 152, char: kind === 'swing' ? 'malePerson' : 'maleAdventurer' });
    b.cine = { type: 'rest' };
  },
  atwoodScene(b, [Lc, Rc, Lo, Ro, Ln1, Rn, Lnote, Rnote, Ldir, Rdir], sc) {
    atwoodRig(b, Lc, Rc, Lo, Ro, sc);
    b.label(Lc[0] - Lo.w / 2 - 8, Lc[1] + 5, Ln1, 'end'); b.label(Rc[0] + Ro.w / 2 + 8, Rc[1] + 5, Rn, 'start');
    b.motionCue(Ldir, 150, Ldir === 'down' ? 120 : 300, Lnote); b.motionCue(Rdir, 500, Rdir === 'up' ? 300 : 120, Rnote);
    b.cine = { type: 'translate', change: Lnote, movers: [{ node: b.objs[0], dir: DIRV[Ldir], D: 60 }, { node: b.objs[1], dir: DIRV[Rdir], D: 60 }], spinDir: Ldir === 'down' ? -1 : 1 };
  },
  tableHangScene(b, [topO, topC, hangO, hangC, surf, notes]) {
    const ty = topC[1] + topO.h / 2, py = ty - 20;
    tableSurface(b, surf, ty);
    const top = b.obj(0, b.prop(identify(topO), topC));
    const hang = b.obj(1, b.prop(identify(hangO), hangC));
    b.set(paper(Ln(`M470 ${ty} L482 ${py}`, '#5d6670', 5)));
    b.pulley(482, py, 12);
    b.rope([() => [top.x + topO.w / 2, top.y], [482, py - 12]], { color: '#3a3640', width: 2.2 });
    b.rope([[494, py], () => [hang.x, hang.y - hangO.h / 2]], { color: '#3a3640', width: 2.2 });
    b.motionCue('right', 120, 110, notes[0]); b.motionCue('down', 560, 330, notes[1]);
    b.cine = { type: 'translate', change: notes[0], movers: [{ node: top, dir: [1, 0], D: 70 }, { node: hang, dir: [0, 1], D: 70 }] };
  },
  pushPairScene(b, [oA, cA, oB, cB, nameA, nameB, floorKind, pusher, gy]) {
    const gA = [cA[0], gy - oA.h / 2], gB = [cB[0], gy - oB.h / 2];
    b.env({ classroom: 'classroom', lab: 'lab', warehouse: 'warehouse', store: 'store' }[floorKind] || 'garage', { y: gy });
    const A = b.obj(0, b.prop(identify(oA), gA)), B = b.obj(1, b.prop(identify(oB), gB));
    const hand = [cA[0] - oA.w / 2, gA[1]];
    let who;
    if (pusher === 'forklift') who = b.piece(paper(block(-120, -70, 90, 60, '#e9b23a', 6) + R(-110, -100, 46, 34, '#cfe8f6', 4) + R(-114, -104, 54, 6, '#3c3742', 2) + R(-30, -110, 8, 110, '#5d6670') + R(-30, cA[1] - gy - 6, 30, 8, '#5d6670') + Cc(-100, -8, 12, '#2b2730') + Cc(-50, -8, 12, '#2b2730')), [-140, -130, 160, 140], hand[0], gy, 'actors', 'forklift');
    else if (pusher === 'hand') who = b.piece(Ln('M-80 0 H-6', '#e0a77c', 16) + Cc(-4, 0, 9, '#e0a77c'), [-100, -20, 110, 40], hand[0], hand[1], 'actors', 'hand');
    else who = b.puller({ hand, ground: gy, side: -1, H: 148, char: 'maleAdventurer' });
    b.label(gA[0] - oA.w / 2 + 4, gy + 24, nameA, 'start'); b.label(gB[0] + oB.w / 2 - 4, gy + 24, nameB, 'end');
    b.motionCue('right', 470, 100, 'speeding up');
    b.cine = { type: 'translate', change: 'speeding up', movers: [A, B, who].map(node => ({ node, dir: [1, 0], D: 100 })) };
  },
  towScene(b, [oB, cB, oF, cF, nameB, nameF, ground, puller, note]) {
    const gy = cB[1] + Math.max(oB.h, oF.h) / 2, end = [560, cF[1]];
    flatGround(b, ground, gy);
    const back = b.obj(0, b.prop(identify(oB), cB)), front = b.obj(1, b.prop(identify(oF), cF));
    let who;
    if (puller === 'probe') who = b.piece(paper(R(-12, -14, 60, 28, '#f2c63d', 6) + R(-6, -6, 30, 12, '#2b2730', 3) + Tx(9, 3, 'N', 9, '#7ee08a')) + Ln('M48 0 H90', '#e0a77c', 14), [-20, -24, 120, 48], 560, cF[1], 'actors', 'probe');
    else who = b.puller({ hand: end, ground: gy, side: 1, H: 150, char: 'femaleAdventurer' });
    b.rope([() => [back.x + oB.w / 2, back.y], () => [front.x - oF.w / 2, front.y]], { color: '#e9a21f', width: 3, layer: 'actors' });
    const handAt = puller === 'probe' ? () => [who.x - 12, who.y] : () => [who.x + end[0], who.y + end[1]];
    b.rope([() => [front.x + oF.w / 2, front.y], handAt], { color: '#e9a21f', width: 3, layer: 'actors' });
    b.label((cB[0] + oB.w / 2 + cF[0] - oF.w / 2) / 2, cB[1] + 38, 'rope 2'); b.label((cF[0] + oF.w / 2 + end[0]) / 2, cF[1] + 38, 'rope 1');
    b.label(cB[0], gy + 28, nameB); b.label(cF[0], gy + 28, nameF);
    b.motionCue('right', 60, 90, note);
    b.cine = { type: 'translate', change: note, movers: [back, front, who].map(node => ({ node, dir: [1, 0], D: 100 })) };
  },
  stackScene(b, [oT, cT, oB, cB, nameT, nameB, surface]) {
    const y0 = cB[1] + oB.h / 2;
    if (surface === 'desk') { b.env('room', { y: 404 }); b.set(deskSvg(90, y0, 460)); }
    else if (surface === 'counter') b.env('kitchen', { y: y0 });
    else if (surface === 'chair') { b.env('livingroom', { y: 404 }); b.set(paper(R(cB[0] - 100, y0, 200, 14, '#8a5a34', 4) + R(cB[0] - 96, y0 + 14, 12, 404 - y0 - 14, '#6e4630') + R(cB[0] + 84, y0 + 14, 12, 404 - y0 - 14, '#6e4630') + R(cB[0] + 84, y0 - 150, 12, 150, '#6e4630', 4) + R(cB[0] + 80, y0 - 156, 20, 24, '#8a5a34', 6))); }
    else b.env('livingroom', { y: y0 });
    b.obj(1, b.prop(identify(oB), cB)); b.obj(0, b.prop(identify(oT), cT));
    b.label(cT[0] - oT.w / 2 - 10, cT[1] + 5, nameT, 'end'); b.label(cB[0] + oB.w / 2 + 10, cB[1] + 5, nameB, 'start');
    b.cine = { type: 'rest' };
  },
  inclinePulleyScene(b, [theta, crO, cC, hgO, motionUp], sc) {
    const t = rad(theta), s = Math.sin(t), co = Math.cos(t);
    const bx = cC[0] + s * crO.h / 2, by = cC[1] + co * crO.h / 2;
    const yTop = by - ((470 - bx) / co) * s, pc = [486, yTop - 16];
    const face = [cC[0] + co * crO.w / 2, cC[1] - s * crO.w / 2];
    const hc = [500, Math.min(yTop + 150, 320)];
    inclineScene(b, { theta, c: cC, h: crO.h, xTop: 470, objSpec: identify(crO) }, sc, true);
    b.set(paper(Ln(`M470 ${yTop} L${pc[0]} ${pc[1]}`, '#5d6670', 5)) + paper(R(470, yTop, 120, 420, '#9a8f80', 2)));
    b.pulley(pc[0], pc[1], 14);
    const crate = b.objs[0], hang = b.obj(1, b.prop(identify(hgO), hc));
    b.rope([() => [crate.x + co * crO.w / 2, crate.y - s * crO.w / 2], [pc[0] - 14 * s, pc[1] - 14 * co]], { color: '#3a3640', width: 2.2 });
    b.rope([[500, pc[1]], () => [hang.x, hang.y - hgO.h / 2]], { color: '#3a3640', width: 2.2 });
    b.motionCue(motionUp ? 'down' : 'up', 560, motionUp ? 300 : 410, 'speeding up');
    const along = motionUp ? [co, -s] : [-co, s];
    b.cine = { type: 'translate', change: 'speeding up', movers: [{ node: crate, dir: along, D: 60 }, { node: hang, dir: motionUp ? [0, 1] : [0, -1], D: 60 }] };
  },
  liftScene(b, [itemO, cI, carO, cC, note, dir], sc) {
    b.env(sc.id === 'window-washer' ? 'building' : 'restaurantShaft');
    const car = b.obj(1, b.prop(identify(carO), cC));
    const item = b.obj(0, b.prop(identify(itemO), cI));
    b.rope([[cC[0], -200], () => [car.x, car.y - carO.h / 2]], { color: P.cable, width: 3.4 });
    b.motionCue(dir, 540, dir === 'up' ? 300 : 130, note, sc.id !== 'window-washer');
    b.cine = sc.id === 'window-washer'
      ? { type: 'translate', change: note, movers: [{ node: car, dir: DIRV[dir], D: 80 }, { node: item, dir: DIRV[dir], D: 80 }] }
      : { type: 'shaftLift', change: note, movers: [{ node: car, dir: DIRV[dir], D: 0 }, { node: item, dir: DIRV[dir], D: 0 }], dir };
  }
};
const X = v => v;

function water(b, wl, span) {
  const g = new Graphics();
  if (span) g.rect(span[0], wl, span[1] - span[0], 420 - wl).fill({ color: 0x5aa9d6, alpha: .62 });
  else g.rect(BLEED[0], wl, BLEED[2], 800).fill({ color: 0x3d86b8, alpha: .8 });
  g.rect(span ? span[0] : BLEED[0], wl - 1, span ? span[1] - span[0] : BLEED[2], 3).fill({ color: 0xcdebf7, alpha: .9 });
  b.front.addChild(g);
  const ripples = new Graphics();
  for (let i = 0; i < 9; i++) { const x = (span ? span[0] + 30 : -200) + i * 110, y = wl + 30 + (i % 3) * 34; ripples.moveTo(x, y).lineTo(x + 50, y); }
  ripples.stroke({ width: 3, color: 0xbfe3f7, alpha: .7, cap: 'round' });
  b.front.addChild(ripples); b.ambient.push({ kind: 'ripples', node: ripples });
}
function flatGround(b, ground, gy) {
  const env = { snow: ['snowfield'], sand: ['beach'], grass: ['lawn'], carpet: ['livingroom'], wood: ['gym'], sidewalk: ['sidewalk'], lab: ['lab'], gravel: ['park'] }[ground] || ['park'];
  b.env(env[0], { y: gy });
  if (!['snow', 'sand', 'grass', 'carpet', 'wood', 'sidewalk', 'lab'].includes(ground)) b.set(R(BLEED[0], gy, BLEED[2], 30, '#cdc3b2') + R(BLEED[0], gy, BLEED[2], 4, '#e2d9ca'));
}
function deskSvg(x, y, w) { return paper(R(x, y, w, 16, '#8a5a34', 4) + R(x, y, w, 4, light('#8a5a34', .3), 2) + R(x + 20, y + 16, 16, 404 - y - 16, '#6e4630') + R(x + w - 36, y + 16, 16, 404 - y - 16, '#6e4630')); }
function tableSurface(b, surf, ty) {
  if (surf === 'desk') { b.env('room', { y: 404 }); b.set(paper(R(30, ty, 460, 16, '#8a5a34', 3) + R(30, ty, 460, 4, light('#8a5a34', .3)) + R(50, ty + 16, 14, 440, '#6e4630') + R(452, ty + 16, 14, 440, '#6e4630'))); }
  else if (surf === 'dock') b.env('dockLake', { y: ty });
  else if (surf === 'deck') { b.env('deckSnow', { y: ty }); b.set(paper(R(BLEED[0], ty, 490 - BLEED[0], 30, '#fbfdff') + R(BLEED[0], ty + 30, 490 - BLEED[0], 400, '#8a5a34') + Array.from({ length: 20 }, (_, i) => R(BLEED[0] + i * 50, ty + 34, 4, 400, shade('#8a5a34', .2))).join(''))); }
  else { b.env('lab', { y: 404 }); b.set(paper(R(30, ty, 460, 18, '#3c3742', 3) + R(30, ty, 460, 4, '#5d5566') + R(50, ty + 18, 14, 440, '#4b4652') + R(452, ty + 18, 14, 440, '#4b4652'))); }
}
function atwoodRig(b, Lc, Rc, Lo, Ro, sc, kinds) {
  b.env('lab', { y: 404 });
  b.set(paper(R(BLEED[0], -200, BLEED[2], 222, '#b9c0c7') + R(BLEED[0], 18, BLEED[2], 6, '#9aa4ae') + R(314, 22, 12, 28, '#5d5566', 2)));
  const pul = b.pulley(320, 60, 60, 'mid');
  const L = b.obj(0, b.prop(kinds ? kinds[0] : identify(Lo), Lc)), Rn = b.obj(1, b.prop(kinds ? kinds[1] : identify(Ro), Rc));
  b.rope([[260, 60], () => [L.x, L.y - Lo.h / 2]], { color: '#3a3640', width: 2.2 });
  b.rope([[380, 60], () => [Rn.x, Rn.y - Ro.h / 2]], { color: '#3a3640', width: 2.2 });
  b.rope(Array.from({ length: 19 }, (_, i) => { const a = Math.PI - i * Math.PI / 18; return [320 + 60 * Math.cos(a), 60 - 60 * Math.sin(a)]; }), { color: '#3a3640', width: 2.2, layer: 'front' });
  return pul;
}

/* ---------- elevator (the velocity-vs-acceleration showcase) ---------- */
function elevatorScene(b, dir, note, floor, sc) {
  b.env('shaft');
  const car = new Container(); car.label = 'car'; b.actors.addChild(car);
  // car spans y 52…437 (abs); its floor top sits at y = 399, where the teacher's rider stands
  const carSvg = paper(R(-130, -180, 260, 386, '#3c3742', 10) + R(-124, -174, 248, 341, '#efe6d6', 6) +
    R(-124, -174, 248, 24, '#d9cdb8', 4) + Array.from({ length: 4 }, (_, i) => R(-118 + i * 62, -168, 52, 9, '#fff4d6', 4)).join('') +
    R(-110, -132, 96, 296, '#e3d8c4', 4) + R(14, -132, 96, 296, '#e3d8c4', 4) + R(-118, -40, 236, 4, '#cdbfa6') +
    R(-124, 167, 248, 18, '#8d7a62', 2) + R(-124, 167, 248, 5, '#a9967b') + R(-28, -166, 56, 22, '#1e1b22', 4) +
    R(90, -40, 18, 46, '#cfc6b4', 4) + Cc(99, -28, 4, '#e2553c') + Cc(99, -8, 4, '#6f7883') +
    R(-130, 185, 260, 21, '#3c3742', 4)) + Ln('M-30 -180 V-200 M30 -180 V-200', P.cable, 4);
  car.addChild(b.piece(carSvg, [-150, -220, 300, 440], 0, 0, 'actors', 'elevcar-big'));
  car.position.set(320, 232);
  car.addChild(b.person({ pose: 'idle', char: 'malePerson', x: 0, y: 399 - 232, height: 236 }));
  b.obj(0, car);
  b.rope([[290, -400], [290, 33]], { color: P.cable, width: 3 }); b.rope([[350, -400], [350, 33]], { color: P.cable, width: 3 });
  b.info += `<text class="floor-led" x="320" y="${232 - 168 + 16}" text-anchor="middle">${floor}</text>`;
  b.motionCue(dir, 520, dir === 'up' ? 300 : 130, note, true);
  b.cine = { type: 'elevator', change: note, dir, floor, car };
}

/* ---------- incline ---------- */
function inclineScene(b, { theta, c = [320, 220], h = 56, obj, xTop = 600, ramp = '#c8b48f', objSpec }, sc, skipCine) {
  const t = rad(theta), s = Math.sin(t), co = Math.cos(t), Gy = 412;
  const bx = c[0] + s * h / 2, by = c[1] + co * h / 2;
  const x0 = bx + ((by - Gy) / s) * co;
  const yTop = by - ((xTop - bx) / co) * s;
  const px = Math.max(x0, 70), py = by - ((px - bx) / co) * s;
  const style = sc.id === 'car-hill' ? 'city' : sc.id === 'air-track' || sc.id === 'air-incline' ? 'lab' : rampStyle(ramp) || 'wood';
  b.env(inclineEnv(style));
  const surface = { wood: ['#c98b52', '#9c6435'], concrete: ['#b8b4ad', '#8f8a83'], snow: ['#fbfdff', '#d7e4ef'], grass: ['#6aad4f', '#4f8f3c'], metal: ['#c3cad1', '#8f979f'], water: ['#7cc6ea', '#3d9bc8'], city: ['#6f737a', '#4b4f56'], lab: ['#c3cad1', '#8f979f'] }[style];
  const natural = style === 'snow' || style === 'grass';
  const wedge = natural
    ? Pth(`M${x0 - 2} ${Gy} L${xTop} ${yTop} L1200 ${yTop} L1200 ${Gy + 400} L${x0 - 2} ${Gy + 400}Z`, surface[0]) + Pth(`M${x0} ${Gy} L${xTop} ${yTop} L${xTop + 10} ${yTop + 10} L${x0 + 12} ${Gy}Z`, light(surface[0], .3))
    : (() => {                                             // built ramp: open timber/steel frame under a thick deck
        const frame = shade(surface[0], .35), legs = Math.max(3, Math.round((xTop - x0) / 70));
        let f = Pth(`M${x0} ${Gy} L${xTop} ${yTop} L${xTop} ${Gy}Z`, shade(surface[0], .5), 'opacity=".22"');
        const ys = x => Gy - (x - x0) * Math.tan(t);
        for (let i = 1; i <= legs; i++) {
          const x = x0 + (xTop - x0) * i / (legs + .15), y = ys(x);
          f += R(x - 5, y + 8, 10, Gy - y - 8, frame, 2);
          if (i > 1) { const xp = x0 + (xTop - x0) * (i - 1) / (legs + .15); f += Ln(`M${xp} ${Gy - 6} L${x} ${y + 18}`, frame, 4, 'opacity=".85"'); }
        }
        const th = 14, nx = s * th, ny = co * th;                // deck thickness, perpendicular to the slope
        f += paper(Pth(`M${x0} ${Gy} L${xTop} ${yTop} L${xTop + nx} ${yTop + ny} L${x0 + nx} ${Gy + ny}Z`, surface[0]) +
          Ln(`M${x0 + 2} ${Gy - 1} L${xTop} ${yTop + 1}`, light(surface[0], .4), 3) +
          Array.from({ length: Math.floor((xTop - x0) / 34) }, (_, i) => { const x = x0 + 20 + i * 34; return Ln(`M${x} ${ys(x)} l${nx} ${ny}`, shade(surface[0], .25), 1.6); }).join(''));
        if (style === 'water') f += Ln(`M${x0 + 30} ${ys(x0 + 30) + 3} L${xTop - 20} ${ys(xTop - 20) + 3}`, '#e3f6ff', 3, 'opacity=".9"');
        return f + paper(block(xTop, yTop, 1000, Gy - yTop + 2, style === 'metal' || style === 'lab' ? '#9aa4ae' : '#b8afa2', 3));
      })();
  b.set(paper(wedge) + R(BLEED[0], Gy, BLEED[2], 400, natural ? shade(surface[1], .05) : '#8c7b5e') + R(BLEED[0], Gy, BLEED[2], 5, natural ? light(surface[1], .2) : '#a8946f'));
  if (sc.id === 'car-hill') b.set(paper(R(30, 120, 70, 300, '#ced4da', 3) + R(110, 150, 60, 270, '#adb5bd', 3)));
  b.angleMark(px, py, theta);
  let spec = objSpec;
  if (!spec) {
    if (sc.id === 'car-hill') spec = { kind: 'carSide', w: 230, h: 92, col: '#3e6db3' };
    else if (sc.id === 'dolly') spec = { kind: 'carBoxes', w: 110, h: 50 };
    else { spec = identifySvg(obj); spec.w = spec.w || guessW(obj); spec.h = h; }
  }
  if (sc.id === 'car-hill') { spec.w = 230 * .7; spec.h = 92 * .7; }
  const node = b.obj(0, b.prop(spec, c, -theta));
  if (sc.id === 'car-hill') node.scale.set(.7);
  if (skipCine) return;
  const cue = b.capture.slope[0];
  if (cue) {
    b.slopeCue(cue);
    const up = Math.abs(((cue.ang % 360) + 360) % 360 - theta) < 1;
    b.cine = { type: 'translate', change: cue.t2, movers: [{ node, dir: up ? [co, -s] : [-co, s], D: 90 }], rot: -theta };
  } else b.cine = { type: 'rest' };
}
function guessW(svg) { const m = svg.match(/width="([\d.]+)"/); return m ? +m[1] : 90; }

/* =====================================================================
   Inline scenes (drawn directly in the teacher's scenario entries)
   ===================================================================== */
const INLINE = {
  book(b, sc) {
    b.env('room', { y: 400 }); b.set(deskSvg(120, 238, 400) + paper(R(156, 254, 120, 70, '#7a4e33', 3) + R(200, 282, 32, 6, '#c9a37a', 3) + R(430, 196, 10, 42, '#e8a33d', 2) + Pth('M430 196 l5 -10 l5 10z', '#f2d3a3')));
    b.obj(0, b.prop({ kind: 'textbook', w: 140, h: 34 }, sc.objects[0].c)); b.cine = { type: 'rest' };
  },
  plant(b, sc) {
    b.env('sunroom', { ceil: 26 }); b.set(paper(Cc(320, 34, 6, 'none', 'stroke="#5d5566" stroke-width="3"')));
    const n = b.obj(0, b.prop({ kind: 'plantPot', w: 96, h: 70 }, [320, 222]));
    b.rope([[320, 40], [320, 150]], { color: '#6b5844', width: 3 });
    b.rope([[320, 150], () => [n.x - 37, n.y - 26]], { color: '#6b5844', width: 2.4 }); b.rope([[320, 150], () => [n.x + 37, n.y - 26]], { color: '#6b5844', width: 2.4 }); b.rope([[320, 150], () => [n.x, n.y - 26]], { color: '#6b5844', width: 2.4 });
    b.cine = { type: 'rest', sway: true };
  },
  puck(b, sc) {
    b.env('rink');
    const node = b.obj(0, b.prop({ kind: 'puck', w: 52, h: 20 }, [320, 222]));
    b.motionCue('right', 400, 160, 'slowing down');
    b.cine = { type: 'translate', change: 'slowing down', movers: [{ node, dir: [1, 0], D: 150 }], sound: 'ice' };
  },
  sled(b, sc) {
    b.env('snowfield', { y: 246 });
    const node = b.obj(0, b.prop({ kind: 'sledKid', w: 140, h: 76 }, [318, 208]));
    b.motionCue('right', 440, 110, 'slowing down');
    b.cine = { type: 'translate', change: 'slowing down', movers: [{ node, dir: [1, 0], D: 140 }], sound: 'snow' };
  },
  bucket(b, sc) {
    b.env('rooftop', { y: 408 });
    const node = b.obj(0, b.prop({ kind: 'bucket', w: 72, h: 66, col: '#8e9aa6' }, [320, 222]));
    b.rope([[320, 69], () => [node.x, node.y - 40]], { color: '#c8a165', width: 3 });
    b.rope([[333, 56], [470, 40]], { color: '#c8a165', width: 3 });
    b.puller({ hand: [470, 40], ground: 64, side: 1, H: 120, char: 'maleAdventurer' });
    b.motionCue('up', 180, 300, 'constant speed');
    b.cine = { type: 'translate', change: 'constant speed', movers: [{ node, dir: [0, -1], D: 60 }] };
  },
  engine(b, sc) {
    b.env('construction', { y: 404 });
    b.set(paper(R(300, 34, 40, 26, '#4b4652', 3)));
    const node = b.obj(0, b.prop({ kind: 'engineBlock', w: 124, h: 82 }, [320, 224]));
    b.rope([[320, 60], () => [node.x, node.y - 74]], { color: P.cable, width: 4 });
    b.rope([() => [node.x - 2, node.y - 58], () => [node.x - 52, node.y - 34]], { color: '#5d6670', width: 3 }); b.rope([() => [node.x + 2, node.y - 58], () => [node.x + 52, node.y - 34]], { color: '#5d6670', width: 3 });
    b.motionCue('up', 480, 300, 'speeding up');
    b.cine = { type: 'translate', change: 'speeding up', movers: [{ node, dir: [0, -1], D: 70 }] };
  },
  balloon(b, sc) {
    b.env('park', { y: 400 });
    b.set(paper(R(314, 394, 12, 20, '#7b5a3a', 2)));
    b.obj(0, b.prop({ kind: 'heliumBalloon', w: 100, h: 120 }, [320, 206]));
    b.rope([[320, 270], [320, 398]], { color: '#6b6470', width: 2 });
    b.cine = { type: 'rest', sway: true };
  },
  bobber(b, sc) {
    b.env('pond', { y: 230 });
    b.rope([[30, 0], [180, 60], [270, 140], [320, 180]], { color: '#4b4652', width: 1.5 });
    b.set(Ln('M-40 18 L60 0', '#3b2a20', 6));
    const node = b.obj(0, b.prop({ kind: 'bobber', w: 44, h: 44 }, [320, 222]));
    water(b, 230);
    b.cine = { type: 'rest', bob: node };
  },
  bowling(b, sc) {
    b.env('bowlingAlley');
    b.set(paper([560, 590, 615].map(x => Pth(`M${x} 250 c-12 0 -12 -30 -5 -40 c-4 -8 -4 -18 5 -20 c9 2 9 12 5 20 c7 10 7 40 -5 40z`, '#fbf8f2') + R(x - 6, 220, 12, 3, '#d63333')).join('')));
    const node = b.obj(0, b.prop({ kind: 'bowlingBall', w: 60, h: 60 }, [320, 220]));
    b.motionCue('right', 440, 330, 'nearly constant speed');
    b.cine = { type: 'translate', change: 'constant speed', movers: [{ node, dir: [1, 0], D: 150, roll: 30 }] };
  },
  car(b, sc) {
    b.env('street', { y: 268 });
    b.set(Ln('M70 268 H232 M70 264 H232', '#2a2c30', 3) + Ln('M210 268 H372 M210 264 H372', '#2a2c30', 3, 'opacity=".6"'));
    const node = b.obj(0, b.prop({ kind: 'carSide', w: 230, h: 92 }, [320, 214]));
    b.motionCue('right', 400, 110, 'slowing down (skidding)');
    b.cine = { type: 'translate', change: 'slowing down', movers: [{ node, dir: [1, 0], D: 140 }], sound: 'hard', skid: true };
  },
  fish(b, sc) {
    b.env('dockLake', { y: 300 });
    b.set(paper(R(270, 0, 100, 14, '#6b4b2e', 2) + R(318, 14, 4, 10, '#4b4652') + R(300, 24, 40, 84, '#eef1f3', 8) + R(324, 32, 10, 70, '#cfd6dd', 3) + R(323, 62, 12, 4, '#e2553c', 2) +
      Array.from({ length: 8 }, (_, i) => Ln(`M306 ${36 + i * 8} H${i % 2 ? 318 : 322}`, '#5d5566', 1.5)).join('')));
    b.set(Ln('M320 108 V168', '#5d5566', 3) + Ln('M320 168 q-9 0 -9 9 q0 9 9 9', '#5d5566', 3));
    b.obj(0, b.prop({ kind: 'fish', w: 64, h: 146 }, [320, 250]));
    b.cine = { type: 'rest', spring: true };
  },
  hotair(b, sc) {
    b.env('sunrise');
    const node = b.obj(0, b.prop({ kind: 'hotAir', w: 220, h: 310 }, [320, 208]));
    b.motionCue('up', 520, 280, 'constant speed');
    b.cine = { type: 'fall', change: 'constant speed', node, up: true };
  },
  'atwood-lab'(b, sc) { atwoodInline(b, sc, [260, 276], [380, 214], 70, 54, ['30 N', '20 N'], 'down', 'up', ['speeding up', 'speeding up']); },
  'paint-cans'(b, sc) { atwoodInline(b, sc, [260, 252], [380, 200], 60, 60, null, 'down', 'up', ['constant speed', 'constant speed'], true); },
  'cart-track'(b, sc) { benchInline(b, sc, 'cart'); },
  'block-bench'(b, sc) { benchInline(b, sc, 'block'); },
  'boxes-push'(b, sc) {
    b.env('garage', { y: 291 });
    const A = b.obj(0, b.prop({ kind: 'box', w: 180, h: 101, col: '#d4a373', txt: 'A' }, [210, 240.5]));
    const B = b.obj(1, b.prop({ kind: 'box', w: 180, h: 77, col: '#e9c46a', txt: 'B' }, [390, 252.5]));
    const p = b.puller({ hand: [120, 240], ground: 291, side: -1, H: 148, char: 'malePerson' });
    b.motionCue('right', 470, 100, 'speeding up');
    labelsFromSvg(b);
    b.cine = { type: 'translate', change: 'speeding up', movers: [A, B, p].map(node => ({ node, dir: [1, 0], D: 90 })) };
  },
  'tire-drag'(b, sc) {
    b.env('turf', { y: 268 });
    const T1 = b.obj(0, b.prop({ kind: 'tire', w: 110, h: 36 }, [140, 250])), T2 = b.obj(1, b.prop({ kind: 'tire', w: 110, h: 36 }, [420, 250]));
    const p = b.puller({ hand: [540, 250], ground: 268, side: 1, H: 148, char: 'maleAdventurer' });
    b.rope([() => [T1.x + 55, T1.y], () => [T2.x - 55, T2.y]], { color: '#f59f00', width: 3, layer: 'actors' });
    b.rope([() => [T2.x + 55, T2.y], () => [p.x + 540, p.y + 250]], { color: '#f59f00', width: 3, layer: 'actors' });
    labelsFromSvg(b);
    const m = b.capture.motions[0];
    if (m) b.motionCue(m.dir, m.x, m.y, m.note);
    b.cine = { type: 'translate', change: m ? m.note : 'constant speed', movers: [T1, T2, p].map(node => ({ node, dir: [1, 0], D: 90 })) };
  },
  'weather-balloon'(b, sc) {
    b.env('station', { y: 404 });
    b.set(paper(R(310, 396, 20, 10, '#4b4652', 3)));
    b.obj(0, b.prop({ kind: 'wballoon', w: 130, h: 140 }, sc.objects[0].c));
    b.rope([[320, 262], [320, 398]], { color: '#5d5566', width: 2 });
    b.cine = { type: 'rest' };
  },
  'stroller-balloon'(b, sc) {
    b.env('park', { y: 404 });
    b.prop({ kind: 'stroller', w: 90, h: 90 }, [356, 359], 0, 'mid');
    b.set(Ln('M318 336 L322 336 L336 356', '#3c3742', 5));
    b.obj(0, b.prop({ kind: 'pballoon', w: 96, h: 116, col: '#f76707' }, sc.objects[0].c));
    b.rope([[320, 252], [320, 336]], { color: '#5d5566', width: 1.8 });
    b.cine = { type: 'rest' };
  },
  books(b, sc) {
    b.env('room', { y: 400 }); b.set(deskSvg(110, 254, 440));
    b.obj(1, b.prop({ kind: 'book', w: 220, h: 32, col: '#2b8a3e' }, [410, 238]));
    b.obj(0, b.prop({ kind: 'book', w: 150, h: 28, col: '#c92a2a' }, [290, 206]));
    labelsFromSvg(b);
    b.cine = { type: 'rest' };
  }
};
function atwoodInline(b, sc, Lc, Rc, lH, rH, names, Ld, Rd, notes, paint) {
  const kinds = paint ? [{ kind: 'paintCan', w: 56, h: 60 }, { kind: 'paintCan', w: 56, h: 60 }] : [{ kind: 'labBlock', w: 56, h: lH, col: '#868e96' }, { kind: 'labBlock', w: 56, h: rH, col: '#adb5bd' }];
  atwoodRig(b, Lc, Rc, { w: 56, h: lH }, { w: 56, h: rH }, sc, kinds);
  labelsFromSvg(b, paint ? ['PAINT'] : []);
  for (const m of b.capture.motions) b.motionCue(m.dir, m.x, m.y, m.note);
  const ms = b.capture.motions;
  b.cine = { type: 'translate', change: ms[0]?.note || notes[0], movers: [{ node: b.objs[0], dir: DIRV[ms[0]?.dir || Ld], D: 60 }, { node: b.objs[1], dir: DIRV[ms[1]?.dir || Rd], D: 60 }], spinDir: (ms[0]?.dir || Ld) === 'down' ? -1 : 1 };
}
function benchInline(b, sc, kind) {
  const ty = kind === 'cart' ? 256 : 250;
  if (kind === 'cart') { b.env('lab', { y: 404 }); b.set(paper(R(30, 256, 460, 16, '#8a5a34', 3) + R(50, 272, 14, 168, '#6e4630') + R(452, 272, 14, 168, '#6e4630') + R(40, 250, 440, 6, '#b9c0c7', 2))); }
  else tableSurface(b, 'lab', 250);
  const c0 = sc.objects[0].c, c1 = sc.objects[1].c;
  const top = b.obj(0, b.prop(kind === 'cart' ? { kind: 'cart', w: 88, h: 40, col: '#1c7ed6' } : { kind: 'woodBlock', w: 88, h: 54 }, kind === 'cart' ? [230, 226] : [220, 223]));
  const hang = b.obj(1, b.prop({ kind: 'labBlock', w: 40, h: 52, col: '#868e96' }, [494, 316]));
  const py = kind === 'cart' ? 236 : 234;
  b.set(paper(Ln(`M470 ${ty} L482 ${py}`, '#5d6670', 5)));
  b.pulley(482, py, 12);
  const ry = kind === 'cart' ? 224 : 222;
  b.rope([() => [top.x + 44, ry + (top.y - (kind === 'cart' ? 226 : 223))], [482, py - 12]], { color: '#3a3640', width: 2.2 });
  b.rope([[494, py], () => [hang.x, hang.y - 26]], { color: '#3a3640', width: 2.2 });
  for (const m of b.capture.motions) b.motionCue(m.dir, m.x, m.y, m.note);
  labelsFromSvg(b);
  const note = b.capture.motions[0]?.note || 'speeding up';
  b.cine = { type: 'translate', change: note, movers: [{ node: top, dir: [1, 0], D: 70 }, { node: hang, dir: [0, 1], D: 70 }] };
}
/** Pull name labels (text the teacher drew with label()) straight out of the original SVG. */
function labelsFromSvg(b, skip = []) {
  const re = /<text class="halo" x="([-\d.]+)" y="([-\d.]+)" text-anchor="(\w+)" font-size="14" font-weight="700" fill="#212529">([^<]*)<\/text>/g;
  let m; while ((m = re.exec(b.capture.svg))) if (!skip.includes(m[4])) b.label(+m[1], +m[2], m[4], m[3]);
}

/* =====================================================================
   Entry point
   ===================================================================== */
export async function compose(sc, res, view) {
  const b = new Build(res, view);
  b.capture = captureScene(sc);
  const main = b.capture.main;
  try {
    if (INLINE[sc.id]) INLINE[sc.id](b, sc);
    else if (main && COMPOSE[main.fn]) COMPOSE[main.fn](b, main.args, sc);
    else throw new Error('no composer for ' + sc.id);
  } catch (e) {
    console.warn('composer fallback for', sc.id, e);
    b.root.destroy({ children: true });
    const nb = new Build(res, view); nb.capture = b.capture;
    nb.envSvg = b.capture.svg.replace(/class="halo"/g, ''); nb.cine = { type: 'rest' };
    nb.fallback = true;
    return nb.finish();
  }
  b.sc = sc;
  return b.finish();
}
