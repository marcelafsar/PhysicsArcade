/* Keyboard alternative to dragging arrows. It edits the same `arrows` list the
   pointer handlers edit and then asks the engine to render and label them, so the
   grader sees exactly the same data either way. */
/* global availableFor, sc, step, phase, arrows, LV */
import { T, newArrowId, setSelected } from '../teacher/globals.js';
import { Sound } from '../audio.js';

const $ = id => document.getElementById(id);
const DIR = { ArrowUp: 90, ArrowDown: 270, ArrowLeft: 180, ArrowRight: 0 };
let objIdx = 0;

function say(msg) { $('status').textContent = msg; }
const norm = a => ((a % 360) + 360) % 360;
const sel = () => arrows.find(a => a.id === T.selected);

export function installKeyboard() {
  const stage = $('stage');
  stage.addEventListener('keydown', e => {
    if (!sc || phase !== 'draw' || document.body.classList.contains('cinematic')) return;
    if (e.target !== stage) return;                       // let picker buttons handle their own keys
    const axis = LV().mode === 'axis', k = e.key;
    const a = sel();
    if (k in DIR) {
      e.preventDefault();
      if (step === 1) return say('Step 1: tick the forces in the checklist, then press Enter.');
      if (step === 3) {                                    // lengths only (Level 1)
        if (!a) return say('Select an arrow first with [ or ].');
        if (axis) return resize(a, (k === 'ArrowUp' || k === 'ArrowRight') ? 1 : -1);
        return say('Step 3: type each force size in the boxes.');
      }
      if (a) { a.ang = DIR[k]; T.render(); Sound.play('tick'); return say(`Arrow now points ${['right', 'up', 'left', 'down'][DIR[k] / 90]}.`); }
      return create(DIR[k]);
    }
    if ((k === 'q' || k === 'Q' || k === 'e' || k === 'E') && step === 2 && a) {
      e.preventDefault();
      const d = (k.toLowerCase() === 'q' ? 1 : -1) * (axis ? 90 : (e.shiftKey ? 5 : 1));
      a.ang = norm(a.ang + d); T.render(); Sound.play('tick');
      return say(`Angle ${a.ang}° (measured counterclockwise from the right).`);
    }
    if ((k === '+' || k === '=' || k === '-' || k === '_') && a && (step === 2 || (step === 3 && axis))) {
      e.preventDefault(); return resize(a, (k === '+' || k === '=') ? 1 : -1);
    }
    if ((k === 'l' || k === 'L') && step === 2 && a) { e.preventDefault(); return label(a); }
    if (k === '[' || k === ']') {
      e.preventDefault();
      if (!arrows.length) return say('No arrows yet. Press an arrow key to draw one.');
      const i = arrows.indexOf(a), n = arrows.length;
      const next = arrows[(i + (k === ']' ? 1 : -1) + n) % n];
      setSelected(next.id); T.render();
      return say(`Selected ${next.label ? 'F' + T.LABELS[next.label].sub : 'an unlabeled arrow'}, ${next.len} long.`);
    }
    if ((k === 'o' || k === 'O') && sc.multi) {
      e.preventDefault(); objIdx = (objIdx + 1) % sc.objects.length; setSelected(null); T.render();
      return say(`New arrows will start on ${sc.objects[objIdx].name}.`);
    }
  });
  stage.addEventListener('focus', () => { if (step >= 2 && phase === 'draw') say('Keyboard drawing: arrow keys draw, L labels, [ and ] select, Delete removes.'); });
}
export function resetKeyboard() { objIdx = 0; }

function create(ang) {
  const obj = sc.multi ? objIdx : 0;
  if (!availableFor(obj, null).length) return say(`You've already drawn every force you identified${sc.multi ? ' for ' + sc.objects[obj].name : ''}.`);
  const a = { id: newArrowId(), obj, label: null, by: null, ang, len: LV().mode === 'axis' ? 3 : 3 };
  arrows.push(a); setSelected(a.id); T.render(); Sound.play('draw');
  label(a);
}
function label(a) {
  T.showPicker(a);
  const first = $('picker').querySelector('button');
  first?.focus();
  // return focus to the stage once a label is chosen
  $('picker').addEventListener('click', () => setTimeout(() => $('stage').focus(), 0), { once: true });
}
function resize(a, d) {
  const axis = LV().mode === 'axis', stepLen = axis ? 1 : .5, min = axis ? 1 : .5;
  a.len = Math.max(min, Math.min(LV().max, a.len + d * stepLen));
  T.render(); Sound.play('tick');
  say(`Length ${a.len} ${a.len === 1 ? 'dot' : 'dots'}${sc.scale ? ` = ${+(a.len * sc.scale).toPrecision(3)} N` : ''}.`);
}
