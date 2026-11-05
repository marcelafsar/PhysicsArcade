/* Scene capture. Every scenario's `scene()` builds its picture by calling the teacher's
   helper functions (restScene, incline, hangScene, motion, ...). We wrap those helpers
   so that calling scene() also records each call and its arguments — giving the exact
   geometry (surfaces, angles, rope anchors, motion notes) the new art must match.
   The wrappers still return the original SVG, so scene() behaves exactly as before. */
/* global OB, RAMP */

const BUILDERS = ['sky', 'cloud', 'motion', 'room', 'elevator', 'skydiver', 'incline', 'person', 'restScene', 'hangScene', 'fallScene', 'slideScene',
  'floatScene', 'springScene', 'flatScene', 'pullScene', 'pushScene', 'twoCableScene', 'heldScene', 'atwoodScene', 'tableHangScene', 'pushPairScene',
  'towScene', 'stackScene', 'inclinePulleyScene', 'liftScene'];
export const TOP = new Set(BUILDERS.slice(8).concat(['elevator', 'skydiver', 'incline']));

let log = null, depth = 0, installed = false;
export function installCapture() {
  if (installed) return; installed = true;
  for (const name of BUILDERS) {
    const orig = globalThis[name];
    if (typeof orig !== 'function') continue;
    globalThis[name] = function (...args) {
      const entry = log ? { fn: name, args, depth } : null;
      if (entry) log.push(entry);
      depth++;
      try { const out = orig.apply(this, args); if (entry) entry.out = out; return out; } finally { depth--; }
    };
  }
}

/* ---------- object fingerprints: which OB.* drawing is this? ---------- */
const skel = svg => svg.replace(/>[^<]*</g, '><').replace(/#[0-9a-fA-F]{3,8}\b/g, 'C').replace(/-?\d*\.?\d+(e-?\d+)?/g, 'N').replace(/\s+/g, ' ');
let prints = null;
function buildPrints() {
  prints = new Map();
  for (const key of Object.keys(OB)) {
    for (const args of [[], [90, 60, '#d4a373', 'X']]) {
      try { const o = OB[key](...args); const s = skel(o.svg); if (!prints.has(s)) prints.set(s, key); } catch { /* arity mismatch */ }
    }
  }
}
export function identify(o) {
  if (!o || !o.svg) return null;
  if (!prints) buildPrints();
  const kind = prints.get(skel(o.svg));
  const col = (o.svg.match(/fill="(#[0-9a-fA-F]{3,6})"/) || [])[1];
  const txt = (o.svg.match(/<text[^>]*>([^<]+)<\/text>/) || [])[1];
  return { kind: kind || null, w: o.w, h: o.h, col, txt, svg: o.svg };
}
export function identifySvg(svg) {      // incline() receives the object's svg string only
  if (!prints) buildPrints();
  const kind = prints.get(skel(svg));
  const col = (svg.match(/fill="(#[0-9a-fA-F]{3,6})"/) || [])[1];
  const txt = (svg.match(/<text[^>]*>([^<]+)<\/text>/) || [])[1];
  return { kind: kind || null, col, txt, svg };
}
export function rampStyle(ramp) {
  for (const [k, v] of Object.entries(RAMP)) if (v.ramp === ramp) return k;
  return null;
}

/** Run a scenario's scene() under capture. Returns { calls, svg, main, motions, slope }. */
export function captureScene(sc) {
  log = []; depth = 0;
  let svg = '';
  try { const r = sc.scene(); svg = typeof r === 'string' ? r : (r && r.svg) || ''; }
  catch (e) { console.warn('scene() failed for', sc.id, e); }
  const calls = log; log = null;
  const main = calls.find(c => c.depth === 0 && TOP.has(c.fn)) || null;
  const motions = calls.filter(c => c.fn === 'motion').map(c => ({ dir: c.args[0], x: c.args[1], y: c.args[2], note: c.args[3] || '' }));
  // slopeMotion is a const arrow (not wrappable); recover it from the SVG it produced
  const slope = [];
  const re = /<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"><path d="M0 0 h80"[^]*?<text class="halo" x="[-\d.]+" y="[-\d.]+" font-size="14" font-weight="700" fill="#343a40">([^<]*)<\/text><text class="halo" x="[-\d.]+" y="[-\d.]+" font-size="12.5" fill="#495057">([^<]*)<\/text>/g;
  let m; while ((m = re.exec(svg))) slope.push({ x: +m[1], y: +m[2], ang: -+m[3], t1: m[4], t2: m[5] });
  return { calls, svg, main, motions, slope };
}
