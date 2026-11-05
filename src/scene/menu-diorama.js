/* Main-menu diorama: a workshop bench holding three working shadow-box machines —
   an elevator (Level 1 · Basics), a ramp (Level 2 · Angles) and an Atwood pulley
   (Level 3 · Systems). Each one quietly runs its own little experiment. The level
   tags (real HTML buttons) hang beneath their machine. */
import { Application, Container, Sprite, Graphics, Text } from 'pixi.js';
import { svgTexture, paper, R, C, E, Pth, Ln, Tx, block, light, shade, mix, P, waitFonts } from './art/kit.js';
import { poseTexture } from './art/people.js';
import { reducedMotion } from '../prefs.js';

const LV = [
  { key: 1, col: '#e0533a', name: 'BASICS' },
  { key: 2, col: '#1d7a71', name: 'ANGLES' },
  { key: 3, col: '#6c4a70', name: 'SYSTEMS' }
];
const BOX_W = 300, BOX_H = 340;           // station design units

export class MenuDiorama {
  constructor(host, { onLayout, onPick }) { this.host = host; this.onLayout = onLayout; this.onPick = onPick; this.t = 0; this.hover = 0; this.paused = false; }
  async init(dark) {
    this.dark = dark;
    this.app = new Application();
    await this.app.init({ backgroundAlpha: 0, antialias: true, resolution: Math.min(2, devicePixelRatio || 1), autoDensity: true, resizeTo: this.host, preference: 'webgl' });
    this.host.appendChild(this.app.canvas);
    await waitFonts();
    this.root = new Container(); this.app.stage.addChild(this.root);
    new ResizeObserver(() => { clearTimeout(this.rt); this.rt = setTimeout(() => this.relayout(), 80); }).observe(this.host);
    await this.relayout();
    this.app.ticker.add(tk => this.tick(tk.deltaMS / 1000));
  }
  setTheme(dark) { if (dark !== this.dark) { this.dark = dark; this.relayout(); } }
  pause() { this.paused = true; this.app?.ticker.stop(); }
  resume() { this.paused = false; this.app?.ticker.start(); }
  highlight(lv) { this.hover = lv; }

  layout() {
    const W = this.host.clientWidth, H = window.innerHeight;
    const top0 = this.host.getBoundingClientRect().top;
    const bar = (document.querySelector('.menu-bar')?.getBoundingClientRect().bottom ?? 140) - top0;
    const foot = document.querySelector('.menu-foot')?.getBoundingClientRect().height || 90;
    const pad = Math.max(16, Math.min(40, W * .03)), wide = W >= 900;
    if (wide) {
      const gap = Math.min(60, W * .035);
      const avail = H - bar - foot - 200;                                      // leave room for the tags under the bench
      const sw = Math.max(170, Math.min(300, (W - 2 * pad - 2 * gap) / 3, avail * BOX_W / BOX_H));
      const sh = sw * BOX_H / BOX_W, total = 3 * sw + 2 * gap;
      const x0 = (W - total) / 2, y0 = bar + 24;
      const boxes = LV.map((_, i) => ({ x: x0 + i * (sw + gap), y: y0, w: sw, h: sh }));
      const benchY = y0 + sh;
      const tags = boxes.map((b, i) => ({ x: b.x + sw * .06, y: benchY + 46, w: sw * .88, r: [-2.2, 1.4, -1.2][i] }));
      return { W, H, wide, boxes, benchY, tags, minH: benchY + 46 + 190 + foot };
    }
    const gap = 12, sw = (W - 2 * pad - 2 * gap) / 3, sh = sw * BOX_H / BOX_W, y0 = bar + 18;
    const boxes = LV.map((_, i) => ({ x: pad + i * (sw + gap), y: y0, w: sw, h: sh }));
    const benchY = y0 + sh;
    const tags = LV.map((_, i) => ({ x: pad, y: benchY + 40 + i * 148, w: W - 2 * pad, r: 0 }));
    return { W, H, wide, boxes, benchY, tags, minH: benchY + 40 + 3 * 148 + foot + 10 };
  }

  async relayout() {
    if (!this.app) return;
    const L = this.layout();
    const menu = document.getElementById('menu');
    menu.style.minHeight = `${Math.ceil(L.minH)}px`;
    if (this.host.clientHeight < L.minH - 2) { this.app.renderer.resize(L.W, Math.ceil(L.minH)); }
    const my = (this.gen = (this.gen || 0) + 1);
    const res = Math.min(2.5, (devicePixelRatio || 1));
    const H = Math.max(L.H, L.minH);
    const bgTex = await svgTexture(this.backdrop(L, H), [0, 0, L.W, H], res);
    const stations = await Promise.all(LV.map((lv, i) => this.station(lv, L.boxes[i], res)));
    if (my !== this.gen) return;
    this.root.removeChildren().forEach(c => c.destroy({ children: true }));
    const bg = new Sprite(bgTex); bg.scale.set(1 / res); this.root.addChild(bg);
    this.motes = this.makeMotes(L);
    this.root.addChild(this.motes);
    stations.forEach(s => this.root.addChild(s));
    this.stations = stations; this.L = L;
    this.onLayout(L.tags.map(t => ({ ...t, y: t.y })));
  }

  backdrop(L, H) {
    const { W, benchY } = L, d = this.dark;
    const wall = d ? '#2a2232' : '#efdcbc', wall2 = d ? '#241d2b' : '#e6cfa9';
    const peg = Array.from({ length: Math.ceil(W / 26) * 8 }, (_, i) => C(13 + (i % Math.ceil(W / 26)) * 26, 40 + Math.floor(i / Math.ceil(W / 26)) * 26, 2.2, d ? '#3b3145' : '#d7bf98')).join('');
    const winW = Math.min(220, W * .16), winX = W * .5 - winW / 2 + W * .04, winY = 22;
    const sky = d ? ['#1b2340', '#3a3a63'] : ['#9fd0ee', '#e9f4f6'];
    const win = false ? paper(R(winX - 10, winY - 10, winW + 20, 130, d ? '#4a3d55' : '#fff6e6', 8) + `<defs><linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>` +
      R(winX, winY, winW, 110, 'url(#mw)', 4) + (d ? C(winX + winW * .7, winY + 34, 14, '#f4f0d8') + C(winX + winW * .2, winY + 20, 1.5, '#fff') + C(winX + winW * .45, winY + 60, 1.2, '#fff') + C(winX + winW * .85, winY + 90, 1.4, '#fff') : E(winX + winW * .35, winY + 40, 30, 10, '#fff', 'opacity=".9"') + E(winX + winW * .45, winY + 34, 18, 10, '#fff', 'opacity=".9"')) +
      R(winX + winW / 2 - 3, winY, 6, 110, d ? '#4a3d55' : '#fff6e6') + R(winX, winY + 52, winW, 6, d ? '#4a3d55' : '#fff6e6')) +
      Pth(`M${winX} ${winY + 110} L${winX + winW} ${winY + 110} L${winX + winW + 160} ${benchY + 20} L${winX - 40} ${benchY + 20}Z`, d ? '#7f7aa8' : '#fff4d4', `opacity="${d ? .08 : .25}"`) : '';
    const lamp = d ? `<defs><radialGradient id="lg"><stop offset="0" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` + E(W / 2, benchY - 40, W * .55, benchY * .7, 'url(#lg)') : '';
    const bench = paper(R(-20, benchY, W + 40, 34, d ? '#6b4733' : '#b47a48', 4) + R(-20, benchY, W + 40, 7, d ? '#8a5e44' : '#d39a63', 3) + R(-20, benchY + 34, W + 40, H, d ? '#3d2b26' : '#8a5a36'), 2) +
      Array.from({ length: Math.ceil(W / 160) + 1 }, (_, i) => R(i * 160 - 20, benchY + 34, 3, H, d ? '#33241f' : '#7a4e2e')).join('');
    const tools = L.wide ? paper(Ln(`M${W - 150} ${benchY - 150} v90 M${W - 120} ${benchY - 160} l40 40 M${W - 60} ${benchY - 154} v70`, d ? '#7a6d86' : '#7b6a7e', 7) + R(W - 160, benchY - 70, 24, 14, d ? '#c94a31' : '#e0533a', 4) + C(W - 80, benchY - 116, 12, 'none', `stroke="${d ? '#7a6d86' : '#7b6a7e'}" stroke-width="5"`)) : '';
    return R(0, 0, W, H, wall) + R(0, 0, W, 8, wall2) + (L.wide ? peg.replace(/cy="(\d+)/g, (m, y) => +y > benchY - 40 ? 'cy="-99' : m) : '') + tools + win + lamp + bench +
      `<pattern id="mg" width="120" height="120" patternUnits="userSpaceOnUse">${Array.from({ length: 60 }, (_, i) => C((i * 53) % 120, (i * 37 + (i * i) % 29) % 120, .6 + (i % 3) * .3, i % 2 ? '#000' : '#fff', 'opacity=".05"')).join('')}</pattern>` + R(0, 0, W, H, 'url(#mg)');
  }

  /* ---------- stations ---------- */
  async station(lv, box, res) {
    const s = box.w / BOX_W, k = res * s;
    const root = new Container(); root.position.set(box.x, box.y); root.scale.set(s);
    root.eventMode = 'static'; root.cursor = 'pointer';
    root.hitArea = { contains: (x, y) => x >= 0 && x <= BOX_W && y >= 0 && y <= BOX_H };
    root.on('pointertap', () => this.onPick?.(lv.key));
    root.on('pointerover', () => { this.hover = lv.key; }); root.on('pointerout', () => { if (this.hover === lv.key) this.hover = 0; });
    const frame = paper(R(0, 0, BOX_W, BOX_H, this.dark ? '#3b3046' : '#fffaf1', 16) + R(10, 46, BOX_W - 20, BOX_H - 58, this.dark ? '#1f1a26' : '#dfeaf0', 10) +
      R(0, 0, BOX_W, 40, lv.col, 16) + R(0, 24, BOX_W, 16, lv.col) + Tx(BOX_W / 2, 28, `${lv.key} · ${lv.name}`, 17, '#fff8ec', 'letter-spacing="3"'), 2);
    const inner = await this[`machine${lv.key}`](res * s);
    const tex = await svgTexture(frame, [-14, -14, BOX_W + 28, BOX_H + 32], k);
    const bg = new Sprite(tex); bg.position.set(-14, -14); bg.scale.set(1 / k);
    const mask = new Graphics().roundRect(10, 46, BOX_W - 20, BOX_H - 58, 10).fill(0xffffff);
    inner.mask = mask;
    root.addChild(bg, inner, mask);
    root.__lift = 0; root.__base = { x: box.x, y: box.y, s };
    return root;
  }
  /* Level 1: elevator car riding a shaft between floors */
  async machine1(k) {
    const c = new Container();
    const shaft = await this.tex(R(10, 46, 280, 282, this.dark ? '#2e3440' : '#c9d3dc') + Array.from({ length: 4 }, (_, i) => R(10, 70 + i * 80, 280, 8, this.dark ? '#454b55' : '#a9b4bf') + Tx(36, 100 + i * 80, String(4 - i), 15, this.dark ? '#6f7883' : '#8592a0')).join('') +
      R(108, 46, 84, 282, this.dark ? '#22262e' : '#3b4049') + R(112, 46, 4, 282, '#8f979f') + R(184, 46, 4, 282, '#8f979f'), [0, 0, 300, 340], k);
    c.addChild(shaft);
    this.cable = new Graphics(); c.addChild(this.cable);
    const car = new Container();
    car.addChild(await this.tex(paper(R(-34, -46, 68, 92, '#3c3742', 6) + R(-30, -42, 60, 80, '#efe6d6', 4) + R(-30, 32, 60, 8, '#8d7a62') + R(-12, -40, 24, 9, '#1e1b22', 2)), [-44, -56, 88, 112], k, -44, -56));
    const rider = new Sprite(await poseTexture('malePerson', 'idle', k * .62)); rider.anchor.set(.5, 1); rider.scale.set(.62 * 96 / rider.texture.width * (1)); rider.position.set(0, 33); car.addChild(rider);
    this.led = new Text({ text: '▲ 1', style: { fontFamily: 'Consolas, monospace', fontSize: 8, fill: '#ffb84d', fontWeight: '700' }, resolution: k }); this.led.anchor.set(.5); this.led.position.set(0, -35.5); car.addChild(this.led);
    car.position.set(150, 286); c.addChild(car); this.car = car;
    return c;
  }
  /* Level 2: crate sliding down a ramp, angle marked */
  async machine2(k) {
    const c = new Container(), th = 28, t = th * Math.PI / 180;
    const x0 = 24, y0 = 300, x1 = 282, y1 = y0 - (x1 - x0) * Math.tan(t);
    this.ramp = { x0, y0, x1, y1, t };
    c.addChild(await this.tex(R(10, 46, 280, 282, this.dark ? '#22304a' : '#bfe0f3') + C(230, 90, 22, this.dark ? '#f4f0d8' : '#fff1c4', 'opacity=".9"') +
      Pth(`M10 260 Q80 220 150 250 T290 232 V330 H10Z`, this.dark ? '#2c4a3a' : '#9cc78c') +
      paper(Pth(`M${x0} ${y0} L${x1} ${y1} L${x1} ${y0}Z`, '#c98b52') + Ln(`M${x0} ${y0} L${x1} ${y1}`, '#e2ab72', 4)) + R(10, 300, 280, 30, this.dark ? '#3d2b26' : '#8c7b5e') +
      Ln(`M${x0 + 18} ${y0} h70`, '#3d2f1a', 1.5, 'stroke-dasharray="4 3"') + Pth(`M${x0 + 72} ${y0} A54 54 0 0 0 ${x0 + 18 + 54 * Math.cos(t)} ${y0 - 54 * Math.sin(t)}`, 'none', 'stroke="#3d2f1a" stroke-width="1.6"') +
      Tx(x0 + 98, y0 - 12, '28°', 14, '#3d2f1a'), [0, 0, 300, 340], k));
    const crate = new Container();
    crate.addChild(await this.tex(paper(block(-22, -18, 44, 36, '#c98b52', 3) + Ln('M-16 12 L16 -12', '#9c6435', 5) + R(-22, -18, 6, 36, '#9c6435', 2) + R(16, -18, 6, 36, '#9c6435', 2)), [-30, -26, 60, 56], k, -30, -26));
    crate.rotation = -t; c.addChild(crate); this.crate = crate;
    return c;
  }
  /* Level 3: Atwood machine */
  async machine3(k) {
    const c = new Container();
    c.addChild(await this.tex(R(10, 46, 280, 282, this.dark ? '#2a2633' : '#e4e8ec') + R(10, 46, 280, 16, this.dark ? '#3b3046' : '#b9c0c7') + R(144, 60, 12, 26, '#5d5566', 2) + R(10, 300, 280, 28, this.dark ? '#3b3046' : '#c9cdd1'), [0, 0, 300, 340], k));
    this.strings = new Graphics(); c.addChild(this.strings);
    const wheel = new Container(); wheel.addChild(await this.tex(paper(C(0, 0, 40, '#d5dbe0') + C(0, 0, 33, '#b8c0c8') + Ln('M-28 0 H28 M0 -28 V28', '#8f979f', 5) + C(0, 0, 7, '#5d5566')), [-48, -48, 96, 100], k, -48, -48));
    wheel.position.set(150, 110); c.addChild(wheel); this.wheel = wheel;
    const mk = async (col, h) => { const n = new Container(); n.addChild(await this.tex(paper(block(-18, -h / 2, 36, h, col, 4) + R(-13, -h / 2 + 4, 6, h - 10, light(col, .35), 2)), [-26, -h / 2 - 8, 52, h + 18], k, -26, -h / 2 - 8)); c.addChild(n); return n; };
    this.mA = await mk('#868e96', 54); this.mB = await mk('#c08552', 40);
    return c;
  }
  async tex(svg, box, k, x = 0, y = 0) { const t = await svgTexture(svg, box, k); const s = new Sprite(t); s.position.set(x || box[0], y || box[1]); s.scale.set(1 / k); return s; }

  makeMotes(L) {
    const g = new Container(); this.moteList = [];
    if (!L.wide) return g;
    for (let i = 0; i < 18; i++) { const m = new Graphics().circle(0, 0, 1 + (i % 3) * .6).fill({ color: this.dark ? 0xffe6a8 : 0xfffaf0, alpha: .55 }); m.position.set(L.W * (.6 + (i * .37) % .4), 60 + (i * 47) % (L.benchY - 60)); g.addChild(m); this.moteList.push({ m, v: 4 + (i % 5), p: i }); }
    return g;
  }

  tick(dt) {
    if (!this.stations || this.paused) return;
    const calm = reducedMotion();
    this.t += calm ? 0 : dt;
    const t = this.t;
    // hover lift
    this.stations.forEach((st, i) => {
      const want = this.hover === i + 1 ? 1 : 0;
      st.__lift += (want - st.__lift) * Math.min(1, dt * 10);
      const b = st.__base, sc = b.s * (1 + .025 * st.__lift);
      st.scale.set(sc); st.position.set(b.x - BOX_W * (sc - b.s) / 2, b.y - 8 * st.__lift - BOX_H * (sc - b.s) / 2);
    });
    // L1 elevator: rides between floors with easing, pausing at each
    if (this.car) {
      const cycle = 7, u = (t % cycle) / cycle, stops = [286, 126, 286];
      const seg = u < .45 ? [0, u / .45] : u < .55 ? [1, 0] : [1, (u - .55) / .45];
      const e = seg[1] < 0 ? 0 : seg[1] > 1 ? 1 : seg[1] * seg[1] * (3 - 2 * seg[1]);
      const y = seg[0] === 0 ? stops[0] + (stops[1] - stops[0]) * e : (u < .55 ? stops[1] : stops[1] + (stops[2] - stops[1]) * e);
      this.car.y = calm ? 286 : y;
      const floor = Math.max(1, Math.min(4, Math.round(1 + (286 - this.car.y) / 80 * 1)));
      const up = u < .5; this.led.text = `${up ? '▲' : '▼'} ${floor}`;
      this.cable.clear().moveTo(140, 46).lineTo(140, this.car.y - 46).moveTo(160, 46).lineTo(160, this.car.y - 46).stroke({ width: 2, color: 0x2b2730 });
    }
    // L2 crate slides down the ramp (speeding up), then pops back to the top
    if (this.crate) {
      const { x0, y0, x1, t: th } = this.ramp, cycle = 4.2, u = calm ? .25 : (t % cycle) / cycle;
      const run = Math.min(1, u / .7), d = (1 - .18 - .7 * run * run);       // distance from the bottom, fraction of ramp
      const L = (x1 - x0) / Math.cos(th) * d, hx = x0 + L * Math.cos(th), hy = y0 - L * Math.sin(th);
      this.crate.position.set(hx + 18 * Math.sin(th), hy - 18 * Math.cos(th));
      this.crate.alpha = u > .9 ? Math.max(0, 1 - (u - .9) * 10) : u < .05 ? u * 20 : 1;
    }
    // L3 Atwood: heavier mass descends, lighter rises, then they reset
    if (this.wheel) {
      const cycle = 5, u = calm ? 0 : (t % cycle) / cycle, run = Math.min(1, u / .8), s = run * run * 90;
      const a = this.mA, b = this.mB;
      a.position.set(110, 170 + s); b.position.set(190, 250 - s);
      const al = u > .9 ? 1 - (u - .9) * 10 : 1; a.alpha = b.alpha = al;
      this.wheel.rotation = -s / 40;
      this.strings.clear().moveTo(110, 110).lineTo(110, a.y - 27).moveTo(190, 110).lineTo(190, b.y - 20).stroke({ width: 2, color: 0x3a3640 });
    }
    if (!calm) for (const o of this.moteList || []) { o.m.y -= dt * o.v; o.m.x += Math.sin((t + o.p) * .7) * dt * 3; if (o.m.y < 40) o.m.y = this.L.benchY - 10; }
  }
}
