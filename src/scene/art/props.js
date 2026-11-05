/* Prop library — original cut-paper art for every object kind in the scenario bank.
   Each prop is drawn centred on (0,0) inside the same w × h box the teacher's drawing
   used, so the bottom edge (+h/2) still sits exactly on its surface and the centre of
   mass dot lands where the answer key expects it.
   A prop returns an SVG string, or { svg, people } when Kenney characters ride on it
   (people are placed in the prop's local coordinates). */
import { P, R, C, E, Pth, Ln, Tx, G, paper, block, shade, light, mix } from './kit.js';

/* warm tan/brown hues read as cardboard; anything else is drawn as a painted block */
function cardboard(c) {
  const n = parseInt(c.slice(1).padEnd(6, c.slice(-1)), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return r > b + 30 && r >= g && g > b;
}
const contact = (w, h) => E(0, h / 2 + 1, w * .46, 3.2, '#2a1626', 'opacity=".18"');   // soft contact shadow

/* person spec: pose, char, x/y = foot point (or hand point with `at:'hand'`), height = foot→head */
const who = (pose, x, y, height, o = {}) => ({ pose, x, y, height, char: o.char || 'femalePerson', flip: !!o.flip, at: o.at || 'foot', crop: o.crop, behind: o.behind });

export const PROPS = {
  box(w = 90, h = 60, p = {}) {
    if (p.col && !cardboard(p.col)) return PROPS.labBlock(w, h, p);      // grey/blue/red blocks are painted weights, not cartons
    const col = p.col ? mix(p.col, '#d39f62', .35) : '#d39f62';
    const t = p.txt ? Tx(0, Math.min(8, h * .18), p.txt, Math.min(15, w / 6.5), shade(col, .55), 'letter-spacing="1"') : '';
    return contact(w, h) + paper(
      block(-w / 2, -h / 2, w, h, col, 4) +
      R(-7, -h / 2, 14, h * .42, light(col, .28)) +                    // packing tape
      Ln(`M${-w / 2 + 6} ${-h / 2 + h * .42} H${w / 2 - 6}`, shade(col, .12), 1.4) +
      R(w / 2 - 22, h / 2 - 20, 14, 10, '#fff6e6', 2, 'opacity=".8"') + t);
  },
  crateS(w = 110, h = 90, p = {}) {
    const col = p.col ? mix(p.col, P.wood, .4) : P.wood, d = shade(col, .28);
    const planks = Array.from({ length: 3 }, (_, i) => Ln(`M${-w / 2 + 4} ${-h / 2 + (i + 1) * h / 4} H${w / 2 - 4}`, shade(col, .14), 1.5)).join('');
    return contact(w, h) + paper(
      block(-w / 2, -h / 2, w, h, col, 3) + planks +
      Ln(`M${-w / 2 + 9} ${h / 2 - 9} L${w / 2 - 9} ${-h / 2 + 9}`, d, 7) +
      R(-w / 2, -h / 2, 9, h, d, 2) + R(w / 2 - 9, -h / 2, 9, h, d, 2) +
      C(-w / 2 + 4.5, -h / 2 + 6, 1.6, light(col, .4)) + C(w / 2 - 4.5, h / 2 - 6, 1.6, light(col, .4)));
  },
  microwave(w = 110, h = 64) {
    return contact(w, h) + paper(
      block(-55, -32, 110, 64, '#eae3d6', 7) +
      R(-47, -24, 68, 46, '#2f2a35', 5) + Pth('M-44 -21 h26 l-18 40 h-8z', '#ffffff', 'opacity=".12"') +
      R(-26, -6, 22, 12, '#5a5160', 3, 'opacity=".6"') +                 // the turntable glow
      R(26, -24, 22, 46, '#d7cfbf', 4) + R(29, -21, 16, 8, '#2f2a35', 2) + Tx(37, -14.5, '1:30', 6, '#7ee08a') +
      C(37, -2, 3.2, '#9c9283') + C(37, 8, 3.2, '#9c9283') + R(31, 14, 12, 4, P.red, 2));
  },
  aquarium(w = 150, h = 96) {
    return contact(w, h) + paper(
      R(-75, -48, 150, 96, '#cfe9f5', 6, 'opacity=".55"') +
      R(-72, -36, 144, 80, '#5fb0d8', 3, 'opacity=".85"') + R(-72, -36, 144, 10, '#8ccbe8', 3) +
      R(-72, 32, 144, 12, '#c9a679', 2) + [-60, -46, -30, 20, 40, 58].map((x, i) => C(x, 34 + (i % 2) * 3, 3 + (i % 3), mix('#a07a52', '#e6cfa6', i / 6))).join('') +
      Ln('M-50 32 q-6 -22 4 -40 M-44 32 q8 -18 0 -32', '#3f9a52', 4) + Ln('M52 32 q-8 -16 2 -30', '#4caf5b', 4) +
      Pth('M-26 -6 q12 -10 24 0 q-12 10 -24 0z M-26 -6 l-8 -6 v12z', '#ff9a3c') + C(-6, -7, 1.6, P.ink) +
      Pth('M18 12 q10 -8 20 0 q-10 8 -20 0z M18 12 l-7 -5 v10z', '#f6c945') + C(34, 11, 1.4, P.ink) +
      C(10, -20, 2.5, '#fff', 'opacity=".7"') + C(14, -28, 1.6, '#fff', 'opacity=".7"') +
      R(-76, -50, 152, 6, '#3c3742', 3) + R(-76, 44, 152, 5, '#3c3742', 2) + R(-70, -30, 4, 60, '#fff', 2, 'opacity=".35"'));
  },
  cat(w = 96, h = 44) {
    const fur = '#8c8a93', d = shade(fur, .2);
    return contact(w, h) + paper(
      Pth('M-44 22 Q-50 -6 -14 -13 Q30 -20 42 8 Q44 22 30 22Z', fur) +
      Pth('M-36 20 Q-38 0 -12 -6 Q20 -10 30 10 Q30 20 22 20Z', light(fur, .25)) +
      Ln('M-30 -6 q6 10 0 22 M-14 -10 q6 12 0 28 M2 -11 q5 12 0 30', d, 3, 'opacity=".55"') +
      Ln('M-46 18 q-12 -2 -6 -18 q6 -8 14 -2', fur, 7) +
      C(32, -6, 15, fur) + Pth('M21 -15 l3 -14 l10 9z M37 -19 l9 -11 l2 15z', fur) + Pth('M24 -18 l2 -7 l5 5z', P.pink, 'opacity=".7"') +
      Ln('M25 -6 q3 2 6 0 M35 -6 q3 2 6 0', P.ink, 1.6) + C(33, -1, 1.6, P.pink) +
      Tx(52, -24, 'z', 10, P.plum, 'opacity=".7"') + Tx(60, -34, 'z', 7, P.plum, 'opacity=".5"'));
  },
  backpack(w = 64, h = 80) {
    const c = P.blue;
    return contact(w, h) + paper(
      Ln('M-14 -38 q14 -16 28 0', shade(c, .3), 5) +
      block(-32, -40, 64, 80, c, 18) + R(-22, 2, 44, 32, shade(c, .12), 9) + R(-22, 2, 44, 6, light(c, .2), 4) +
      Ln('M-18 10 H18', '#e9e2d4', 2) + R(-4, 7, 8, 7, '#e9b33f', 2) +
      R(-26, -30, 6, 34, light(c, .15), 3) + R(20, -30, 6, 34, light(c, .15), 3));
  },
  ball(w = 52, h = 52, p = {}) {
    const r = w / 2, col = p.col || '#e9773a';
    return contact(w, h) + paper(C(0, 0, r, col) + C(-r * .3, -r * .32, r * .45, light(col, .3), 'opacity=".55"') +
      Ln(`M${-r} 0 H${r} M0 ${-r} V${r} M${-r * .72} ${-r * .7} Q0 0 ${-r * .72} ${r * .7} M${r * .72} ${-r * .7} Q0 0 ${r * .72} ${r * .7}`, shade(col, .45), 1.6) +
      Pth(`M0 ${-r} A${r} ${r} 0 0 1 ${r} 0 A${r} ${r} 0 0 1 0 ${r}`, 'none', `stroke="${shade(col, .25)}" stroke-width="0" `));
  },
  speaker(w = 66, h = 104) {
    return contact(w, h) + paper(block(-33, -52, 66, 104, '#2f2a35', 6) +
      C(0, -24, 15, '#47404f') + C(0, -24, 9, '#5d5566') + C(0, -24, 3.5, '#1d1a21') +
      C(0, 18, 23, '#47404f') + C(0, 18, 15, '#5d5566') + C(0, 18, 5, '#1d1a21') + C(-6, 12, 4, '#ffffff', 'opacity=".12"') +
      R(-24, 44, 48, 4, P.red, 2));
  },
  chandelier(w = 110, h = 70) {
    const brass = '#c99a33';
    const arms = [-50, -25, 0, 25, 50].map((x, i) => {
      const y = (i % 2 ? 8 : -6) - 22;
      return E(x, y + 14, 7, 3, shade(brass, .1)) + R(x - 3, y - 2, 6, 16, '#fbf3df', 2) + E(x, y - 8, 4, 6, '#ffd35c') + E(x, y - 8, 9, 11, '#ffd35c', 'opacity=".25"');
    }).join('');
    return paper(Ln('M-50 0 Q0 42 50 0', brass, 4.5) + Ln('M-30 -18 Q0 20 30 -18', brass, 3.5) + Ln('M0 -35 V14', brass, 3) + arms +
      [-34, -12, 12, 34].map(x => Pth(`M${x} ${14 - Math.abs(x) / 4} l-4 8 l4 8 l4 -8z`, '#e8f6ff', 'opacity=".9"')).join('') + C(0, 14, 8, brass) + C(-2, 12, 3, light(brass, .5)));
  },
  punchbag(w = 52, h = 120) {
    const c = '#c8433a';
    return paper(Ln('M-14 -60 L0 -72 L14 -60', '#6a6470', 2.5) + block(-26, -60, 52, 120, c, 20) + R(-20, -56, 8, 104, light(c, .25), 4, 'opacity=".7"') +
      R(-26, -42, 52, 7, shade(c, .3)) + R(-26, 34, 52, 7, shade(c, .3)) + Tx(2, 6, 'GYM', 11, '#f6e7d4', 'transform="rotate(-90 2 3)"'));
  },
  piano(w = 140, h = 110) {
    const c = '#3b2a26';
    return contact(w, h) + paper(block(-70, -55, 140, 102, c, 5) + R(-62, -48, 124, 34, shade(c, .2), 3) + R(-40, -42, 80, 20, '#5a4038', 2) +
      R(-66, -6, 132, 16, '#f7f1e6', 2) + Array.from({ length: 11 }, (_, i) => R(-60 + i * 11.5, -6, 6, 9, '#211a1a', 1)).join('') +
      R(-70, 10, 140, 6, light(c, .15)) + R(-66, 40, 10, 15, c) + R(56, 40, 10, 15, c) + C(-8, 34, 3, '#d9b04a') + C(8, 34, 3, '#d9b04a'));
  },
  feeder(w = 56, h = 64) {
    return paper(Pth('M-32 -10 L0 -33 L32 -10Z', '#c4473a') + Pth('M-32 -10 L0 -33 L0 -26 L-26 -8Z', light('#c4473a', .2)) +
      R(-22, -10, 44, 42, '#f2e3c4', 2) + R(-12, 2, 24, 18, '#3b2a20', 9) + Array.from({ length: 6 }, (_, i) => C(-8 + (i % 3) * 8, 15 - Math.floor(i / 3) * 5, 2, '#e9c46a')).join('') +
      R(-26, 30, 52, 4, P.woodD, 2) + R(-1.5, 30, 3, 9, P.woodD));
  },
  hanger(w = 44, h = 120, p = {}) {
    const harness = p.col || '#e64980';
    return { svg: paper(Ln('M-10 -6 L0 -20 L10 -6', harness, 4) + R(-12, 10, 24, 7, harness, 3)), people: [who('hang', 0, -h / 2, 128, { at: 'hand', char: p.char || 'femaleAdventurer' })] };
  },
  elevcar(w = 120, h = 140) {
    return paper(block(-60, -70, 120, 140, '#c9c2b6', 4) + R(-52, -62, 49, 124, '#b0a89a', 2) + R(3, -62, 49, 124, '#b0a89a', 2) +
      R(-3, -62, 6, 124, '#8c8476') + R(-46, -54, 37, 10, '#d9d2c6', 2) + R(9, -54, 37, 10, '#d9d2c6', 2) +
      R(-10, -84, 20, 14, '#5b5560', 3) + C(0, -76, 4, '#9aa4ae') + R(-60, 62, 120, 8, '#6f6878', 2));
  },
  beam(w = 240, h = 28) {
    const c = '#d1592f';
    return contact(w, h) + paper(R(-120, -14, 240, 28, c) + R(-120, -14, 240, 6, shade(c, .3)) + R(-120, 8, 240, 6, shade(c, .3)) +
      Array.from({ length: 9 }, (_, i) => C(-104 + i * 26, -11, 1.5, light(c, .4)) + C(-104 + i * 26, 11, 1.5, light(c, .4))).join('') + R(-120, -2, 240, 3, light(c, .2)));
  },
  bucket(w = 64, h = 62, p = {}) {
    const c = p.col ? mix(p.col, '#9aa4ae', .3) : '#9aa4ae';
    return paper(Ln('M-28 -20 Q0 -56 28 -20', '#4b4652', 3) + Pth('M-32 -20 L32 -20 L24 31 L-24 31 Z', c) +
      Pth('M-32 -20 L-14 -20 L-10 31 L-24 31Z', light(c, .3), 'opacity=".7"') + Pth('M16 -20 L32 -20 L24 31 L12 31Z', shade(c, .15)) +
      R(-33, -22, 66, 6, shade(c, .2), 3) + R(-28, 6, 56, 4, shade(c, .12), 2) + C(-30, -18, 3, '#4b4652') + C(30, -18, 3, '#4b4652'));
  },
  filter(w = 80, h = 28) {
    return paper(Pth('M-40 -14 L40 -14 L28 14 L-28 14Z', '#fbf3df') + Array.from({ length: 8 }, (_, i) => Ln(`M${-36 + i * 10.3} -13 L${-26 + i * 7.4} 13`, '#e8dcc3', 1.6)).join('') + R(-40, -15, 80, 3, '#efe2c7', 1.5));
  },
  hail(w = 30, h = 30) {
    return paper(C(0, 0, 15, '#e3f2fb') + C(0, 0, 11, '#cfe7f6') + C(-5, -5, 4.5, '#fff') + C(4, 5, 2, '#fff', 'opacity=".7"'));
  },
  chute(w = 200, h = 180) {
    const cols = ['#e2553c', '#f2b13d', '#e2553c', '#f2b13d', '#e2553c'];
    const panels = cols.map((c, i) => { const x0 = -100 + i * 40; return Pth(`M${x0} -40 Q${x0 + 20} ${-120 + Math.abs(i - 2) * 12} ${x0 + 40} -40 Q${x0 + 20} -52 ${x0} -40Z`, c); }).join('');
    return { svg: paper(Pth('M-100 -40 Q0 -140 100 -40 Q50 -58 0 -50 Q-50 -58 -100 -40Z', '#e2553c') + panels +
      Ln('M-100 -40 L-6 34 M100 -40 L6 34 M-40 -52 L-3 34 M40 -52 L3 34 M0 -50 V34', '#5a5360', 1)), people: [who('hang', 2, 32, 74, { at: 'hand', char: 'maleAdventurer' })] };
  },
  slider(w = 210, h = 60) {
    return { svg: E(78 * 1.5 - 20, 16, 52, 13, '#e3b88f', 'opacity=".7"') + E(110, 4, 28, 14, '#e3b88f', 'opacity=".5"') + E(-20, 21, 90, 4, '#2a1626', 'opacity=".15"'),
      people: [who('slide', 6, 22, 92, { char: 'maleAdventurer', flip: true })] };
  },
  glass(w = 34, h = 54) {
    return contact(w, h) + paper(Pth('M-17 -27 L17 -27 L13 27 L-13 27Z', '#e9f6fb', 'opacity=".7"') + Pth('M-15 -10 L15 -10 L13 25 L-13 25Z', '#f6d24a') +
      Pth('M-15 -10 L-6 -10 L-5 25 L-13 25Z', '#fff', 'opacity=".35"') + R(3, -40, 3.5, 34, P.pink, 1.5) + C(-6, 2, 2.2, '#fff8', '') + C(5, 12, 1.6, '#fff', 'opacity=".7"') +
      Pth('M-17 -27 L17 -27 L13 27 L-13 27Z', 'none', `stroke="#9fb1bd" stroke-width="1.6"`) + Pth('M-19 -26 a6 6 0 0 1 10 -5 l-2 5z', '#f6d24a'));
  },
  disk(w = 44, h = 14) {
    return contact(w, h) + paper(R(-22, -7, 44, 14, '#cc3f33', 6) + R(-16, -7, 32, 4, light('#cc3f33', .3), 2) + R(-22, 3, 44, 4, shade('#cc3f33', .25), 2));
  },
  book(w = 120, h = 26, p = {}) {
    const c = p.col || P.green;
    return contact(w, h) + paper(R(-w / 2, -h / 2, w, h, c, 3) + R(-w / 2 + 6, -h / 2 + 4, w - 8, h - 8, '#f8f0de', 1.5) +
      Array.from({ length: Math.max(1, Math.floor(h / 6) - 1) }, (_, i) => Ln(`M${-w / 2 + 8} ${-h / 2 + 7 + i * 4} H${w / 2 - 4}`, '#e2d5bc', .9)).join('') +
      R(-w / 2, -h / 2, 7, h, shade(c, .2), 2) + R(-w / 2 + 14, -h / 2, 10, 3, light(c, .4), 1));
  },
  duck(w = 64, h = 52) {
    const y = '#f6c83a';
    return paper(Pth('M-30 6 Q-30 26 0 26 Q30 26 30 6 Q20 -4 0 0 Q-20 -4 -30 6Z', y) + Pth('M-22 8 Q-8 2 6 10 Q-6 18 -22 8z', shade(y, .12)) +
      C(16, -12, 13, y) + Pth('M27 -12 l13 3 l-13 5z', '#f08a2c') + C(19, -15, 2.3, P.ink) + C(12, -18, 3.5, '#fff', 'opacity=".5"') + Pth('M-30 6 l-6 -10 l10 4z', y));
  },
  log(w = 220, h = 40) {
    const b = '#8a5a34';
    return paper(R(-110, -20, 220, 40, b, 20) + R(-104, -18, 200, 8, light(b, .18), 4) + Ln('M-80 -6 h46 M-20 7 h64 M50 -8 h30 M-96 6 h22', shade(b, .25), 2.2) +
      E(105, 0, 11, 20, '#e2b077') + E(105, 0, 7, 13, '#d29b5f') + E(105, 0, 3, 6, '#c08550') + C(-40, 14, 3, shade(b, .3)));
  },
  canoe(w = 260, h = 50) {
    const c = '#e2733c';
    return { svg: paper(Ln('M-36 -46 L44 14', P.woodD, 4) + E(46, 16, 10, 5, P.woodD)) + paper(Pth('M-130 0 Q-90 26 0 26 Q90 26 130 0 Z', c) + Pth('M-130 0 Q-90 12 0 12 Q90 12 130 0 Z', light(c, .2)) +
      R(-130, -3, 260, 5, shade(c, .3), 2)), people: [who('duck', -2, 6, 60, { char: 'malePerson', crop: 'waist', behind: true })] };
  },
  wballoon(w = 130, h = 140) {
    return paper(C(0, -5, 64, '#f6f2ea') + C(-22, -28, 22, '#fff', 'opacity=".75"') + Pth('M-64 -5 A64 64 0 0 0 64 -5 A64 50 0 0 1 -64 -5z', '#e5ded1', 'opacity=".7"') +
      Pth('M-8 58 L0 70 L8 58Z', '#d5cdbf') + R(-12, 62, 24, 10, '#7b7484', 2) + R(-8, 64, 6, 3, '#e2553c', 1));
  },
  pballoon(w = 96, h = 116, p = {}) {
    const c = p.col || P.plum;
    return paper(E(0, -4, 46, 54, c) + E(14, 10, 26, 34, shade(c, .12), 'opacity=".6"') + E(-18, -26, 10, 18, '#fff', 'opacity=".4" transform="rotate(20 -18 -26)"') + Pth('M-6 54 L0 47 L6 54Z', shade(c, .1)));
  },
  labmass(w = 40, h = 56) {
    const b = '#c0a35a';
    return contact(w, h) + paper(Ln('M0 -20 V-30 q0 -6 6 -6', '#5d5566', 3) + block(-20, -20, 40, 48, b, 4) + R(-20, -6, 40, 3, shade(b, .25)) + R(-20, 8, 40, 3, shade(b, .25)) + R(-15, -16, 6, 40, light(b, .35), 2, 'opacity=".7"'));
  },
  suitcase(w = 96, h = 66) {
    const c = '#3a5aa8';
    return contact(w, h) + paper(Ln('M-14 -28 V-36 H14 V-28', '#2b2130', 4) + block(-48, -28, 96, 62, c, 9) +
      Ln('M-28 -22 V28 M0 -22 V28 M28 -22 V28', light(c, .18), 3) + R(-48, -4, 96, 5, shade(c, .25)) + R(-40, -24, 18, 4, light(c, .4), 2) + R(30, 24, 10, 6, '#e2b33f', 2));
  },
  apples(w = 64, h = 72) {
    return paper(Pth('M-30 -26 L30 -26 L26 36 L-26 36Z', '#ecd7ae') + Pth('M-30 -26 L-14 -26 L-12 36 L-26 36Z', light('#ecd7ae', .3)) +
      C(-12, 14, 10.5, '#d9433a') + C(10, 18, 10.5, '#c93a33') + C(0, -2, 10.5, '#e2553c') + C(-14, -12, 9.5, '#7cb342') + C(14, -10, 9, '#d9433a') +
      [[-12, 14], [10, 18], [0, -2], [14, -10]].map(([x, y]) => C(x - 3, y - 3, 2.6, '#fff', 'opacity=".45"')).join('') + R(-31, -28, 62, 5, '#d7bd8c', 2));
  },
  truck(w = 220, h = 96) {
    const body = '#f4efe6', cab = '#3e6db3';
    return contact(w, h) + paper(block(-110, -48, 140, 84, body, 6) + R(-104, -42, 128, 7, '#ffffff', 3) + Tx(-40, 2, 'DELIVERY', 14, P.plum, 'letter-spacing="1.5"') + R(-96, 10, 112, 4, P.red, 2) +
      Pth('M30 -24 H76 L108 6 V36 H30Z', cab) + Pth('M44 -16 H72 L92 4 H44Z', '#cfe8f6') + R(30, 20, 78, 16, shade(cab, .25), 3) + R(96, 12, 12, 7, '#ffd65a', 2) +
      C(-70, 36, 15, '#2b2730') + C(-70, 36, 6, '#b8bfc6') + C(70, 36, 15, '#2b2730') + C(70, 36, 6, '#b8bfc6'));
  },
  brick(w = 70, h = 30) {
    const c = '#b8452e';
    return contact(w, h) + paper(block(-35, -15, 70, 30, c, 3) + C(-14, 0, 4.5, shade(c, .35)) + C(14, 0, 4.5, shade(c, .35)) + Array.from({ length: 6 }, (_, i) => C(-28 + i * 11, i % 2 ? 8 : -8, 1, light(c, .3))).join(''));
  },
  boarder(w = 90, h = 116, p = {}) {
    return { svg: paper(R(-46, h / 2 - 9, 92, 8, p.col || P.teal, 4) + R(-40, h / 2 - 8, 80, 2.5, light(p.col || P.teal, .4), 1)), people: [who('wide', 0, h / 2 - 7, 108, { char: 'maleAdventurer' })] };
  },
  cooler(w = 96, h = 56) {
    const c = '#2f74b5';
    return contact(w, h) + paper(block(-48, -28, 96, 56, c, 7) + R(-48, -28, 96, 15, '#f4efe6', 6) + R(-12, -34, 24, 7, '#4b4652', 3) + R(-40, 8, 80, 4, light(c, .25), 2) + R(-6, -12, 12, 6, '#d5cdbf', 2));
  },
  rock(w = 100, h = 64) {
    const c = '#8f8a8c';
    return contact(w, h) + paper(Pth('M-50 32 L-44 -6 L-14 -30 L22 -26 L48 0 L50 32Z', c) + Pth('M-44 -6 L-14 -30 L4 -10 L-20 8Z', light(c, .2)) + Pth('M22 -26 L48 0 L50 32 L20 32 L28 2Z', shade(c, .18)) +
      Ln('M-20 8 L4 -10 L28 2', shade(c, .3), 1.6) + C(-30, 18, 3, '#6aa04f') + C(-24, 22, 2.5, '#7cb357'));
  },
  rider(w = 90, h = 56, p = {}) {
    return { svg: paper(R(-46, 24, 92, 6, '#c9a26a', 2) + R(-46, 24, 92, 2, light('#c9a26a', .3), 1)), people: [who('duck', 0, 26, 56, { char: 'femalePerson' })] };
  },
  toboggan(w = 150, h = 60) {
    const c = '#b97a45';
    return { svg: paper(Ln('M-72 26 H66 q12 0 12 -16 q0 -8 -8 -8', shade(c, .2), 6) + R(-72, 17, 140, 9, c, 3) + R(-72, 17, 140, 3, light(c, .3), 1.5)),
      people: [who('duck', -38, 22, 46, { char: 'femalePerson' }), who('duck', 6, 22, 50, { char: 'malePerson' })] };
  },
  sledKid(w = 140, h = 76) {
    const c = '#c8433a';
    return { svg: paper(Ln('M-60 36 H70 q14 0 16 -14', '#6e3326', 5) + Ln('M-44 30 V36 M50 30 V36', '#6e3326', 4) + R(-58, 14, 130, 16, c, 5) + R(-58, 14, 130, 4, light(c, .3), 2)),
      people: [who('duck', 0, 20, 66, { char: 'femalePerson' })] };
  },
  penguin(w = 90, h = 36) {
    return paper(E(0, 2, 44, 16, '#2b2733') + E(5, 8, 34, 9, '#f8f4ec') + C(-38, -4, 10.5, '#2b2733') + Pth('M-48 -4 l-9 3 l9 3z', '#f08a2c') + C(-40, -7, 2, '#fff') + C(-40, -7, 1, P.ink) +
      Pth('M30 -6 l18 -6 l-8 10z', '#2b2733') + Pth('M38 12 l10 2 l-10 3z M30 14 l8 3 l-9 2z', '#f08a2c'));
  },
  puck(w = 50, h = 18) {
    return contact(w, h) + paper(R(-25, -9, 50, 18, '#1d1a21', 6) + R(-23, -9, 46, 5, '#3c3742', 3) + Ln('M-16 1 H16', '#4c4752', 1.2));
  },
  cart(w = 100, h = 40, p = {}) {
    const c = p.col || P.blue;
    return contact(w, h) + paper(block(-w / 2, -20, w, 28, c, 6) + R(-w / 2 + 8, -14, w - 16, 4, light(c, .35), 2) + R(-w / 2 + 6, -2, 10, 6, '#e2b33f', 2) +
      C(-w / 2 + 18, 12, 8, '#2b2730') + C(-w / 2 + 18, 12, 3, '#b8bfc6') + C(w / 2 - 18, 12, 8, '#2b2730') + C(w / 2 - 18, 12, 3, '#b8bfc6'));
  },
  coaster(w = 150, h = 76) {
    const c = '#d9433a';
    return { svg: paper(Pth('M-70 26 V-10 Q-70 -24 -54 -24 H60 Q72 -24 72 -10 V26Z', c) + R(-66, -20, 134, 6, light(c, .3), 3) + Tx(0, 12, '7', 16, '#ffe9a8') +
      C(-44, 32, 8.5, '#4b4652') + C(-44, 32, 3.5, '#c9d0d6') + C(44, 32, 8.5, '#4b4652') + C(44, 32, 3.5, '#c9d0d6')),
      people: [who('cheer0', -30, -8, 54, { char: 'femaleAdventurer', crop: 'waist', behind: true }), who('cheer1', 20, -8, 54, { char: 'malePerson', crop: 'waist', behind: true })] };
  },
  skater(w = 80, h = 120) {
    return { svg: paper(R(-38, 47, 76, 6, '#8a5a34', 3) + R(-38, 47, 76, 2, light('#8a5a34', .35), 1) + C(-24, 57, 5, '#2b2730') + C(24, 57, 5, '#2b2730')),
      people: [who('wide', 0, 48, 110, { char: 'malePerson' })] };
  },
  kayak(w = 220, h = 32) {
    const c = '#f0b13a';
    return contact(w, h) + paper(Pth('M-110 4 Q0 30 110 4 Q0 -14 -110 4Z', c) + Pth('M-110 4 Q0 12 110 4 Q0 -14 -110 4Z', light(c, .25)) + E(0, 2, 22, 5, '#4b4652') + Ln('M-90 6 Q0 20 90 6', shade(c, .25), 1.5));
  },
  tarp(w = 130, h = 52) {
    const leaves = ['#d9622e', '#e9a23a', '#b8422e', '#c7883a', '#8f9a3a'];
    return contact(w, h) + paper(R(-65, 18, 130, 8, '#2f74b5', 3) + Pth('M-60 20 Q-40 -26 0 -24 Q40 -26 60 20Z', '#a3632e') +
      Array.from({ length: 16 }, (_, i) => { const x = -44 + (i * 37) % 88, y = 12 - ((i * 23) % 30); return E(x, y, 7, 4, leaves[i % 5], `transform="rotate(${i * 47} ${x} ${y})"`); }).join(''));
  },
  vacuum(w = 80, h = 40) {
    const c = '#7a4f9e';
    return contact(w, h) + paper(block(-40, -12, 80, 24, c, 10) + R(-36, -8, 30, 5, light(c, .35), 2) + R(-36, 8, 72, 6, '#3c3742', 2) + C(-26, 16, 6, '#2b2730') + C(26, 16, 6, '#2b2730') + C(18, -2, 5, '#e2b33f'));
  },
  broom(w = 120, h = 24) {
    return contact(w, h) + paper(R(-60, -12, 120, 12, P.woodD, 3) + R(-60, -12, 120, 4, light(P.woodD, .3), 2) + R(-58, 0, 116, 12, '#4b4652', 1) +
      Array.from({ length: 23 }, (_, i) => Ln(`M${-56 + i * 5} 2 V12`, '#6f6878', 1.2)).join(''));
  },
  stroller(w = 90, h = 90) {
    const c = '#2f8a6e';
    return contact(w, h) + paper(Pth('M-40 -40 Q-40 4 0 4 H36 V-16 Q36 -40 -40 -40Z', c) + Pth('M-40 -40 Q-36 -14 -10 -10 L-10 -40Z', light(c, .2)) +
      R(-40, 4, 76, 10, shade(c, .35), 3) + Ln('M-30 14 L-30 20 M28 14 L28 20', '#2b2730', 3) + C(-30, 30, 12, '#2b2730') + C(-30, 30, 5, '#c9d0d6') + C(28, 30, 12, '#2b2730') + C(28, 30, 5, '#c9d0d6'));
  },
  shovel(w = 96, h = 40) {
    return contact(w, h) + paper(Pth('M-48 18 L44 18 L48 -2 L-44 -2Z', '#4b5a6b') + Pth('M-48 18 L44 18 L46 12 L-46 12Z', shade('#4b5a6b', .2)) +
      Pth('M-44 -2 Q-24 -32 6 -21 Q34 -26 44 -2Z', '#fbfdff') + C(-14, -14, 6, '#e8f0f7') + C(14, -12, 5, '#e8f0f7'));
  },
  sign(w = 130, h = 60, p = {}) {
    const c = '#2f7a55';
    return paper(C(-46, -30, 3, '#5d5566') + C(46, -30, 3, '#5d5566') + block(-65, -30, 130, 60, c, 8) + R(-58, -23, 116, 46, light(c, .08), 5, `stroke="${light(c, .45)}" stroke-width="1.5" stroke-dasharray="4 3"`) + Tx(0, 9, p.txt || 'OPEN', 23, '#fff6e6', 'letter-spacing="2"'));
  },
  pinata(w = 96, h = 80) {
    const cols = ['#e2687e', '#f2b13d', '#3fa38f', '#7a4f9e', '#e2553c'];
    return paper(Pth('M0 -40 L12 -12 L44 -12 L18 6 L28 38 L0 18 L-28 38 L-18 6 L-44 -12 L-12 -12Z', '#e2687e') +
      [0, 1, 2, 3, 4].map(i => Pth(`M${-30 + i * 12} ${-8 + (i % 2) * 6} l12 0 l-2 8 l-12 0z`, cols[i], 'opacity=".9"')).join('') + C(0, 0, 8, '#f2c63d') + C(-2, -2, 3, '#fff', 'opacity=".5"'));
  },
  basket(w = 86, h = 70) {
    return paper(Ln('M-36 28 Q-42 50 -30 62 M30 28 Q42 52 26 62', '#4f9a52', 4) + Pth('M-40 -6 L40 -6 L30 30 L-30 30Z', '#b9834e') +
      Ln('M-36 4 H36 M-33 14 H33 M-31 24 H31', shade('#b9834e', .25), 1.6) + C(-20, -14, 12, '#e2687e') + C(4, -18, 13, '#f0943a') + C(24, -12, 11, '#9a6bc0') + C(-6, -24, 7, '#f6d24a') + C(-20, -14, 4, '#f6d24a') + C(4, -18, 4, '#fff1b0'));
  },
  spotlight(w = 72, h = 72) {
    return paper(R(-6, -36, 12, 12, '#3c3742', 2) + block(-30, -26, 60, 52, '#2f2a35', 10) + Pth('M30 -18 L44 -24 L44 24 L30 18Z', '#47404f') + E(44, 0, 8, 22, '#fff3bf') + E(44, 0, 5, 15, '#fffbe6') + R(-24, -18, 20, 4, '#5d5566', 2));
  },
  swingkid(w = 60, h = 76) {
    return { svg: paper(R(-30, 26, 60, 8, P.woodD, 3) + R(-30, 26, 60, 2.5, light(P.woodD, .3), 1)), people: [who('duck', 0, 30, 62, { char: 'femalePerson' })] };
  },
  tv(w = 180, h = 110) {
    return contact(w, h) + paper(R(-30, 49, 60, 6, '#3c3742', 2) + R(-6, 40, 12, 12, '#3c3742') + block(-90, -55, 180, 100, '#232027', 7) + R(-82, -47, 164, 84, '#36588f', 3) +
      Pth('M-82 -47 h70 l-40 84 h-30z', '#fff', 'opacity=".08"') + C(-30, -10, 14, '#f2b13d', 'opacity=".9"') + Pth('M-82 37 Q-30 0 20 20 T82 10 V37Z', '#3f9a6e', 'opacity=".8"'));
  },
  tvstand(w = 220, h = 70) {
    const c = '#7b4f33';
    return contact(w, h) + paper(block(-110, -35, 220, 70, c, 5) + R(-100, -25, 95, 50, light(c, .12), 3) + R(5, -25, 95, 50, light(c, .12), 3) + C(-12, 0, 3, '#e2b33f') + C(12, 0, 3, '#e2b33f') + R(-104, 31, 12, 6, shade(c, .3)) + R(92, 31, 12, 6, shade(c, .3)));
  },
  person(w = 50, h = 170, p = {}) {
    return { svg: '', people: [who('idle', 0, 85, 168, { char: p.char || (p.col === '#e64980' ? 'femalePerson' : 'malePerson') })] };
  },
  bscale(w = 110, h = 18) {
    return contact(w, h) + paper(R(-55, -9, 110, 18, '#f4efe6', 7) + R(-55, 3, 110, 6, '#d9d2c6', 4) + R(-15, -6, 30, 10, '#2b2730', 2) + Tx(0, 1.5, '600', 7, '#7ee08a'));
  },
  cushion(w = 150, h = 24) {
    const c = '#d9577a';
    return contact(w, h) + paper(R(-75, -12, 150, 24, c, 12) + R(-66, -10, 132, 6, light(c, .3), 3) + C(-30, 0, 2.5, shade(c, .3)) + C(30, 0, 2.5, shade(c, .3)));
  },
  bowl(w = 110, h = 50) {
    return contact(w, h) + paper(C(-24, -12, 12, '#f2b13d') + C(0, -16, 13, '#e2553c') + C(22, -12, 12, '#6fb24f') + C(-6, -24, 8, '#9a6bc0') + C(-3, -19, 3, '#fff', 'opacity=".5"') +
      Pth('M-55 -6 Q-50 25 0 25 Q50 25 55 -6Z', '#f4efe6') + Pth('M-55 -6 Q-50 25 0 25 Q-30 18 -42 -6Z', '#fff', 'opacity=".6"') + R(-56, -8, 112, 4, '#d9d2c6', 2));
  },
  board(w = 200, h = 16) {
    return contact(w, h) + paper(R(-100, -8, 200, 16, '#d8a467', 5) + R(-96, -8, 192, 4, light('#d8a467', .3), 2) + C(86, 0, 3.5, shade('#d8a467', .4)));
  },
  laptop(w = 130, h = 12) {
    return contact(w, h) + paper(R(-65, -6, 130, 12, '#b9c0c7', 4) + R(-62, -6, 124, 4, '#dfe4e8', 2) + C(0, 0, 2, '#8f979f'));
  },
  desk(w = 150, h = 96, p = {}) {
    return contact(w, h) + paper(R(-75, -48, 150, 14, P.wood, 3) + R(-70, -34, 12, 82, p.col || '#9aa4ae') + R(58, -34, 12, 82, p.col || '#9aa4ae') + R(-58, -30, 60, 40, P.woodD, 2));
  },
  shopcart(w = 110, h = 90) {
    const m = '#9aa4ae';
    return contact(w, h) + paper(Pth('M-50 -40 L50 -40 L40 20 L-40 20Z', '#e6ebef', 'opacity=".6"') + Pth('M-50 -40 L50 -40 L40 20 L-40 20Z', 'none', `stroke="${m}" stroke-width="3"`) +
      Array.from({ length: 6 }, (_, i) => Ln(`M${-40 + i * 16} -38 L${-34 + i * 14} 18`, m, 1.4)).join('') + Ln('M-46 -20 H46 M-43 0 H43', m, 1.4) +
      Ln('M-40 20 L-40 28 H40 V20', '#6f7883', 3) + R(-54, -44, 8, 6, P.red, 2) + C(-32, 36, 9, '#2b2730') + C(32, 36, 9, '#2b2730'));
  },
  lcart(w = 150, h = 70) {
    return contact(w, h) + paper(R(-75, 10, 150, 10, '#5d5566', 3) + block(-60, -35, 60, 45, '#3a5aa8', 6) + Ln('M-44 -35 V-42 H-16 V-35', '#2b2130', 3) + block(6, -25, 54, 35, '#e2733c', 6) +
      C(-56, 28, 8, '#2b2730') + C(56, 28, 8, '#2b2730'));
  },
  wagon(w = 110, h = 52, p = {}) {
    const c = p.col ? mix(p.col, '#d9433a', .3) : '#d9433a';
    return contact(w, h) + paper(R(-46, -28, 30, 16, '#f2c63d', 3) + R(-10, -30, 26, 18, '#4f9ad6', 3) + C(28, -20, 9, '#7a4f9e') +
      block(-55, -14, 110, 28, c, 4) + R(-55, -6, 110, 3, light(c, .3)) + C(-36, 20, 11, '#2b2730') + C(-36, 20, 4.5, '#c9d0d6') + C(36, 20, 11, '#2b2730') + C(36, 20, 4.5, '#c9d0d6'));
  },
  platform(w = 260, h = 16) {
    return paper(R(-130, -8, 260, 16, '#8f979f', 2) + R(-130, -8, 260, 4, '#c3cad1', 2) + Array.from({ length: 12 }, (_, i) => C(-120 + i * 22, 3, 1.5, '#5d6670')).join(''));
  },
  dumbwaiter(w = 240, h = 130) {
    return paper(R(-120, -65, 240, 130, '#e9e3d8', 4) + R(-112, -57, 224, 114, '#f6f1e8', 2) + R(-120, 55, 240, 10, '#8f979f', 2) + R(-120, -65, 240, 8, '#8f979f', 2));
  },
  tire(w = 110, h = 36) {
    return contact(w, h) + paper(R(-55, -18, 110, 36, '#2b2730', 16) + R(-30, -10, 60, 20, '#4b4652', 8) + Array.from({ length: 8 }, (_, i) => Ln(`M${-50 + i * 14} -18 l-4 7`, '#4b4652', 2)).join(''));
  },
  mower(w = 96, h = 40) {
    const c = '#d9433a';
    return contact(w, h) + paper(Pth('M-38 6 q0 -18 18 -20 h52 q16 2 18 20 z', c) + Pth('M-30 2 q2 -12 14 -13 h40 q10 1 12 6z', light(c, .3), 'opacity=".6"') +
      R(-42, 4, 96, 10, shade(c, .35), 4) + C(-28, 20, 10, '#2b2730') + C(-28, 20, 4, '#c9d0d6') + C(42, 20, 10, '#2b2730') + C(42, 20, 4, '#c9d0d6'));
  },
  tlight(w = 40, h = 92) {
    return paper(block(-20, -46, 40, 92, '#e9b23a', 7) + [-28, 0, 28].map((y, i) => R(-17, y - 13, 34, 8, shade('#e9b23a', .3), 3) + C(0, y, 10, ['#e2553c', '#6f5f2c', '#2f6b3a'][i]) + (i === 0 ? C(0, y, 15, '#e2553c', 'opacity=".25"') + C(-3, y - 3, 3, '#fff', 'opacity=".6"') : '')).join(''));
  },
  skierO(w = 120, h = 80) {
    return { svg: paper(Ln('M-62 37 L50 37 q8 0 10 -8', '#c8433a', 4) + Ln('M-30 10 L-34 36 M30 -2 L40 34', '#5d5566', 2)), people: [who('duck', -6, 36, 70, { char: 'femaleAdventurer' })] };
  },
  kidO(w = 80, h = 60) {
    return { svg: '', people: [who('duck', -6, 30, 58, { char: 'femalePerson' })] };
  },
  /* ---- inline-scene objects (identified by scenario id) ---- */
  textbook(w = 140, h = 34) {
    const c = '#2f6f8f';
    return contact(w, h) + paper(R(-70, -17, 140, 34, c, 4) + R(-64, -11, 134, 22, '#f8f0de', 2) + Ln('M-62 -5 H68 M-62 0 H68 M-62 5 H68', '#e2d5bc', 1) + R(-70, -17, 10, 34, shade(c, .2), 3) + Tx(10, -19, '', 1));
  },
  plantPot(w = 96, h = 70) {
    const pot = '#c9653c';
    return paper(E(-20, -14, 24, 13, '#4f9a52') + E(20, -16, 24, 13, '#448c48') + E(0, -24, 20, 15, '#5fae5c') +
      Ln('M-44 -6 C-60 40 -76 70 -80 100', '#3f8a3a', 5) + Ln('M44 -6 C60 40 74 76 78 110', '#3f8a3a', 5) + E(-78, 92, 9, 15, '#4f9a52', 'transform="rotate(-20 -78 92)"') + E(76, 102, 9, 15, '#4f9a52', 'transform="rotate(20 76 102)"') +
      Pth('M-44 -4 L44 -4 L32 52 L-32 52 Z', pot) + Pth('M-44 -4 L-20 -4 L-16 52 L-32 52 Z', light(pot, .2)) + R(-48, -8, 96, 11, shade(pot, .15), 4));
  },
  skydiver(w = 150, h = 60) {
    return { svg: '', people: [who('fall', 0, 46, 132, { char: 'femaleAdventurer' })] };
  },
  engineBlock(w = 124, h = 82) {
    const c = '#68717d';
    return paper(R(-50, -46, 100, 16, shade(c, .2), 3) + block(-62, -34, 124, 70, c, 6) + Array.from({ length: 4 }, (_, i) => R(-48 + i * 26, -22, 18, 44, shade(c, .15), 3) + R(-46 + i * 26, -20, 6, 40, light(c, .2), 2)).join('') + R(62, -14, 20, 30, shade(c, .25), 3));
  },
  heliumBalloon(w = 100, h = 120) {
    const c = '#d9433a';
    return paper(E(0, 0, 50, 60, c) + E(16, 14, 28, 36, shade(c, .12), 'opacity=".6"') + E(-20, -24, 12, 20, '#fff', 'opacity=".4" transform="rotate(20 -20 -24)"') + Pth('M-6 66 l6 -7 l6 7 z', shade(c, .15)));
  },
  bobber(w = 44, h = 44) {
    return paper(R(-3, -42, 6, 22, '#2b2730', 2) + Pth('M-22 0 a22 22 0 0 1 44 0z', '#d9433a') + Pth('M-22 0 a22 22 0 0 0 44 0z', '#f8f4ec') + E(-8, -10, 5, 7, '#fff', 'opacity=".4"'));
  },
  bowlingBall(w = 60, h = 60) {
    const c = '#2d4a9a';
    return contact(w, h) + paper(C(0, 0, 30, c) + C(-10, -12, 12, light(c, .3), 'opacity=".45"') + C(10, -12, 4, '#14234d') + C(20, -6, 4, '#14234d') + C(14, 6, 5, '#14234d'));
  },
  carSide(w = 230, h = 92, p = {}) {
    const c = p.col || '#3f9a5a';
    return contact(w * .85, h) + paper(Pth('M-114 34 V-2 q0 -10 10 -12 l40 -6 l26 -30 h84 l32 32 l26 6 q12 3 12 14 V34 Z', c) +
      Pth('M-30 -44 h34 v26 h-56z M12 -44 h34 l24 26 h-58z', '#cfe8f6') + R(-110, 8, 220, 5, light(c, .2), 2) + R(98, -2, 16, 8, '#ffe066', 2) + R(-114, -2, 10, 8, '#ff6b6b', 2) +
      C(-68, 34, 18, '#2b2730') + C(-68, 34, 8, '#b8bfc6') + C(72, 34, 18, '#2b2730') + C(72, 34, 8, '#b8bfc6'));
  },
  fish(w = 64, h = 146) {
    const c = '#7a9a6a';
    return paper(Pth('M0 -66 C30 -52 32 40 0 60 C-32 40 -30 -52 0 -66z', c) + Pth('M0 -66 C-30 -52 -32 40 0 60 C-14 30 -16 -40 0 -66z', light(c, .18)) +
      Pth('M0 54 l-20 26 h40z', shade(c, .15)) + Ln('M0 -54 C16 -40 18 30 0 50', '#c4d6a8', 4, 'opacity=".7"') + C(-8, -50, 3.5, P.ink) + Pth('M18 -10 l14 -8 v18z M-18 -10 l-14 -8 v18z', shade(c, .1)));
  },
  hotAir(w = 220, h = 310) {
    const stripes = ['#e2553c', '#f2b13d', '#e2553c', '#f2b13d', '#e2553c'];
    const env = stripes.map((c, i) => { const x0 = -90 + i * 36; return Pth(`M0 -138 C${x0 - 20} -138 ${x0 - 18} -40 ${x0 + 4 + i * 2} 32 L${x0 + 40} 32 C${x0 + 26} -40 ${x0 + 30} -138 0 -138Z`, c); }).join('');
    return paper(Pth('M0 -138 C100 -138 120 -38 90 32 C75 67 40 92 25 104 H-25 C-40 92 -75 67 -90 32 C-120 -38 -100 -138 0 -138Z', '#e2553c') + env +
      Pth('M0 -138 C40 -138 50 -40 32 32 C26 67 15 92 10 104 H-10 C-15 92 -26 67 -32 32 C-50 -40 -40 -138 0 -138Z', '#f6d24a') +
      Ln('M-88 -48 Q0 -38 88 -48 M-96 -8 Q0 4 96 -8', shade('#e2553c', .2), 2.5, 'opacity=".5"') +
      Ln('M-23 104 L-20 138 M23 104 L20 138', '#5a4632', 2) + block(-24, 138, 48, 34, '#9c6b3c', 5) + Ln('M-24 148 h48 M-24 160 h48', '#7d5330', 2));
  },
  carBoxes(w = 110, h = 50) {
    return contact(w, h) + paper(R(-55, 8, 110, 8, '#5d5566', 2) + C(-38, 20, 8, '#2b2730') + C(38, 20, 8, '#2b2730') + block(-50, -30, 54, 38, '#d9a066', 3) + block(6, -44, 44, 52, '#c08552', 3) + R(-26, -30, 8, 16, light('#d9a066', .3)) + R(24, -44, 8, 20, light('#c08552', .3)));
  },
  labBlock(w = 56, h = 70, p = {}) {
    const c = p.col || '#8f979f';
    return paper(Ln('M0 -35 V-41', '#4b4652', 3) + block(-w / 2, -h / 2, w, h, c, 6) + R(-w / 2 + 6, -h / 2 + 6, 8, h - 16, light(c, .3), 3, 'opacity=".7"') + (p.txt ? Tx(0, 5, p.txt, 11, shade(c, .55)) : ''));
  },
  paintCan(w = 56, h = 60) {
    const c = '#eef0f2';
    return paper(Ln('M-26 -30 Q0 -52 26 -30', '#4b4652', 2.5) + block(-28, -30, 56, 60, c, 8) + R(-28, -14, 56, 26, P.teal, 2) + Tx(0, 4, 'PAINT', 10, '#f6f1e8') + R(-28, -30, 56, 6, '#c9d0d6', 3));
  },
  woodBlock(w = 88, h = 54) {
    const c = '#d8a15d';
    return contact(w, h) + paper(block(-44, -27, 88, 54, c, 3) + Ln('M-38 -11 h76 M-38 7 h76', shade(c, .15), 1.6) + E(18, -2, 7, 3, shade(c, .2), 'opacity=".5"'));
  }
};
