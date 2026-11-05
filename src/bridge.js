/* Hooks the arcade layer onto the teacher engine without editing it.
   Each wrapper calls the original function first, unchanged, then reports what
   happened. Grading, hints, answer keys and the mastery rule all stay in the original. */
import { T, wrap } from './teacher/globals.js';

const handlers = {};
export const on = (ev, fn) => ((handlers[ev] ||= []).push(fn), fn);
const emit = (ev, data) => (handlers[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(`[${ev}]`, e); } });
const $ = id => document.getElementById(id);

export function installBridge() {
  wrap('load', orig => function (s) { orig(s); emit('load', s); });
  wrap('setStep', orig => function (n) { const prev = T.step; orig(n); emit('setstep', { step: n, prev }); });
  wrap('setLevel', orig => function (lv) { orig(lv); emit('level', lv); });
  wrap('updateProgress', orig => function () { orig(); emit('progress', T.state); });
  wrap('renderTabs', orig => function () { orig(); emit('tabs'); });
  wrap('render', orig => function () { orig(); emit('render'); });
  wrap('setDark', orig => function (onOff) { orig(onOff); emit('dark', onOff); });
  wrap('submit', orig => function () {
    const lv = T.state.level, before = { phase: T.phase, step: T.step, correct: T.state.correct[lv], sc: T.sc };
    orig();
    if (before.phase === 'correct') return;                       // that click was "Next situation"
    if (T.phase === 'correct') emit('solved', { sc: before.sc, counts: T.state.correct[lv] > before.correct, level: lv });
    else if (T.step > before.step) emit('step-ok', { step: T.step });
    else if ($('feedback').classList.contains('bad')) emit('wrong', { step: T.step });
  });
  // The engine bound these buttons to the original functions; re-point them at the wrappers.
  $('submit').onclick = () => globalThis.submit();
  $('skip').onclick = (orig => e => { emit('skip'); orig(e); })($('skip').onclick);

  // Level-complete dialog: the engine shows it with style.display = 'flex'.
  const done = $('done');
  new MutationObserver(() => { if (done.style.display === 'flex') emit('level-complete', T.state.level); })
    .observe(done, { attributes: true, attributeFilter: ['style'] });
}
export { emit };
