/* Read-only window onto the teacher engine's global state.
   fbd-original.js runs first as a classic script, so its top-level `const`/`let`
   bindings live in the global lexical scope that module code can see by name.
   Nothing here changes scenario data, answers or grading. */
/* global sc, step, phase, state, arrows, LEVELS, LEVEL_IDS, GOAL, LABELS, wrong, attempts, selected, nextId, rendered, axisInfo, render, showPicker, hidePicker, Uof, LV, rad */

export const T = {
  get sc() { return sc; },
  get step() { return step; },
  get phase() { return phase; },
  get state() { return state; },
  get arrows() { return arrows; },
  get selected() { return selected; },
  get rendered() { return rendered; },
  get wrong() { return wrong; },
  get attempts() { return attempts; },
  get LEVELS() { return LEVELS; },
  get LEVEL_IDS() { return LEVEL_IDS; },
  get GOAL() { return GOAL; },
  get LABELS() { return LABELS; },
  get U() { return Uof(); },
  get LV() { return LV(); },
  axisInfo: (s, i) => axisInfo(s, i),
  render: () => render(),
  showPicker: a => showPicker(a),
  hidePicker: () => hidePicker()
};

/* Keyboard drawing needs to add arrows exactly like a pointer drag does. These two
   writes mirror the engine's own pointerdown handler (new arrow id, selection). */
export function newArrowId() { return nextId++; }            // eslint-disable-line no-global-assign
export function setSelected(id) { selected = id; }           // eslint-disable-line no-global-assign

/** Replace a global function declared by the teacher script with a wrapper.
 *  The engine resolves these names at call time, so its own internal calls see the wrapper too. */
export function wrap(name, make) {
  const orig = globalThis[name];
  if (typeof orig !== 'function') throw new Error(`teacher function ${name} not found`);
  globalThis[name] = make(orig);
  return orig;
}
