/* Art kit: colour helpers, SVG shape helpers, and the SVG→Pixi texture rasterizer.
   All original art in this game is authored as layered SVG ("cut-paper" pieces with
   soft cast shadows), rasterized at the exact screen resolution, then composed and
   animated as PixiJS sprites. */
import { Texture } from 'pixi.js';

/* ---------- colour ---------- */
const hex = c => { c = c.replace('#', ''); if (c.length === 3) c = [...c].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); };
const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const shade = (c, t = .22) => mix(c, '#2a1626', t);      // shadows lean warm-plum, never grey
export const light = (c, t = .25) => mix(c, '#fff6e6', t);

/* ---------- palette ("Workshop Diorama") ---------- */
export const P = {
  ink: '#2b2130', cream: '#f7ecd8', paper: '#f3e6d0', kraft: '#d8b98e',
  wood: '#c98b52', woodD: '#9c6435', woodL: '#e2ab72', oak: '#b77845',
  metal: '#9aa4ae', metalD: '#6f7883', metalL: '#c9d0d6', steel: '#5d6670',
  red: '#d9533c', blue: '#3e6db3', navy: '#2d4471', green: '#3d9858', leaf: '#4f9a52', yellow: '#eab33f',
  orange: '#e9823a', plum: '#7a4f7e', teal: '#2a8a80', pink: '#e2687e', sky: '#a9d4ee', skyL: '#e8f4f8',
  skin1: '#f0c39c', skin2: '#c98d62', skin3: '#8d5a3c', rope: '#a8814f', cable: '#3a3640',
  snow: '#fbfdff', snowS: '#dde8f2', grass: '#69ad4f', grassD: '#4f8f3c', dirt: '#c2875a', sand: '#efd5a2', water: '#3d86b8'
};

/* ---------- SVG helpers (all return markup strings) ---------- */
const a = ex => ex ? ' ' + ex : '';
export const R = (x, y, w, h, fill, r = 0, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}"` : ''} fill="${fill}"${a(ex)}/>`;
export const C = (cx, cy, r, fill, ex = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${a(ex)}/>`;
export const E = (cx, cy, rx, ry, fill, ex = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${a(ex)}/>`;
export const Pth = (d, fill, ex = '') => `<path d="${d}" fill="${fill}"${a(ex)}/>`;
export const Ln = (d, stroke, w = 2, ex = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${a(ex)}/>`;
export const Tx = (x, y, t, size = 12, fill = P.ink, ex = '') => `<text x="${x}" y="${y}" font-family="Bricolage, Lexend, sans-serif" font-weight="800" font-size="${size}" text-anchor="middle" fill="${fill}"${a(ex)}>${t}</text>`;
export const G = (inner, ex = '') => `<g${a(ex)}>${inner}</g>`;
/** A cut-paper piece: lifted off the page with a soft warm cast shadow. */
export const paper = (inner, lift = 1) => `<g filter="url(#${lift > 1.5 ? 'ps2' : 'ps'})">${inner}</g>`;
/** Rounded box with top highlight and bottom/side shade — the basic "card stock block". */
export function block(x, y, w, h, col, r = 4, { edge = true, top = true } = {}) {
  return R(x, y, w, h, col, r) +
    (top ? R(x + 2, y + 2, w - 4, Math.min(5, h / 5), light(col, .35), Math.min(r, 3)) : '') +
    (edge ? R(x, y + h - Math.min(7, h / 4), w, Math.min(7, h / 4), shade(col, .2), Math.min(r, 3)) : '');
}
export const DEFS = `<defs>
  <filter id="ps" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="#3b2216" flood-opacity=".28"/></filter>
  <filter id="ps2" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#3b2216" flood-opacity=".3"/></filter>
  <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="blur10"><feGaussianBlur stdDeviation="10"/></filter>
  <pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="transparent"/>
    ${Array.from({ length: 70 }, (_, i) => { const x = (i * 53) % 120, y = (i * 37 + (i * i) % 29) % 120; return `<circle cx="${x}" cy="${y}" r="${.5 + (i % 3) * .35}" fill="${i % 2 ? '#000' : '#fff'}" opacity=".05"/>`; }).join('')}
  </pattern>
</defs>`;

/* ---------- rasterizer ---------- */
const cache = new Map();
let fontsReady = null;
export function waitFonts() { return (fontsReady ||= (document.fonts?.ready || Promise.resolve()).catch(() => {})); }

/** Rasterize an SVG fragment drawn in world units within box [x, y, w, h] at `res` px per unit. */
export async function svgTexture(inner, box, res, key) {
  const k = key ? `${key}@${res.toFixed(2)}:${box.join(',')}` : null;
  if (k && cache.has(k)) return cache.get(k);
  const [x, y, w, h] = box;
  const pw = Math.max(1, Math.ceil(w * res)), ph = Math.max(1, Math.ceil(h * res));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="${x} ${y} ${w} ${h}">${DEFS}${inner}</svg>`;
  const img = new Image();
  img.decoding = 'async';
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
  cv.getContext('2d').drawImage(img, 0, 0, pw, ph);
  const tex = Texture.from(cv);
  tex.__key = k;
  if (k) cache.set(k, tex);
  return tex;
}
/* Textures are shared through the cache, so each scene build holds a reference and a
   texture is destroyed only when the last build using it is released. */
export function retain(t) { t.__refs = (t.__refs || 0) + 1; return t; }
export function release(textures) {
  for (const t of textures) if (--t.__refs <= 0) { if (t.__key) cache.delete(t.__key); t.destroy(true); }
}
