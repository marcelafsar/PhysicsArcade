/* Environment painters. Each returns { svg, decor, clouds, fx } for the world box
   BLEED (wider and taller than the 640 × 440 diagram so wide or tall screens never
   show an edge). `svg` is the static backdrop; `decor` are Kenney background sprites
   (trees, bushes, houses); `clouds` drift; `fx` names ambient effects.
   Surfaces that objects rest on are drawn at exactly the y the scenario uses. */
import { P, R, C, E, Pth, Ln, Tx, G, paper, block, shade, light, mix } from './kit.js';

export const BLEED = [-420, -180, 1480, 800];               // x, y, w, h in world units
const X0 = BLEED[0], Y0 = BLEED[1], W = BLEED[2], X1 = X0 + W, Y1 = Y0 + BLEED[3];

const grad = (id, stops, v = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rgrad = (id, c, a = .6) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const full = fill => R(X0, Y0, W, BLEED[3], fill);
const band = (y, h, fill, ex) => R(X0, y, W, h, fill, 0, ex);
const grain = () => full('url(#grain)');
let uid = 0; const id = p => `${p}${++uid}`;

/* ---------- shared outdoor pieces ---------- */
function sky(top = '#8fc7ea', bottom = '#e9f5f9', sun = { x: 520, y: 40, c: '#fff4c9' }) {
  const g = id('sky'), s = id('sun');
  return `<defs>${grad(g, [[0, top], [1, bottom]])}${sun ? rgrad(s, sun.c, .9) : ''}</defs>${R(X0, Y0, W, BLEED[3], `url(#${g})`)}` + (sun ? C(sun.x, sun.y, 170, `url(#${s})`) + C(sun.x, sun.y, 34, sun.c, 'opacity=".85"') : '');
}
function hills(y, col, amp = 30, phase = 0, period = 260) {
  let d = `M${X0} ${Y1} L${X0} ${y}`;
  for (let x = X0; x <= X1; x += period / 4) d += ` Q${x + period / 8} ${y - amp * Math.sin((x + phase) / period * Math.PI * 2 + 1)} ${x + period / 4} ${y - amp * .4 * Math.cos((x + phase) / period * 6.1)}`;
  return Pth(d + ` L${X1} ${Y1}Z`, col);
}
function grassGround(y, col = P.grass) {
  return band(y, Y1 - y, col) + band(y, 6, light(col, .18)) + band(y + 18, Y1, shade(col, .06), 'opacity=".5"') +
    Array.from({ length: 60 }, (_, i) => { const x = X0 + i * 25 + (i * 7) % 13, yy = y + 14 + (i * 31) % 120; return Ln(`M${x} ${yy} l3 -7 M${x + 6} ${yy} l-2 -6`, shade(col, .15), 1.6, 'opacity=".55"'); }).join('');
}
function snowGround(y) {
  return band(y, Y1 - y, P.snow) + band(y, 4, '#ffffff') + Array.from({ length: 14 }, (_, i) => E(X0 + i * 110 + 40, y + 30 + (i % 3) * 26, 60, 4, P.snowS, 'opacity=".7"')).join('');
}
function paperCloud(x, y, s = 1, col = '#fff') {
  return G(E(0, 0, 46, 16, col) + E(-22, -9, 24, 16, col) + E(16, -14, 28, 20, col) + E(34, -2, 20, 12, col), `transform="translate(${x} ${y}) scale(${s})" opacity=".95"`);
}
function cityline(y, col, seed = 3) {
  let s = '';
  for (let x = X0, i = 0; x < X1; i++) { const w = 46 + ((i * seed * 17) % 50), h = 60 + ((i * seed * 29) % 120); s += R(x, y - h, w, h + 400, col, 2); for (let k = 0; k < Math.floor(h / 22); k++) s += R(x + 8, y - h + 10 + k * 22, w - 16, 7, light(col, .25), 1, 'opacity=".55"'); x += w + 6; }
  return s;
}
function trees(list) { return list.map(([img, x, y, h, layer = 'back', flip = false]) => ({ img, x, y, h, layer, flip })); }

/* ---------- shared indoor pieces ---------- */
function wall(col, floorY, { wainscot = true, stripes = false } = {}) {
  const g = id('wall');
  let s = `<defs>${grad(g, [[0, light(col, .1)], [1, shade(col, .06)]])}</defs>` + R(X0, Y0, W, floorY - Y0, `url(#${g})`);
  if (stripes) s += Array.from({ length: 40 }, (_, i) => R(X0 + i * 40, Y0, 18, floorY - Y0, light(col, .08))).join('');
  if (wainscot) s += band(floorY - 90, 90, shade(col, .08)) + band(floorY - 92, 6, light(col, .25));
  return s;
}
function floor(y, kind = 'wood', col) {
  const base = col || { wood: '#c99a64', tile: '#e4ddd0', carpet: '#8a8fa6', concrete: '#a9a6a1', gym: '#e6b878', stage: '#6e4a36', lino: '#cfd3c8', dark: '#3c3742' }[kind];
  let s = band(y, Y1 - y, base) + band(y, 8, shade(base, .25)) + band(y + 8, 4, light(base, .2), 'opacity=".6"');
  if (kind === 'wood' || kind === 'gym' || kind === 'stage') s += Array.from({ length: 9 }, (_, i) => band(y + 26 + i * 22, 1.6, shade(base, .14))).join('') +
    Array.from({ length: 40 }, (_, i) => Ln(`M${X0 + i * 70 + (i % 3) * 23} ${y + 12 + (i % 9) * 22} v20`, shade(base, .14), 1.4)).join('');
  if (kind === 'tile') s += Array.from({ length: 36 }, (_, i) => Ln(`M${X0 + i * 60} ${y + 12} L${X0 + i * 60 - 80} ${Y1}`, shade(base, .1), 1.5)).join('') + Array.from({ length: 5 }, (_, i) => band(y + 30 + i * 34, 1.5, shade(base, .1))).join('');
  if (kind === 'concrete') s += Array.from({ length: 30 }, (_, i) => C(X0 + (i * 97) % W, y + 20 + (i * 41) % 160, 2 + i % 3, shade(base, .1), 'opacity=".6"')).join('');
  if (kind === 'carpet') s += Array.from({ length: 70 }, (_, i) => C(X0 + (i * 53) % W, y + 16 + (i * 37) % 160, 1.4, light(base, .2), 'opacity=".6"')).join('');
  return s;
}
function windowPane(x, y, w, h, skyTop = '#9fd0ee', frame = '#fff8ea') {
  const g = id('win');
  return `<defs>${grad(g, [[0, skyTop], [1, '#e6f4f8']])}</defs>` + paper(R(x - 8, y - 8, w + 16, h + 16, frame, 6) + R(x, y, w, h, `url(#${g})`, 2) +
    paperCloud(x + w * .35, y + h * .32, .45) + R(x + w / 2 - 3, y, 6, h, frame) + R(x, y + h / 2 - 3, w, 6, frame) + R(x - 12, y + h + 6, w + 24, 8, shade(frame, .12), 3)) +
    Pth(`M${x} ${y + h} L${x + w} ${y + h} L${x + w + 120} ${y + h + 260} L${x + 60} ${y + h + 260}Z`, '#fff6dc', 'opacity=".18"');
}
function frame(x, y, w, h, inner) { return paper(R(x - 6, y - 6, w + 12, h + 12, '#6e4a36', 3) + R(x, y, w, h, '#f5ead2', 1) + inner); }
function shelfUnit(x, y, w, rows, col = '#8a5a34', items = []) {
  let s = R(x, y, w, rows * 56 + 8, shade(col, .2), 3);
  for (let r = 0; r < rows; r++) {
    s += R(x + 4, y + 4 + r * 56, w - 8, 48, shade(col, .45), 2) + R(x, y + 52 + r * 56, w, 8, col, 2);
    const its = items[r] || [];
    its.forEach(([dx, wi, hi, c]) => { s += block(x + 8 + dx, y + 52 + r * 56 - hi, wi, hi, c, 2); });
  }
  return paper(s);
}
function pottedPlant(x, y, s = 1) {
  return paper(G(E(-14, -46, 16, 26, '#4f9a52', 'transform="rotate(-25 -14 -46)"') + E(14, -50, 15, 28, '#448c48', 'transform="rotate(20 14 -50)"') + E(0, -60, 13, 26, '#5fae5c') +
    Pth('M-18 -22 L18 -22 L13 0 L-13 0Z', '#c9653c') + R(-20, -26, 40, 7, shade('#c9653c', .15), 3), `transform="translate(${x} ${y}) scale(${s})"`));
}
const vignette = () => { const v = id('vig'); return `<defs><radialGradient id="${v}" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#2a1626" stop-opacity="0"/><stop offset="1" stop-color="#2a1626" stop-opacity=".22"/></radialGradient></defs>` + R(-120, -100, 880, 640, `url(#${v})`); };

/* =====================================================================
   ENVIRONMENTS — keyed by name; opts.y is the ground/floor/surface line.
   ===================================================================== */
export const ENVS = {
  /* ---- outdoors ---- */
  park({ y = 404 } = {}) {
    return { svg: sky() + hills(y - 70, '#a9cfa0', 26, 0, 340) + hills(y - 30, '#8cc07c', 22, 120, 260) + grassGround(y) + grain(),
      decor: trees([['treeLong', -60, y - 24, 190], ['tree', 80, y - 6, 150], ['bush2', 160, y + 4, 40, 'mid'], ['treeSmall_green2', 560, y - 8, 120], ['tree', 700, y - 4, 170], ['bush1', 470, y + 4, 44, 'mid']]),
      clouds: [['cloud2', 90, 70, .5], ['cloud5', 470, 40, .42], ['cloud7', 760, 90, .5]] };
  },
  snowfield({ y = 404, slope = false } = {}) {
    return { svg: sky('#9cc7ea', '#eef6fb', { x: 140, y: 50, c: '#ffffff' }) +
        Pth(`M${X0} ${y - 40} L-140 ${y - 210} L20 ${y - 120} L170 ${y - 260} L330 ${y - 130} L470 ${y - 230} L640 ${y - 110} L820 ${y - 240} L${X1} ${y - 90} V${Y1} H${X0}Z`, '#c7d9ea') +
        Pth(`M-140 ${y - 210} L-110 ${y - 186} L-130 ${y - 180} L-96 ${y - 170} L-180 ${y - 178}Z M170 ${y - 260} L205 ${y - 226} L180 ${y - 222} L220 ${y - 206} L120 ${y - 214}Z M470 ${y - 230} L500 ${y - 200} L470 ${y - 196} L510 ${y - 182} L430 ${y - 196}Z M820 ${y - 240} L850 ${y - 210} L825 ${y - 205} L862 ${y - 190} L780 ${y - 200}Z`, '#ffffff') +
        hills(y - 50, '#e4eef6', 20, 40, 300) + snowGround(y) + grain(),
      decor: trees([['treePineSnow', 30, y - 40, 120], ['treePineSnow', 70, y - 44, 90], ['treePineSnow', 590, y - 46, 110], ['treePineSnow', 640, y - 40, 140], ['treePineSnow', -120, y - 30, 130], ['treePineSnow', 820, y - 30, 120]]),
      clouds: [['cloud3', 300, 60, .45], ['cloud6', 700, 30, .4]], fx: ['snow'] };
  },
  beach({ y = 404, sea = 40 } = {}) {
    const g = id('sea');
    return { svg: sky('#86c3e8', '#f2f6ee', { x: 540, y: 60, c: '#fff1c4' }) + `<defs>${grad(g, [[0, '#4a95c4'], [1, '#2f78a8']])}</defs>` + R(X0, y - sea, W, sea + 10, `url(#${g})`) +
        Array.from({ length: 14 }, (_, i) => Ln(`M${X0 + i * 110} ${y - sea / 2 + (i % 2) * 6} q12 -5 24 0`, '#bfe3f7', 2.2, 'opacity=".8"')).join('') +
        band(y, Y1 - y, P.sand) + band(y, 7, light(P.sand, .3)) + Array.from({ length: 30 }, (_, i) => C(X0 + (i * 73) % W, y + 20 + (i * 29) % 120, 1.6, shade(P.sand, .2))).join('') + grain(),
      decor: trees([['treePalm', 600, y + 2, 190], ['treePalm', -40, y + 2, 170, 'back', true]]), clouds: [['cloud1', 160, 50, .45], ['cloud4', 520, 90, .38]], fx: ['waves'] };
  },
  lawn({ y = 404 } = {}) {
    return { svg: sky() + hills(y - 60, '#a9cfa0', 18, 50, 300) + grassGround(y, '#72b257') + grain(),
      decor: trees([['houseAlt1', 560, y - 6, 190], ['fence', 410, y + 2, 46, 'mid'], ['fence', 470, y + 2, 46, 'mid'], ['tree', 40, y - 2, 170], ['bush3', 150, y + 4, 36, 'mid'], ['houseSmall1', -150, y - 4, 140]]),
      clouds: [['cloud8', 250, 50, .45], ['cloud2', 640, 70, .4]] };
  },
  sidewalk({ y = 404 } = {}) {
    return { svg: sky('#9ccbe9', '#edf5f6') + cityline(y - 20, '#b7c4d1', 3) + band(y - 24, 24, '#7f9a6a') + band(y, Y1 - y, '#cfd2d4') + band(y, 5, '#e9ebec') +
        Array.from({ length: 16 }, (_, i) => Ln(`M${X0 + i * 100} ${y} L${X0 + i * 100 - 30} ${Y1}`, '#b7bbbf', 2)).join('') + grain(),
      decor: trees([['treeSmall_green1', 90, y - 22, 110], ['treeSmall_green3', 560, y - 22, 120]]), clouds: [['cloud5', 400, 60, .4]] };
  },
  street({ y = 268 } = {}) {
    return { svg: sky() + cityline(y - 40, '#aebccb', 5) + band(y - 120, 120, '#cdd6c3', 'opacity=".0"') + band(y - 36, 36, '#c9cdc4') + band(y - 6, 6, '#9a9d98') +
        band(y, Y1 - y, '#56595f') + band(y, 4, '#3d3f44') + Array.from({ length: 12 }, (_, i) => R(X0 + i * 130 + 20, y + 82, 64, 7, '#f4f1e6', 2)).join('') + grain(),
      decor: trees([['treeSmall_green2', 60, y - 36, 100, 'back'], ['treeSmall_green1', 610, y - 36, 110, 'back']]), clouds: [['cloud6', 500, 50, .42], ['cloud3', 90, 30, .35]] };
  },
  construction({ y = 404, crane = true } = {}) {
    return { svg: sky('#9fcde9', '#f3efe2') + cityline(y - 10, '#c3c7cf', 7) + band(y, Y1 - y, '#a39b8e') + band(y, 6, '#c2b9aa') +
        (crane ? paper(R(X0, 30, W, 16, '#e9b23a') + Array.from({ length: 50 }, (_, i) => Pth(`M${X0 + i * 30} 30 l15 16 l15 -16`, 'none', 'stroke="#b8861f" stroke-width="2"')).join('') +
          R(560, 46, 40, y - 46, '#e9b23a') + Array.from({ length: 14 }, (_, i) => Pth(`M560 ${60 + i * 26} l40 13 l-40 13`, 'none', 'stroke="#b8861f" stroke-width="2"')).join('')) : '') +
        paper(block(-200, y - 60, 140, 60, '#d9cfbd', 3) + block(700, y - 46, 160, 46, '#cfc4b0', 3)) + grain(),
      clouds: [['cloud2', 260, 90, .4]] };
  },
  cliff({ y = 404 } = {}) {
    return { svg: sky('#8fc4e6', '#eaf3f4') + hills(330, '#a7c49c', 20, 0, 300) + grassGround(410, '#7aac5c') +
        paper(Pth(`M440 ${Y0} H${X1} V${Y1} H470 L500 300 L452 160 L480 60 L460 ${Y0}Z`, '#9b8672', ) + Pth(`M452 160 L480 60 L520 150 L500 300Z`, '#b19c86') + Pth(`M600 ${Y0} H${X1} V${Y1} H620Z`, shade('#9b8672', .15))) +
        R(430, 0, 120, 10, '#6e5f50') + grain(), decor: trees([['bush4', 520, 66, 40, 'mid']]), clouds: [['cloud1', 120, 60, .45]] };
  },
  well({ y = 300, x = 320 } = {}) {
    return { svg: sky() + hills(y - 20, '#a9cfa0', 16, 0, 300) + grassGround(y, '#79b35b') +
        paper(R(x - 80, 0, 10, y, '#7b4f33') + R(x + 70, 0, 10, y, '#7b4f33') + Pth(`M${x - 110} 8 L${x} -40 L${x + 110} 8Z`, '#b8432e') + R(x - 90, 16, 180, 14, '#8a5a34', 3) + C(x, 23, 12, '#5d5566')) +
        paper(R(x - 100, y - 10, 200, 60, '#9f988e', 4) + Array.from({ length: 10 }, (_, i) => R(x - 98 + (i % 5) * 40, y - 8 + Math.floor(i / 5) * 28, 36, 24, i % 2 ? '#aaa398' : '#948d82', 3)).join('')) +
        R(x - 86, y + 46, 172, 400, '#2b2730') + grain(), decor: trees([['tree', 60, y + 4, 150], ['bush1', 560, y + 6, 40]]), clouds: [['cloud4', 520, 60, .4]] };
  },
  heliSky() {
    return { svg: sky('#7fbbe6', '#e0f0fb', { x: 120, y: 60, c: '#fff6d8' }) + hills(420, '#9cc39a', 30, 0, 380) + hills(440, '#86b47f', 26, 90, 300) + grain(), clouds: [['cloud1', 520, 140, .5], ['cloud5', 80, 240, .45], ['cloud3', 700, 300, .5]] };
  },
  pond({ y = 228, tub = false } = {}) {
    if (tub) return ENVS.bathroom({ y });
    return { svg: sky('#a9d3ee', '#eaf5fb') + hills(y - 30, '#8fbd82', 26, 30, 280) + hills(y - 6, '#78ab69', 14, 140, 220) + band(y - 8, 12, '#6c9a5a') + grain(),
      decor: trees([['treeLong', 40, y - 4, 160], ['tree', 600, y - 2, 140], ['bush2', 150, y + 2, 34], ['bushAlt1', 520, y + 2, 30]]), clouds: [['cloud7', 470, 50, .42], ['cloud2', 120, 80, .38]], fx: ['water'] };
  },
  bathroom({ y = 228 } = {}) {
    const tile = Array.from({ length: 30 }, (_, i) => R(X0 + (i % 15) * 100, -180 + Math.floor(i / 15) * 100, 96, 96, '#d5eef0', 6)).join('');
    return { svg: full('#c4e5e9') + tile + Array.from({ length: 60 }, (_, i) => R(X0 + (i % 30) * 50, 20 + Math.floor(i / 30) * 50, 46, 46, '#d5eef0', 5)).join('') +
        paper(R(10, 110, 620, 400, '#fbfaf7', 30) + R(10, 110, 620, 14, '#ffffff', 7) + R(600, 60, 14, 60, '#b9c3cc', 4) + R(560, 56, 70, 12, '#c9d0d6', 6)) + grain(), fx: ['water'] };
  },
  skydive() {
    const g = id('hz');
    return { svg: sky('#5ea6dd', '#d8eefb', { x: 520, y: -60, c: '#fff8e0' }) + `<defs>${grad(g, [[0, '#cfe7f2'], [1, '#a5c9a0']])}</defs>` + R(X0, 520, W, 400, `url(#${g})`) + grain(),
      clouds: [['cloud1', 90, 90, .55], ['cloud6', 520, 340, .6], ['cloud3', 140, 380, .45], ['cloud5', 470, 70, .4], ['cloud8', 760, 220, .55], ['cloud2', -160, 260, .5]], fx: ['wind'] };
  },
  sunrise() {
    return { svg: sky('#f2b98a', '#fdeee0', { x: 120, y: 360, c: '#ffe0a0' }) + hills(420, '#a7a77a', 30, 0, 360) + hills(436, '#8a9b6e', 18, 70, 260) + grain(), clouds: [['cloud2', 90, 330, .5], ['cloud4', 560, 380, .55], ['cloud7', 700, 120, .4]] };
  },
  rink() {
    return { svg: full('#cfd6e2') + Array.from({ length: 24 }, (_, i) => R(X0 + i * 62, 30, 46, 18, '#9aa5b5', 5) + R(X0 + i * 62 + 22, 66, 46, 18, '#8a95a6', 5)).join('') +
        band(110, 10, '#c3ccd8') + band(120, 112, '#fbfbfb') + band(200, 32, '#e9b93f') + band(120, 5, '#cfd6df') + band(232, 400, '#e3f2fa') +
        band(260, 2, '#cbe5f2') + band(300, 2, '#cbe5f2') + band(340, 3, '#e2a3a3', 'opacity=".6"') + Ln('M30 120 L110 228 L150 228', '#2b2730', 9) + Ln('M190 236 h60 M205 242 h40', '#bfe0f0', 2) + grain(), fx: ['sheen'] };
  },
  bowlingAlley() {
    return { svg: full('#262b3a') + Array.from({ length: 20 }, (_, i) => C(X0 + i * 80 + 40, 40, 10, '#3a4258')).join('') + R(X0, 70, W, 40, '#30364a') +
        band(250, Y1 - 250, '#e3b67a') + Array.from({ length: 12 }, (_, i) => band(262 + i * 18, 2, '#d1a061')).join('') + band(250, 4, '#f1cf9a') +
        Array.from({ length: 6 }, (_, i) => Pth(`M${200 + i * 50} ${360 + (i % 2) * 20} l8 -12 l8 12z`, '#9a6a3a', 'opacity=".6"')).join('') + grain(), fx: ['lights'] };
  },
  infield({ y = 254 } = {}) {
    return { svg: sky() + band(y - 140, 80, '#2f6b4a') + Array.from({ length: 30 }, (_, i) => C(X0 + i * 50 + 20, y - 120, 6, ['#e2553c', '#f2b13d', '#3e6db3', '#f4efe6'][i % 4], 'opacity=".8"')).join('') +
        band(y - 60, 60, '#5c9e47') + Array.from({ length: 12 }, (_, i) => R(X0 + i * 120, y - 60, 60, 60, '#68a952')).join('') + band(y, Y1 - y, '#c8865a') + band(y, 5, '#d99a6c') + paper(R(70, y - 10, 44, 12, '#fff', 2)) + grain() };
  },
  turf({ y = 268 } = {}) {
    return { svg: full('#bfe0f5') + sky('#9fcdee', '#e2f1fa', null) + band(y - 70, 70, '#3b6f8f') + Array.from({ length: 40 }, (_, i) => C(X0 + i * 38, y - 50 + (i % 2) * 18, 7, ['#e2553c', '#f4efe6', '#f2b13d'][i % 3], 'opacity=".7"')).join('') +
        band(y, Y1 - y, '#4f9a45') + Array.from({ length: 10 }, (_, i) => R(X0 + i * 160, y, 80, Y1, '#5aa64f')).join('') + Array.from({ length: 10 }, (_, i) => Ln(`M${X0 + i * 160} ${y} L${X0 + i * 160 - 30} ${Y1}`, '#fff', 3, 'opacity=".7"')).join('') + grain() };
  },
  playground({ y = 404 } = {}) { return ENVS.park({ y }); },
  station({ y = 404 } = {}) {
    const e = ENVS.park({ y });
    e.svg += paper(block(480, 300, 120, 104, '#f4efe6', 4) + R(500, 316, 30, 24, '#9fd0ee', 2) + Tx(540, 360, 'WEATHER', 12, P.plum) + R(530, 250, 4, 52, '#6f7883') + Pth('M520 250 h24 l-12 -10z', '#e2553c'));
    e.decor = e.decor.filter(d => d.x < 400 || d.x > 640);
    return e;
  },
  rooftop({ y = 408 } = {}) {
    return { svg: sky() + paper(R(430, 60, 300, 380, '#b5654a') + Pth('M410 64 L760 20 V64Z', '#4a4f57')) +
        Array.from({ length: 15 }, (_, i) => R(430, 84 + i * 24, 300, 2, '#9a523b')).join('') +
        paper(R(300, 44, 160, 8, '#6b4b2e', 2) + C(320, 56, 13, '#8f979f') + C(320, 56, 5, '#4b4652')) + grassGround(y, '#7a9b52') + grain(),
      decor: trees([['tree', 60, y + 2, 160], ['bush2', 220, y + 6, 40, 'mid']]), clouds: [['cloud5', 140, 60, .4]] };
  },
  dockLake({ y = 300 } = {}) {
    return { svg: sky('#b7dcf2', '#f0f8fc') + hills(y - 6, '#8fbd82', 22, 0, 300) + band(y + 30, Y1, '#3f7fae') + paper(band(y, 34, '#a07a52') + Array.from({ length: 36 }, (_, i) => Ln(`M${X0 + i * 40} ${y} V${y + 34}`, '#86643f', 2)).join('') + Array.from({ length: 10 }, (_, i) => R(X0 + i * 150 + 30, y + 30, 14, 90, '#7d5c3c')).join('')) +
        R(270, 0, 100, 14, '#6b4b2e', 2) + grain(), decor: trees([['treeLong', 40, y - 2, 140, 'back'], ['tree', 620, y - 2, 130, 'back']]), clouds: [['cloud3', 480, 60, .4]], fx: ['water'] };
  },

  /* ---- indoors ---- */
  room({ y = 400, windowAt = 70 } = {}) {
    return { svg: wall('#efdcc0', y) + (windowAt != null ? windowPane(windowAt, 40, 130, 95) : '') + frame(480, 60, 70, 54, C(515, 92, 14, '#e2553c', 'opacity=".7"') + Pth('M486 112 l20 -24 l16 14 l12 -8 l14 18z', '#3f9a5a')) + floor(y, 'wood') + grain() + vignette() };
  },
  kitchen({ y }) {
    const counter = paper(R(X0, y - 2, W, 12, '#4b4652', 3) + R(X0, y + 10, W, 420, '#c9c2b6') + Array.from({ length: 10 }, (_, i) => R(X0 + 30 + i * 150, y + 34, 128, 160, '#d9d2c6', 4) + R(X0 + 84 + i * 150, y + 48, 20, 5, '#8f979f', 2)).join(''));
    const tiles = Array.from({ length: 120 }, (_, i) => R(X0 + (i % 40) * 38, y - 110 + Math.floor(i / 40) * 36, 34, 32, i % 7 ? '#f5f1e8' : '#dceef0', 3)).join('');
    return { svg: wall('#f2e7d6', y, { wainscot: false }) + tiles + paper(Array.from({ length: 10 }, (_, i) => block(X0 + 40 + i * 150, 4, 130, 92, '#b9d2c8', 5) + R(X0 + 96 + i * 150, 78, 18, 5, '#6f7883', 2)).join('')) + counter + grain() + vignette() };
  },
  stand({ y, x = 320 }) {
    const e = ENVS.room({ y: 400 });
    e.svg += paper(block(x - 95, y, 190, 400 - y, '#7b4f33', 3) + R(x - 85, y + 16, 80, 380 - y, '#8c5d3c', 2) + R(x + 5, y + 16, 80, 380 - y, '#8c5d3c', 2) + C(x - 12, y + 60, 3, '#e2b33f') + C(x + 12, y + 60, 3, '#e2b33f'));
    return e;
  },
  livingroom({ y }) {
    return { svg: wall('#e6d7c2', y) + windowPane(60, 40, 130, 95) + frame(470, 70, 90, 60, Pth('M476 124 l26 -30 l18 16 l14 -10 l22 24z', '#5a8fb0') + C(540, 88, 8, '#f2b13d')) +
        paper(block(-260, y - 110, 230, 110, '#9a6b8e', 18) + block(-250, y - 150, 210, 60, '#a97a9c', 16)) + pottedPlant(660, y, 1.2) + floor(y, 'wood') +
        E(320, y + 40, 260, 22, '#b2584a', 'opacity=".35"') + grain() + vignette() };
  },
  classroom({ y }) {
    return { svg: wall('#e9e1cf', y) + paper(R(-40, 40, 300, 150, '#2f4a3f', 6) + R(-46, 34, 312, 162, 'none', 8, 'stroke="#8a5a34" stroke-width="8"') + Ln('M0 80 h110 M0 104 h80 M120 140 q20 -30 40 0', '#e9efe6', 2.4)) +
        windowPane(470, 40, 120, 110) + paper(Array.from({ length: 6 }, (_, i) => C(560 + (i % 3) * 22, 180 + Math.floor(i / 3) * 18, 7, ['#e2553c', '#f2b13d', '#3e6db3'][i % 3])).join('')) + floor(y, 'lino') + grain() + vignette() };
  },
  gym({ y }) {
    return { svg: wall('#dbe2ea', y, { wainscot: false }) + Array.from({ length: 30 }, (_, i) => R(X0 + i * 66, 30, 50, 80, '#c6d2e0', 4)).join('') + band(y - 70, 70, '#4b6d9a') + Array.from({ length: 30 }, (_, i) => R(X0 + i * 60, y - 66, 56, 62, '#5a7eae', 6)).join('') +
        floor(y, 'gym') + band(y + 60, 4, '#c8433a') + C(320, y + 140, 70, 'none', 'stroke="#c8433a" stroke-width="4"') + grain() + vignette() };
  },
  stage({ y }) {
    const g = id('spot');
    return { svg: full('#2b1d1d') + Array.from({ length: 26 }, (_, i) => Pth(`M${X0 + i * 80} 0 h70 q-12 ${y / 2} 0 ${y} h-70 q12 ${-y / 2} 0 ${-y}z`, i % 2 ? '#8b2323' : '#9b2a2a')).join('') +
        `<defs>${rgrad(g, '#fff3c4', .55)}</defs>` + E(320, y, 230, 50, `url(#${g})`) + Pth(`M240 -40 L400 -40 L540 ${y} L100 ${y}Z`, '#fff3c4', 'opacity=".08"') +
        floor(y, 'stage') + band(Y0, 40, '#5a1414') + grain() + vignette(), fx: ['lights'] };
  },
  sunroom({ ceil = 26 } = {}) {
    return { svg: wall('#f4ecdc', 404) + windowPane(430, 70, 160, 240) + paper(band(Y0, ceil - Y0, '#ddd3c2') + band(ceil - 2, 5, '#bdb19c')) + pottedPlant(60, 404, 1.4) + floor(404, 'tile') + grain() + vignette() };
  },
  lobby({ ceil = 26 } = {}) {
    return { svg: wall('#efe0c8', 404, { stripes: true }) + paper(band(Y0, ceil - Y0, '#e6d3b3') + band(ceil - 2, 6, '#c9a46a')) + C(320, ceil + 4, 28, '#e6d3b3') +
        paper(R(60, 120, 90, 220, '#c9a46a', 40) + R(68, 128, 74, 204, '#f6ead2', 36) + R(490, 120, 90, 220, '#c9a46a', 40) + R(498, 128, 74, 204, '#f6ead2', 36)) + floor(404, 'tile', '#e9dcc7') + grain() + vignette() };
  },
  gymBeam() {
    return { svg: wall('#e2e6ea', 404, { wainscot: false }) + Array.from({ length: 24 }, (_, i) => R(X0 + i * 70, 60, 54, 140, '#d2d9e0', 4)).join('') + paper(band(Y0, 30 - Y0, '#4b4652') + band(30, 6, '#3a3640') + Array.from({ length: 30 }, (_, i) => C(X0 + i * 50 + 20, 18, 3, '#6f6878')).join('')) + floor(404, 'concrete', '#8f8f8f') + grain() + vignette() };
  },
  ceiling({ ceil = 26 } = {}) {
    return { svg: wall('#fff4d6', 404) + paper(band(Y0, ceil - Y0, '#c9c2b6') + band(ceil - 2, 4, '#a39b8e')) + frame(80, 120, 80, 100, R(90, 130, 60, 80, '#a9cfe0')) + floor(404, 'wood') + grain() + vignette() };
  },
  doorframe({ ceil = 26 } = {}) {
    return { svg: wall('#efe6d6', 404) + paper(R(220, ceil, 200, 404 - ceil, '#8a6040', 4) + R(236, ceil + 10, 168, 404 - ceil, '#dccdb6', 2) + band(Y0, ceil - Y0, '#b0a99c')) + floor(404, 'wood') + grain() + vignette() };
  },
  market({ ceil = 26 } = {}) {
    return { svg: sky('#a8d4ec', '#f4f1e4') + paper(band(Y0, ceil - Y0, '#c8433a') + Array.from({ length: 30 }, (_, i) => R(X0 + i * 60, ceil - 10, 30, 30, '#f4efe6', 0)).join('') + Array.from({ length: 30 }, (_, i) => Pth(`M${X0 + i * 60} ${ceil + 20} q15 16 30 0 q15 16 30 0`, i % 2 ? '#c8433a' : '#f4efe6')).join('')) +
        paper(block(-200, 330, 260, 80, '#a0703e', 4) + block(560, 330, 260, 80, '#a0703e', 4) + Array.from({ length: 12 }, (_, i) => C(-180 + i * 20, 326, 10, i % 2 ? '#e2553c' : '#f2b13d')).join('') + Array.from({ length: 12 }, (_, i) => C(580 + i * 20, 326, 10, i % 2 ? '#7cb342' : '#e2553c')).join('')) +
        band(404, 400, '#cdbb9a') + grain() };
  },
  lab({ y = 404 } = {}) {
    return { svg: wall('#e6ebef', y) + paper(R(-200, 40, 180, 120, '#f8fafb', 4) + Array.from({ length: 40 }, (_, i) => R(-192 + (i % 10) * 17, 50 + Math.floor(i / 10) * 25, 14, 20, ['#f6c6b8', '#bfe0f0', '#d8eccb', '#f2e3a6'][(i * 7) % 4], 2)).join('')) +
        shelfUnit(560, 40, 200, 2, '#8f979f', [[[10, 20, 34, '#7ac1d8'], [40, 24, 26, '#f2b13d'], [80, 18, 40, '#e2553c'], [120, 30, 22, '#8fc47a']], [[0, 40, 30, '#3e6db3'], [60, 26, 36, '#cfd6e2'], [100, 30, 26, '#9a6bc0']]]) +
        floor(y, 'lino', '#c9cdd1') + grain() + vignette() };
  },
  warehouse({ y }) {
    return { svg: wall('#dfe2e4', y, { wainscot: false }) + Array.from({ length: 6 }, (_, i) => shelfUnit(X0 + 60 + i * 260, y - 290, 220, 4, '#4b6d9a', [[[0, 50, 40, '#d39f62'], [70, 60, 46, '#c8925a'], [140, 50, 36, '#d39f62']], [[10, 70, 44, '#c08552'], [100, 60, 30, '#d39f62']], [[0, 60, 40, '#d39f62'], [80, 80, 46, '#c8925a']], [[20, 50, 30, '#c08552'], [120, 60, 44, '#d39f62']]])).join('') +
        floor(y, 'concrete') + Array.from({ length: 14 }, (_, i) => R(X0 + i * 120, y + 40, 60, 5, '#e9b23a', 1)).join('') + grain() + vignette() };
  },
  diner({ y }) {
    const check = Array.from({ length: 80 }, (_, i) => R(X0 + (i % 40) * 40, y - 140 + Math.floor(i / 40) * 40 + ((i % 40) % 2) * 0, 20, 20, '#2b2130', 0, 'opacity=".08"')).join('');
    return { svg: wall('#fff1de', y, { wainscot: false }) + band(y - 160, 160, '#f7f2ea') + check + paper(R(X0, y, W, 30, '#d9433a') + band(y, 5, light('#d9433a', .3)) + band(y + 30, Y1, '#b9c0c7') + Array.from({ length: 14 }, (_, i) => R(X0 + i * 160 + 100, y + 30, 28, 110, '#5d5566', 3)).join('')) +
        windowPane(40, 24, 140, 70) + windowPane(560, 24, 140, 70) + grain() + vignette() };
  },
  shuffle({ y }) {
    return { svg: full('#3a2a20') + Array.from({ length: 40 }, (_, i) => R(X0 + i * 36, Y0, 32, y - Y0, i % 2 ? '#4a3426' : '#433024')).join('') + paper(frame(60, 40, 90, 60, C(105, 70, 16, '#e9b23a')) + frame(560, 30, 80, 50, Pth('M566 74 l20 -24 l20 18 l14 -10 l14 16z', '#5a8fb0'))) +
        paper(band(y, 40, '#e9c46a') + band(y, 5, light('#e9c46a', .4)) + band(y + 40, Y1, '#6e4630')) + Ln(`M560 ${y} V${y + 40}`, '#c8433a', 4) + grain() + vignette(), fx: ['lights'] };
  },
  labtable({ y }) {
    const e = ENVS.lab({ y: y + 160 });
    e.svg += paper(band(y, 18, '#3c3742') + band(y, 4, '#5d5566') + R(40, y + 18, 14, 440, '#4b4652') + R(586, y + 18, 14, 440, '#4b4652'));
    return e;
  },
  store({ y }) {
    return { svg: wall('#fff4e6', y, { wainscot: false }) + Array.from({ length: 5 }, (_, i) => shelfUnit(X0 + 80 + i * 300, y - 240, 260, 3, '#c8433a', [[[0, 30, 40, '#f2b13d'], [40, 30, 40, '#e2553c'], [80, 30, 40, '#3e6db3'], [120, 30, 40, '#7cb342'], [160, 30, 40, '#f2b13d']], [[0, 60, 30, '#e9dcc7'], [70, 60, 30, '#cfe7f6'], [140, 60, 30, '#f6d0b8']], [[10, 40, 44, '#9a6bc0'], [60, 40, 44, '#e2687e'], [110, 40, 44, '#3fa38f']]])).join('') + floor(y, 'tile', '#ecebe6') + grain() + vignette() };
  },
  garage({ y }) {
    const peg = Array.from({ length: 200 }, (_, i) => C(X0 + 200 + (i % 25) * 22, 60 + Math.floor(i / 25) * 22, 2, '#a38a6a')).join('');
    return { svg: wall('#d9d4cc', y, { wainscot: false }) + paper(R(X0 + 190, 50, 560, 180, '#c9ab83', 4)) + peg + paper(Ln(`M${X0 + 260} 90 v60 M${X0 + 340} 80 l30 30 M${X0 + 430} 90 v50`, '#5d5566', 6)) + floor(y, 'concrete', '#a8a49d') + grain() + vignette() };
  },
  shaft() {
    // the same building cutaway the replay scrolls: three storeys stacked around the shaft
    const t = shaftTileSvg();
    return { svg: [-1, 0, 1, 2].map(k => G(t, `transform="translate(${SHAFT_X} ${SHAFT_Y + k * SHAFT_H})"`)).join('') + grain() + vignette(), fx: ['shaft'] };
  },
  restaurantShaft() {
    return { svg: full('#d9cbb4') + Array.from({ length: 30 }, (_, i) => R(X0 + (i % 15) * 100, Y0 + Math.floor(i / 15) * 400 + 40, 80, 300, '#cdbda4', 6)).join('') + R(240, Y0, 300, BLEED[3], '#4f555f') + R(236, Y0, 6, BLEED[3], '#3a3f48') + R(538, Y0, 6, BLEED[3], '#3a3f48') + grain() + vignette(), fx: ['shaft'] };
  },
  building() {
    return { svg: sky('#9fcde9', '#eaf3f6') + R(200, Y0, 400, BLEED[3], '#c9cfd6') + Array.from({ length: 40 }, (_, i) => R(214 + (i % 4) * 96, Y0 + 20 + Math.floor(i / 4) * 90, 84, 70, '#8fb3cf', 3) + R(214 + (i % 4) * 96, Y0 + 20 + Math.floor(i / 4) * 90, 84, 10, '#b7d0e2', 3)).join('') + R(196, Y0, 8, BLEED[3], '#9aa4ae') + R(596, Y0, 8, BLEED[3], '#9aa4ae') + grain(), clouds: [['cloud3', 40, 80, .45], ['cloud6', 700, 140, .4]], fx: ['shaft'] };
  },
  deckSnow({ y }) {
    return { svg: sky('#b5d5ec', '#eef6fb') + hills(y - 40, '#e4eef6', 24, 30, 320) + band(y + 30, Y1, '#fbfdff') + grain(), decor: trees([['treePineSnow', 600, y + 30, 120], ['treePineSnow', 660, y + 30, 90]]), clouds: [['cloud1', 120, 60, .4]], fx: ['snow'] };
  }
};

/* Building cutaway around an elevator shaft: one storey, tiled vertically.
   Tile spans world x −380…1020 (shaft walls at 180 and 460) and is 300 units tall. */
export const SHAFT_X = -380, SHAFT_Y = 137, SHAFT_H = 300, SHAFT_W = 1400;
export function shaftTileSvg() {
  const room = (x0, w, wallC, flip) => {
    const g = `rm${flip ? 'r' : 'l'}`;
    return `<defs>${grad(g, [[0, light(wallC, .12)], [1, shade(wallC, .05)]])}${rgrad(g + 'l', '#fff1c8', .55)}</defs>` + R(x0, 0, w, 270, `url(#${g})`) +
      E(x0 + w / 2, 6, 150, 90, `url(#${g}l)`) + R(x0 + w / 2 - 34, 0, 68, 8, '#f6efe2', 3) +
      paper(R(x0 + (flip ? 60 : w - 200), 92, 96, 176, '#8b5a3a', 4) + R(x0 + (flip ? 68 : w - 192), 100, 80, 168, '#a3704b', 3) + C(x0 + (flip ? 140 : w - 120), 186, 4, '#e9c46a')) +
      paper(R(x0 + (flip ? 220 : 120), 70, 130, 90, '#fffaf1', 4) + R(x0 + (flip ? 228 : 128), 78, 114, 74, '#9fcde9', 2) + R(x0 + (flip ? 228 : 128), 132, 114, 20, '#b7c4d1', 0)) +
      pottedPlant(x0 + (flip ? 420 : 60), 268, 1) + R(x0, 232, w, 36, shade(wallC, .1)) + R(x0, 230, w, 3, light(wallC, .3));
  };
  return R(0, 0, SHAFT_W, SHAFT_H, '#4a505a') +
    room(0, 552, '#e7d2b4', false) + room(848, 552, '#cfdcc9', true) +
    R(552, 0, 296, SHAFT_H, '#3b4049') + R(552, 0, 8, SHAFT_H, '#2c3037') + R(840, 0, 8, SHAFT_H, '#2c3037') +
    R(574, 0, 12, SHAFT_H, '#8f979f') + R(814, 0, 12, SHAFT_H, '#8f979f') + R(576, 0, 3, SHAFT_H, '#c3cad1') + R(816, 0, 3, SHAFT_H, '#c3cad1') +
    R(0, 268, SHAFT_W, 32, '#6b6f76') + R(0, 268, SHAFT_W, 5, '#9aa0a8') +
    Array.from({ length: 10 }, (_, i) => Pth(`M${560 + i * 30} 268 l14 0 l-10 32 l-14 0z`, i % 2 ? '#2b2730' : '#f2b13d')).join('') +
    R(552, 290, 296, 10, '#2c3037');
}

/* Inclines: the backdrop matches the ramp's material/style. */
export function inclineEnv(style) {
  if (style === 'snow') return ENVS.snowfield({ y: 412 });
  if (style === 'grass') return ENVS.park({ y: 412 });
  if (style === 'water') { const e = ENVS.park({ y: 412 }); e.svg += paper(R(-300, 300, 200, 112, '#6fc0e8', 10) + R(720, 320, 200, 92, '#6fc0e8', 10)); return e; }
  if (style === 'city') return ENVS.street({ y: 412 });
  if (style === 'lab') return ENVS.lab({ y: 412 });
  return ENVS.construction({ y: 412, crane: false });     // wood / concrete / metal: loading yard
}
