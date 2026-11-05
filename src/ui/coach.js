/* First-run tutorial: four spotlight cards walking through the three-step flow.
   Skippable, shown once per browser, replayable from Settings. */
import { Sound } from '../audio.js';

const KEY = 'physics-arcade-coach-v1';
const STEPS = [
  { el: '#checklist', title: 'Step 1 · Identify', text: 'Tick every force acting on the object — and only those. Then press <b>Check forces</b>.' },
  { el: '#stage', title: 'Step 2 · Draw', text: 'Drag outward from the black dot to draw each force, then pick its label. No mouse? Focus the picture and use the arrow keys.' },
  { el: '#submit', title: 'Step 3 · Size', text: 'Make each arrow the right size: drag its tip to scale in Level 1, or type the newtons in Levels 2 and 3. Then check.' },
  { el: '.progress', title: 'Mastery', text: 'Five diagrams right on the first try complete a level. Wrong answers just unlock clearer hints — and every correct diagram plays out its motion.' }
];
let box = null, i = 0;

export function maybeCoach() { let seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ } if (!seen) startCoach(); }
export function startCoach() {
  i = 0;
  box ||= Object.assign(document.createElement('div'), { className: 'coach', innerHTML: `<div class="coach-hole"></div><div class="coach-card" role="dialog" aria-modal="true" aria-labelledby="coachT"><div class="coach-n"></div><h3 id="coachT"></h3><p></p><div class="coach-btns"><button type="button" class="coach-skip">Skip</button><button type="button" class="primary coach-next">Next</button></div></div>` });
  document.body.appendChild(box);
  box.querySelector('.coach-skip').onclick = end;
  box.querySelector('.coach-next').onclick = () => { Sound.play('tap'); i++; i < STEPS.length ? show() : end(); };
  box.onkeydown = e => { if (e.key === 'Escape') end(); e.stopPropagation(); };
  show();
}
function show() {
  const s = STEPS[i], t = document.querySelector(s.el);
  const r = (t && t.offsetParent ? t : document.querySelector('.tools')).getBoundingClientRect();
  t?.scrollIntoView?.({ block: 'nearest' });
  const hole = box.querySelector('.coach-hole'), card = box.querySelector('.coach-card');
  Object.assign(hole.style, { left: `${r.left - 8}px`, top: `${r.top - 8}px`, width: `${r.width + 16}px`, height: `${r.height + 16}px` });
  card.querySelector('.coach-n').textContent = `${i + 1} / ${STEPS.length}`;
  card.querySelector('h3').textContent = s.title; card.querySelector('p').innerHTML = s.text;
  card.querySelector('.coach-next').textContent = i === STEPS.length - 1 ? "Let's go" : 'Next';
  const cw = Math.min(330, innerWidth - 24), below = r.bottom + 190 < innerHeight;
  const left = Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2));
  Object.assign(card.style, { width: `${cw}px`, left: `${left}px`, top: below ? `${r.bottom + 16}px` : `${Math.max(12, r.top - 16 - card.offsetHeight)}px` });
  if (!below && r.top - 200 < 0) Object.assign(card.style, { top: `${Math.max(12, innerHeight / 2 - 90)}px`, left: `${Math.max(12, Math.min(r.left - cw - 16, innerWidth - cw - 12))}px` });
  card.querySelector('.coach-next').focus();
}
function end() {
  try { localStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  box?.remove(); Sound.play('close');
  document.getElementById('stage').focus({ preventScroll: true });
}
