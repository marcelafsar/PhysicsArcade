/* Main menu: three hanging level tags positioned under the diorama's three machines.
   All three levels are open from the first visit. */
import { T } from '../teacher/globals.js';
import { icon } from '../icons.js';

const $ = id => document.getElementById(id);
export const LEVEL_INFO = {
  1: { name: 'Basics', desc: 'One object. Up, down, left, right — elevators, sleds, skydivers.' },
  2: { name: 'Angles', desc: 'Ramps, slopes and ropes at angles. Break forces into components.' },
  3: { name: 'Systems', desc: 'Pulleys, stacks and trains of objects. Diagram each one.' }
};

export function buildMenu({ onPick, onHover }) {
  const nav = $('menuLevels');
  nav.innerHTML = T.LEVEL_IDS.map(lv => {
    const info = LEVEL_INFO[lv] || { name: T.LEVELS[lv].tab, desc: T.LEVELS[lv].blurb };
    return `<button type="button" class="level-tag" data-level="${lv}" aria-label="Play Level ${lv}, ${info.name}. ${info.desc}">
      <span class="lt-num">${lv}</span>
      <span class="lt-name">${info.name}</span>
      <span class="lt-desc">${info.desc}</span>
      <span class="lt-foot"><span class="lt-pips" aria-hidden="true"></span><span class="lt-count"></span><span class="lt-play">Play ${icon('right')}</span></span>
    </button>`;
  }).join('');
  nav.addEventListener('click', e => { const b = e.target.closest('[data-level]'); if (b) onPick(+b.dataset.level); });
  nav.addEventListener('pointerover', e => { const b = e.target.closest('[data-level]'); if (b) onHover(+b.dataset.level); });
  nav.addEventListener('focusin', e => { const b = e.target.closest('[data-level]'); if (b) onHover(+b.dataset.level); });
  nav.addEventListener('pointerleave', () => onHover(0));
}

export function refreshMenu() {
  const { state, GOAL } = T;
  for (const b of document.querySelectorAll('.level-tag')) {
    const lv = +b.dataset.level, n = Math.min(GOAL, state.correct[lv] || 0), bank = T.LEVELS[lv].bank.length;
    b.querySelector('.lt-pips').innerHTML = Array.from({ length: GOAL }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    b.querySelector('.lt-count').textContent = state.done.has(lv) ? 'Mastered' : `${bank} situations`;
  }
  const lv = state.level, info = LEVEL_INFO[lv];
  $('continueSub').textContent = `Level ${lv} · ${info?.name || ''} · ${Math.min(GOAL, state.correct[lv])}/${GOAL} first-try`;
}

/** Places tags at layout slots given by the diorama (CSS px within the menu). */
export function placeTags(slots) {
  const tags = [...document.querySelectorAll('.level-tag')];
  const menu = $('menu');
  if (!slots) {                                              // fallback without the diorama
    slots = tags.map((_, i) => ({ x: 24 + i * 250, y: 40, w: 230, r: 0 }));
  }
  tags.forEach((t, i) => {
    const s = slots[i]; if (!s) return;
    t.style.setProperty('--x', `${Math.round(s.x)}px`); t.style.setProperty('--y', `${Math.round(s.y)}px`);
    t.style.setProperty('--w', `${Math.round(s.w)}px`); t.style.setProperty('--r', `${s.r || 0}deg`);
  });
  menu.classList.add('ready');
}
