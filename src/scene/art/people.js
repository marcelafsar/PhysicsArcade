/* People: Kenney "Toon Characters 1" (CC0) vector pose sheets, rasterized per pose
   at screen resolution so they stay crisp at any size. Each sheet is 9 × 5 cells of
   96 × 128; the cell layout comes from Kenney's own tilesheet XML. */
import { Sprite, Container, Texture } from 'pixi.js';
import femalePerson from '../../../assets/vendor/kenney/toon-characters/vector/femalePerson.svg?raw';
import malePerson from '../../../assets/vendor/kenney/toon-characters/vector/malePerson.svg?raw';
import femaleAdventurer from '../../../assets/vendor/kenney/toon-characters/vector/femaleAdventurer.svg?raw';
import maleAdventurer from '../../../assets/vendor/kenney/toon-characters/vector/maleAdventurer.svg?raw';

const SHEETS = { femalePerson, malePerson, femaleAdventurer, maleAdventurer };
const ORDER = ['idle', 'jump', 'fall', 'duck', 'hit', 'climb0', 'climb1', 'cheer0', 'cheer1', 'back', 'slide', 'interact', 'switch0', 'switch1', 'kick', 'side', 'shove', 'shoveBack',
  'talk', 'attackKick', 'hang', 'hold', 'show', 'behindBack', 'run0', 'run1', 'run2', 'attack0', 'attack1', 'attack2', 'think', 'down', 'drag', 'hurt', 'wide', 'rope',
  'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'fallDown'];
const CELL = Object.fromEntries(ORDER.map((n, i) => [n, [(i % 9) * 96, Math.floor(i / 9) * 128]]));

/* Measured in cell units (96 × 128): top of head, foot point, and the hand used to hold things. */
export const POSE = {
  idle: { top: 32, foot: [48, 128] }, wide: { top: 32, foot: [48, 128], hand: [89, 100] },
  interact: { top: 33, foot: [44, 128], hand: [89, 86] }, drag: { top: 33, foot: [46, 128], hand: [74, 91] },
  shove: { top: 33, foot: [55, 128], hand: [14, 86] }, hang: { top: 28, foot: [50, 126], hand: [80, 31] },
  hold: { top: 33, foot: [50, 128], hand: [50, 100] }, duck: { top: 48, foot: [46, 128] },
  slide: { top: 54, foot: [96, 128] }, fall: { top: 28, foot: [50, 127] },
  cheer0: { top: 22, foot: [48, 128] }, cheer1: { top: 22, foot: [48, 128] }, walk0: { top: 32, foot: [48, 128] }
};

const cache = new Map();
/** Texture for one pose cell. `crop: 'waist'` keeps only the top part (for riders seated inside a vehicle). */
export async function poseTexture(char, pose, res, crop) {
  const key = `${char}/${pose}/${res.toFixed(2)}/${crop || ''}`;
  if (cache.has(key)) return cache.get(key);
  const [cx, cy] = CELL[pose] || CELL.idle;
  const ch = crop === 'waist' ? 96 : 128;
  const pw = Math.ceil(96 * res), ph = Math.ceil(ch * res);
  const doc = SHEETS[char].replace(/<svg\b[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pw}" height="${ph}" viewBox="${cx} ${cy} 96 ${ch}">`);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doc);
  const p = img.decode().then(() => {
    const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
    cv.getContext('2d').drawImage(img, 0, 0, pw, ph);
    return Texture.from(cv);
  });
  cache.set(key, p);
  return p;
}

/** A positioned character sprite. spec: {pose, char, x, y, height, flip, at:'foot'|'hand', crop}.
 *  `scaleRes` is world→pixel resolution for crisp rasterization. */
export async function makePerson(spec, scaleRes) {
  const pose = POSE[spec.pose] ? spec.pose : 'idle', m = POSE[pose];
  const s = spec.height / (m.foot[1] - m.top);                 // world units per cell unit
  const tex = await poseTexture(spec.char || 'femalePerson', pose, Math.min(6, s * scaleRes), spec.crop);
  const spr = new Sprite(tex);
  const texScale = 96 / tex.width;                              // cell units per texture px
  spr.scale.set(s * texScale * (spec.flip ? -1 : 1), s * texScale);
  const ref = spec.at === 'hand' && m.hand ? m.hand : m.foot;
  spr.anchor.set(ref[0] / 96, ref[1] / (spec.crop === 'waist' ? 96 : 128));
  spr.position.set(spec.x, spec.y);
  const c = new Container(); c.addChild(spr); c.label = `person:${pose}`;
  return c;
}
/** Where a pose's hand ends up relative to its foot, in world units (for rope/handle attachment). */
export function handOffset(pose, height, flip) {
  const m = POSE[pose], s = height / (m.foot[1] - m.top);
  return [(m.hand[0] - m.foot[0]) * s * (flip ? -1 : 1), (m.hand[1] - m.foot[1]) * s];
}
