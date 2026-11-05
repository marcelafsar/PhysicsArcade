/* Sound: Kenney CC0 interface/impact samples plus a few sounds synthesized with the
   Web Audio API (success chime, machinery hum, sliding hiss, optional music).
   Nothing autoplays: the context starts on the first user gesture, music is off by
   default, and effects/music have separate switches and volumes. */
import { prefs, onPref } from './prefs.js';

const urls = import.meta.glob('../assets/vendor/kenney/{interface-sounds,impact-sounds,ui-audio}/*.ogg', { eager: true, query: '?url', import: 'default' });
const byName = Object.fromEntries(Object.entries(urls).map(([p, u]) => [p.split('/').pop().replace('.ogg', ''), u]));

// cue -> [sample, gain, playbackRate]
const CUES = {
  hover: ['rollover2', .25, 1.1],
  tap: ['click_002', .5, 1],
  toggle: ['toggle_001', .55, 1],
  open: ['maximize_006', .45, 1],
  close: ['minimize_006', .45, 1],
  select: ['select_003', .55, 1],
  label: ['drop_002', .5, 1.15],
  draw: ['pluck_001', .35, 1.2],
  tick: ['tick_002', .22, 1.4],
  step: ['confirmation_001', .55, 1],
  wrong: ['error_004', .38, .95],
  next: ['switch_002', .5, 1],
  whoosh: ['scroll_002', .4, .8],
  thud: ['impactSoft_medium_001', .6, 1],
  wood: ['impactWood_light_002', .6, 1],
  metal: ['impactMetal_light_001', .45, 1],
  bell: ['glass_002', .5, 1.15],
  snow: ['footstep_snow_000', .5, 1],
  plank: ['impactPlank_medium_000', .5, 1]
};

let ctx = null, master = null, sfxBus = null, musicBus = null;
const buffers = new Map();
let loading = null;

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.connect(master);
  applyVolumes();
  loading = Promise.all(Object.entries(byName).map(async ([name, url]) => {
    try { const r = await fetch(url); buffers.set(name, await ctx.decodeAudioData(await r.arrayBuffer())); }
    catch { /* browser can't decode OGG: the synth fallback below covers every cue */ }
  }));
  return ctx;
}
function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(prefs.sfx ? (prefs.sfxVol / 100) ** 1.5 : 0, t, .02);
  musicBus.gain.setTargetAtTime(prefs.music ? (prefs.musicVol / 100) ** 1.5 * .55 : 0, t, .2);
}
onPref(k => { if (/sfx|music/i.test(k)) applyVolumes(); if (k === 'music') prefs.music ? Music.start() : Music.stop(); });

// Unlock on the first gesture (browsers block audio before one).
const unlock = () => { ensure(); if (prefs.music) Music.start(); };
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { once: true, capture: true }));

function sample(name, gain = 1, rate = 1, when = 0, dest = sfxBus) {
  const b = buffers.get(name); if (!b) return false;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(g); g.connect(dest); src.start(ctx.currentTime + when);
  return true;
}
function tone(freq, start, dur, { type = 'sine', gain = .2, attack = .008, dest = sfxBus, detune = 0 } = {}) {
  const t = ctx.currentTime + start, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
}
/* Bell-like note: fundamental + inharmonic partials, like a small glockenspiel bar. */
function bell(freq, start, gain = .16) {
  tone(freq, start, 1.1, { gain });
  tone(freq * 2.76, start, .45, { gain: gain * .35 });
  tone(freq * 5.4, start, .2, { gain: gain * .12 });
}
function noise(dur) {
  const n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = n; return s;
}

export const Sound = {
  play(cue) {
    if (!prefs.sfx || !ensure()) return;
    const c = CUES[cue];
    if (c && sample(...c)) return;
    // synthesized fallbacks so every cue still sounds without OGG support
    const fb = { tap: [700, .05], toggle: [600, .06], select: [820, .08], open: [520, .1], close: [420, .1], label: [900, .06], draw: [640, .05], tick: [1200, .03], next: [660, .08], hover: [980, .03] }[cue];
    if (fb) tone(fb[0], 0, fb[1], { gain: .12, type: 'triangle' });
    else if (cue === 'wrong') { tone(330, 0, .14, { type: 'triangle', gain: .12 }); tone(262, .11, .2, { type: 'triangle', gain: .12 }); }
    else if (cue === 'step') { bell(784, 0, .1); bell(1047, .08, .1); }
    else tone(300, 0, .12, { gain: .1, type: 'triangle' });
  },
  /** The success sound: a bright rising chime (G5–C6–E6–G6) plus Kenney's confirmation. */
  success() {
    if (!prefs.sfx || !ensure()) return;
    [784, 1047, 1319, 1568].forEach((f, i) => bell(f, i * .085, .13 - i * .012));
    sample('confirmation_002', .35, 1, .02);
  },
  levelComplete() {
    if (!prefs.sfx || !ensure()) return;
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) => bell(f, i * .11, .12));
    tone(262, 0, 1.4, { type: 'triangle', gain: .08 }); tone(392, .45, 1.2, { type: 'triangle', gain: .07 });
  },
  /** Continuous machinery hum (elevator motor, pulley). Returns a controller {rate(x), stop()}. */
  hum(kind = 'motor') {
    if (!prefs.sfx || !ensure()) return { rate() {}, stop() {} };
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    const base = kind === 'motor' ? 58 : 90;
    o.frequency.value = base; o2.frequency.value = base * 1.5;
    f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 4;
    g.gain.value = 0.0001;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus); o.start(); o2.start();
    g.gain.linearRampToValueAtTime(.07, ctx.currentTime + .25);
    return {
      rate(x) { const t = ctx.currentTime; o.frequency.setTargetAtTime(base * (0.8 + .5 * x), t, .05); o2.frequency.setTargetAtTime(base * 1.5 * (0.8 + .5 * x), t, .05); f.frequency.setTargetAtTime(200 + 260 * x, t, .05); g.gain.setTargetAtTime(.035 + .05 * x, t, .05); },
      stop() { const t = ctx.currentTime; g.gain.setTargetAtTime(0.0001, t, .08); o.stop(t + .4); o2.stop(t + .4); }
    };
  },
  /** Friction hiss for sliding objects; volume follows speed. */
  slide(surface = 'hard') {
    if (!prefs.sfx || !ensure()) return { rate() {}, stop() {} };
    const s = noise(4), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.loop = true; f.type = 'bandpass'; f.frequency.value = surface === 'snow' ? 2400 : surface === 'ice' ? 4200 : 900; f.Q.value = .8;
    g.gain.value = 0.0001; s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
    return {
      rate(x) { g.gain.setTargetAtTime(Math.max(0.0001, .09 * x), ctx.currentTime, .04); },
      stop() { g.gain.setTargetAtTime(0.0001, ctx.currentTime, .06); s.stop(ctx.currentTime + .4); }
    };
  },
  wind() {
    if (!prefs.sfx || !ensure()) return { rate() {}, stop() {} };
    const s = noise(4), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.loop = true; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.0001;
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
    return {
      rate(x) { const t = ctx.currentTime; f.frequency.setTargetAtTime(300 + 900 * x, t, .1); g.gain.setTargetAtTime(Math.max(.0001, .08 * x), t, .1); },
      stop() { g.gain.setTargetAtTime(0.0001, ctx.currentTime, .1); s.stop(ctx.currentTime + .6); }
    };
  },
  ready: () => loading
};

/* Optional background music: a gentle generative marimba loop in C major pentatonic.
   Off unless the player turns it on in Settings. */
const Music = {
  timer: null, bar: 0,
  start() {
    if (!ensure() || this.timer || !prefs.music) return;
    const scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
    const prog = [[0, 2, 4], [3, 5, 7], [4, 6, 1], [2, 4, 6]];
    const beat = .42;
    const playBar = () => {
      const chord = prog[this.bar % prog.length];
      tone(scale[chord[0]] / 2, 0, beat * 7.5, { type: 'triangle', gain: .05, dest: musicBus, attack: .3 });
      for (let i = 0; i < 8; i++) {
        if (Math.random() < .28) continue;
        const n = scale[chord[(i + this.bar) % 3] + (i % 4 === 3 ? 1 : 0)] * (i % 2 ? 2 : 1);
        tone(n, i * beat, .5, { type: 'sine', gain: .06, dest: musicBus });
        tone(n * 4, i * beat, .12, { type: 'sine', gain: .012, dest: musicBus });
      }
      this.bar++;
    };
    playBar(); this.timer = setInterval(playBar, beat * 8 * 1000);
  },
  stop() { clearInterval(this.timer); this.timer = null; }
};
export { Music };
