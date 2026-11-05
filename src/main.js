/* Physics Arcade — boot and game controller.
   The teacher engine (fbd-original.js) has already run as a classic script and loaded
   a Level 1 situation behind the menu. This module adds the arcade layer on top. */
import { T } from './teacher/globals.js';
import { installBridge, on } from './bridge.js';
import { prefs, setPref, onPref, reducedMotion, wantsDark, onSystemChange, loadProgress, saveProgress } from './prefs.js';
import { installIcons } from './icons.js';
import { Sound } from './audio.js';
import { installSettings } from './ui/settings.js';
import { installKeyboard, resetKeyboard } from './ui/keyboard.js';
import { buildMenu, refreshMenu, placeTags } from './ui/menu.js';
import { GameScene } from './scene/game-scene.js';
import { MenuDiorama } from './scene/menu-diorama.js';

const $ = id => document.getElementById(id);
const body = document.body;
installIcons();

/* ---------------- progress (saved locally; grading rules untouched) ---------------- */
function restoreProgress() {
  const p = loadProgress(); if (!p || typeof p !== 'object') return;
  for (const lv of T.LEVEL_IDS) {
    const n = Number(p.correct?.[lv]);
    if (Number.isInteger(n) && n >= 0 && n < 1e5) T.state.correct[lv] = n;
    if (T.state.correct[lv] >= T.GOAL) T.state.done.add(lv);
  }
  if (T.LEVEL_IDS.includes(p.level)) T.state.level = p.level;
}
const persist = () => saveProgress({ level: T.state.level, correct: T.state.correct });
restoreProgress();
installBridge();
globalThis.setLevel(T.state.level);   // reload the saved level (the engine started on Level 1)

/* ---------------- look: theme, contrast, motion ---------------- */
function applyLook() {
  const dark = wantsDark();
  if (body.classList.contains('dark') !== dark) globalThis.setDark(dark);
  body.classList.toggle('high-contrast', prefs.contrast);
  body.classList.toggle('reduce-motion', reducedMotion());
  body.classList.toggle('art-pixi', !prefs.classicArt && scene.ok);
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  for (const id of ['darkToggle', 'menuTheme']) $(id).setAttribute('aria-label', label);
  $('menuTheme').querySelector('span').textContent = dark ? 'Light' : 'Dark';
  const snd = prefs.sfx ? 'audioOn' : 'audioOff';
  for (const id of ['menuSound', 'hudSound']) {
    $(id).querySelector('.ic').className = `ic ic-${snd}`;
    $(id).setAttribute('aria-label', prefs.sfx ? 'Mute sound' : 'Turn sound on');
  }
}
on('dark', d => {                                            // the engine's own toggle button lands here
  const want = wantsDark();
  if (d !== want) setPref('theme', d ? 'dark' : 'light');
  scene.setTheme(d); diorama?.setTheme(d); applyLook();
});
onPref(k => { if (['theme', 'contrast', 'reduceMotion', 'classicArt', 'sfx'].includes(k)) applyLook(); if (k === 'classicArt') scene.show(T.sc); });
onSystemChange(applyLook);
const toggleTheme = () => { setPref('theme', body.classList.contains('dark') ? 'light' : 'dark'); Sound.play('toggle'); };
$('menuTheme').onclick = toggleTheme;
$('darkToggle').onclick = toggleTheme;
const toggleSound = () => { setPref('sfx', !prefs.sfx); Sound.play('toggle'); };
$('menuSound').onclick = toggleSound; $('hudSound').onclick = toggleSound;

/* ---------------- scenes ---------------- */
const scene = new GameScene($('pixiHost'), $('stage'));
let diorama = null;

/* ---------------- screens ---------------- */
let inGame = false;
function showMenu() {
  inGame = false; scene.stopCinematic(true); T.hidePicker();
  $('game').hidden = true; $('menu').hidden = false; $('menu').classList.add('enter');
  refreshMenu(); diorama?.resume(); diorama?.relayout();
  document.title = 'Physics Arcade · Free-Body Workshop';
  $('continueBtn').focus({ preventScroll: true });
}
function showGame(level) {
  diorama?.pause();
  $('menu').hidden = true; $('game').hidden = false; $('game').classList.remove('enter'); void $('game').offsetWidth; $('game').classList.add('enter');
  inGame = true;
  scene.resize();
  if (level && level !== T.state.level) globalThis.setLevel(level);   // switching level: fresh situation
  else scene.show(T.sc);                                              // same level: resume where you were
  document.title = `${T.LEVELS[T.state.level].tab} · Physics Arcade`;
}

buildMenu({
  onPick: lv => { Sound.play('select'); showGame(lv); },
  onHover: lv => { if (lv) Sound.play('hover'); diorama?.highlight(lv); }
});
$('continueBtn').onclick = () => { Sound.play('select'); showGame(null); };
$('homeBtn').onclick = () => { Sound.play('close'); showMenu(); };

const settings = installSettings({
  onReset: () => { $('resetProg').click(); persist(); refreshMenu(); toast('Progress reset'); },
  isReduced: reducedMotion
});
$('menuSettings').onclick = () => settings.open();
$('hudSettings').onclick = () => settings.open();

/* Keys: while a menu or dialog is up, keep Enter/Delete away from the engine's
   global key handler; on a focused button let the browser click it instead. */
window.addEventListener('keydown', e => {
  const modalUp = !$('settings').hidden;
  if (!inGame || modalUp) { if (['Enter', 'Delete', 'Backspace'].includes(e.key)) e.stopImmediatePropagation(); return; }
  if (body.classList.contains('cinematic') && e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); scene.stopCinematic(); return; }
  if (e.key === 'Enter' && e.target.closest?.('button, a, summary, select, input[type=range], input[type=checkbox]')) e.stopImmediatePropagation();
  if (e.key === 'Escape' && !$('picker').offsetParent && $('done').style.display !== 'flex') { /* nothing open: Esc does nothing */ }
}, true);

installKeyboard();

/* ---------------- feedback ---------------- */
function stamp() {
  const s = $('stamp'); s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
  if (reducedMotion()) { s.style.opacity = 1; setTimeout(() => { s.style.opacity = ''; }, 1100); }
}
let toastTimer;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2200); }

on('load', s => {
  resetKeyboard();
  $('replayFab').hidden = true;
  if (inGame) scene.show(s);
  $('stage').setAttribute('aria-label', `Diagram for ${s.title}. Drag outward from a black dot to draw a force, or focus here and use the arrow keys.`);
});
on('setstep', ({ step, prev }) => {
  if (step > prev) requestAnimationFrame(() => {
    const done = $('stepper').querySelectorAll('.st.done'); done[done.length - 1]?.classList.add('pop');
  });
  if (step === 2 && matchMedia('(max-width: 1100px)').matches) $('stage').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
});
on('step-ok', () => Sound.play('step'));
on('wrong', () => {
  Sound.play('wrong');
  const fb = $('feedback'); fb.classList.remove('shake'); void fb.offsetWidth; fb.classList.add('shake');
});
on('skip', () => Sound.play('next'));
let pendingDone = false;
on('solved', ({ sc, counts }) => {
  Sound.success(); stamp();
  if (counts) requestAnimationFrame(() => { const d = $('dots').querySelectorAll('.dot.on'); d[d.length - 1]?.classList.add('pop'); });
  persist(); refreshMenu();
  if (prefs.cinematics && !reducedMotion()) setTimeout(() => { if (T.sc === sc && T.phase === 'correct') scene.playCinematic(); }, 1000);
  else $('replayFab').hidden = !scene.hasCinematic();
});
on('level-complete', () => {
  if (body.classList.contains('cinematic') || scene.cinePending) { pendingDone = true; $('done').style.display = 'none'; return; }
  Sound.levelComplete(); $('nextLevel').focus();
});
scene.onCinematicEnd = () => {
  $('replayFab').hidden = !scene.hasCinematic() || T.phase !== 'correct';
  if (pendingDone) { pendingDone = false; $('done').style.display = 'flex'; }
};
$('replayFab').onclick = () => { Sound.play('tap'); scene.playCinematic(); };
$('cineReplay').onclick = () => { Sound.play('tap'); scene.playCinematic(); };
$('cineSkip').onclick = () => { Sound.play('tap'); scene.stopCinematic(); };
$('cineSlow').onclick = () => {
  const on2 = $('cineSlow').getAttribute('aria-pressed') !== 'true';
  $('cineSlow').setAttribute('aria-pressed', String(on2)); scene.setSlow(on2); Sound.play('toggle');
};
on('progress', () => { persist(); });
on('level', () => { persist(); refreshMenu(); document.title = `${T.LEVELS[T.state.level].tab} · Physics Arcade`; });
$('nextLevel').addEventListener('click', () => Sound.play('select'));
$('keepGoing').addEventListener('click', () => Sound.play('tap'));
$('picker').addEventListener('click', e => { if (e.target.closest('button')) Sound.play(e.target.closest('.del') ? 'close' : 'label'); });
$('checklist').addEventListener('change', () => Sound.play('tick'));
$('clear').addEventListener('click', () => Sound.play('close'));
document.querySelectorAll('.fold').forEach(d => d.addEventListener('toggle', () => Sound.play(d.open ? 'open' : 'close')));
$('tabs').addEventListener('click', e => { if (e.target.closest('button')) Sound.play('select'); });

/* ---------------- boot ---------------- */
(async () => {
  await scene.init();
  applyLook();
  globalThis.updateProgress(); globalThis.renderTabs();
  refreshMenu();
  try {
    diorama = new MenuDiorama($('menuStage'), { onLayout: placeTags, onPick: lv => { Sound.play('select'); showGame(lv); } });
    await diorama.init(body.classList.contains('dark'));
  } catch (e) { console.warn('menu diorama unavailable', e); placeTags(null); }
  window.__arcade = { scene, diorama, T, showGame, showMenu, prefs };   // test hook
  body.classList.add('booted');
  if (location.hash === '#teacher' || location.hash.startsWith('#play')) showGame(+(location.hash.match(/\d/)?.[0]) || T.state.level);
})();
