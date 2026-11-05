/* Player preferences and saved progress. localStorage may be unavailable (private
   windows, locked-down school browsers), so every access is guarded and the game
   still works with defaults. */
const KEY = 'physics-arcade-prefs-v2';
const PROGRESS = 'physics-arcade-progress-v2';

export const DEFAULTS = {
  theme: 'auto',        // light | dark | auto
  sfx: true, sfxVol: 70,
  music: false, musicVol: 35,
  cinematics: true,     // motion replay after a fully correct diagram
  motionLabels: true,   // separate velocity / acceleration markers
  reduceMotion: null,   // null = follow the device setting
  classicArt: false,    // show the teacher's original SVG drawings
  contrast: false
};

function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked */ } }

const listeners = new Set();
export const prefs = { ...DEFAULTS };
const saved = read(KEY);
if (saved && typeof saved === 'object') {
  for (const k of Object.keys(DEFAULTS)) {
    if (k in saved && (typeof saved[k] === typeof DEFAULTS[k] || (k === 'reduceMotion' && (saved[k] === null || typeof saved[k] === 'boolean')))) prefs[k] = saved[k];
  }
  prefs.sfxVol = clamp(prefs.sfxVol); prefs.musicVol = clamp(prefs.musicVol);
  if (!['light', 'dark', 'auto'].includes(prefs.theme)) prefs.theme = 'auto';
}
function clamp(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }

export function setPref(k, v) {
  if (prefs[k] === v) return;
  prefs[k] = v; write(KEY, prefs);
  for (const fn of listeners) fn(k, v);
}
export function onPref(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
export const reducedMotion = () => prefs.reduceMotion ?? !!(mq && mq.matches);
const dq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
export const wantsDark = () => prefs.theme === 'dark' || (prefs.theme === 'auto' && !!(dq && dq.matches));
export function onSystemChange(fn) { mq?.addEventListener?.('change', fn); dq?.addEventListener?.('change', fn); }

/* Progress: first-try counts per level and the last level played. */
export function loadProgress() { return read(PROGRESS); }
export function saveProgress(p) { write(PROGRESS, p); }
