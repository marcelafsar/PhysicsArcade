/* The gameplay stage: a PixiJS canvas under the engine's precise SVG force overlay.
   Both share the teacher's 640 × 440 world: the SVG uses viewBox (−30 −12 700 464) + "meet", and the
   Pixi world container applies the same uniform scale and centring, so every centre
   of mass, rope and surface lines up with the arrows at any screen size. */
import { Application, Container } from 'pixi.js';
import { compose } from './compose.js';
import { makeCinematic } from './anim.js';
import { release, waitFonts } from './art/kit.js';
import { installCapture } from './capture.js';
import { prefs, reducedMotion } from '../prefs.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);

export class GameScene {
  constructor(host, stage) {
    this.host = host; this.stage = stage; this.ok = false;
    this.token = 0; this.current = null; this.cine = null; this.slow = false; this.cinePending = false;
    this.onCinematicEnd = null;
  }
  async init() {
    installCapture();
    // annotation layer (motion cues, angle marks, labels) lives in the diagram SVG, under the engine's layers
    const svg = $('scene');
    this.info = document.createElementNS(SVGNS, 'g'); this.info.id = 'infoLayer';
    svg.insertBefore(this.info, $('guides'));
    try {
      this.app = new Application();
      await this.app.init({ backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, preference: 'webgl', powerPreference: 'default', width: 640, height: 440 });
      this.host.appendChild(this.app.canvas);
      this.world = new Container(); this.app.stage.addChild(this.world);
      this.ok = true;
    } catch (e) {
      console.warn('PixiJS unavailable — using the original drawings', e);
      this.ok = false; return;
    }
    await waitFonts();
    new ResizeObserver(() => this.resize()).observe(this.host);
    this.resize();
    this.app.ticker.add(t => this.tick(t.deltaMS / 1000));
  }
  /* ---------- geometry ---------- */
  metrics() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    // same fit box as the SVG viewBox (the 640 × 440 world plus a small margin for edge labels)
    const s = Math.min(w / 700, h / 464);
    const vw = w / s, vh = h / s;
    return { w, h, s, view: [320 - vw / 2 - 8, 220 - vh / 2 - 8, vw + 16, vh + 16], res: Math.min(3, s * Math.min(2, window.devicePixelRatio || 1)) };
  }
  resize() {
    if (!this.ok) return;
    const m = this.metrics();
    this.app.renderer.resize(m.w, m.h);
    this.world.scale.set(m.s);
    this.world.position.set(m.w / 2 - 320 * m.s, m.h / 2 - 220 * m.s);
    if (this.current && (Math.abs(m.res - this.current.res) / this.current.res > .18 || !covers(this.current.view, m.view))) {
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = setTimeout(() => { if (!document.body.classList.contains('cinematic')) this.show(this.current.sc, true); }, 220);
    }
  }
  /* ---------- scenes ---------- */
  async show(sc, quiet) {
    if (!sc) return;
    this.stopCinematic(true);
    const useArt = this.ok && !prefs.classicArt;
    document.body.classList.toggle('art-pixi', useArt);
    if (!useArt) { this.info.innerHTML = ''; if (this.current) { this.current.root.visible = false; } return; }
    if (this.host.clientWidth < 2) return;                       // hidden: built when shown
    const my = ++this.token, m = this.metrics();
    let built;
    try { built = await compose(sc, m.res, m.view); }
    catch (e) { console.error('scene build failed', sc.id, e); return; }
    if (my !== this.token) { built.root.destroy({ children: true }); release(built.textures); return; }
    if (this.fade) { const f = this.fade; this.fade = null; f.to.alpha = 1; this.drop(f.from); }   // finish a crossfade still in progress
    const old = this.current;
    built.sc = sc; built.res = m.res; built.view = m.view;
    this.current = built;
    this.world.addChild(built.root);
    this.info.innerHTML = built.info;
    this.cine = makeCinematic(built, sc, this);
    if (old) {
      if (quiet || reducedMotion()) this.drop(old);
      else { built.root.alpha = 0; this.fade = { from: old, to: built.root, t: 0 }; }
    }
    $('stage').dataset.scene = sc.id;
  }
  drop(old) {
    old.root.destroy({ children: true });
    release(old.textures);
  }
  /* ---------- per-frame ---------- */
  tick(dt) {
    if (this.fade) {
      this.fade.t += dt / .28; this.fade.to.alpha = Math.min(1, this.fade.t);
      if (this.fade.t >= 1) { this.drop(this.fade.from); this.fade = null; }
    }
    const cur = this.current; if (!cur) return;
    if (this.playing && this.cine) {
      const going = this.cine.update(dt * (this.slow ? .35 : 1));
      this.cine.ropes();
      if (!going) this.stopCinematic();
      return;
    }
    if (reducedMotion()) return;
    // ambient life: drifting clouds and moving water — never the objects being diagrammed
    const [vx, , vw] = cur.view;
    for (const c of cur.clouds) { c.x += dt * 6; if (c.x - c.width / 2 > vx + vw) c.x = vx - c.width / 2; }
    for (const a of cur.ambient) if (a.kind === 'ripples') { a.t = (a.t || 0) + dt; a.node.x = Math.sin(a.t * .8) * 6; a.node.alpha = .75 + Math.sin(a.t * 1.3) * .2; }
  }
  /* ---------- cinematics ---------- */
  hasCinematic() { return !!(this.ok && this.cine && !prefs.classicArt); }
  showLabels() { return prefs.motionLabels; }
  async playCinematic() {
    if (!this.hasCinematic()) { this.onCinematicEnd?.(); return; }
    this.cinePending = true;
    document.body.classList.add('cinematic');
    $('cine').hidden = false; $('replayFab').hidden = true;
    this.info.classList.add('playing');
    const legend = await this.cine.start();
    $('cineLegend').innerHTML = prefs.motionLabels ? legend : '';
    this.playing = true; this.cinePending = false;
  }
  stopCinematic(silent) {
    const was = this.playing || this.cinePending;
    this.playing = false; this.cinePending = false;
    this.cine?.stop();
    document.body.classList.remove('cinematic');
    $('cine').hidden = true; this.info.classList.remove('playing');
    if (was && !silent) this.onCinematicEnd?.();
  }
  setSlow(on) { this.slow = on; }
  /** Dark mode dims the illustration with a CSS filter on the canvas (see main.css), so nothing to rebuild. */
  setTheme() {}
  /** Elevator floor display during the replay. */
  setFloor(label, t, dir, prof, u) {
    const led = this.info.querySelector('.floor-led'); if (!led) return;
    if (t < 0) { led.textContent = label; return; }
    const arrow = label.charAt(0), raw = label.slice(2), start = raw === 'L' ? 0 : +raw;
    const up = dir === 'up' ? 1 : -1, passed = Math.min(3, Math.floor(t / 1.35));
    let n = prof === 'slow' ? start - up * (3 - passed) : start + up * passed;
    if (prof === 'slow' && u >= 1) n = start;
    led.textContent = `${arrow} ${n <= 0 ? 'L' : n}`;
  }
}
const covers = (a, b) => a[0] <= b[0] + 1 && a[1] <= b[1] + 1 && a[0] + a[2] >= b[0] + b[2] - 1 && a[1] + a[3] >= b[1] + b[3] - 1;
