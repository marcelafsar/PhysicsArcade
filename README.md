# Physics Arcade · Free-Body Workshop

A free-body-diagram game built around the teacher's **152 original physics situations**
(52 Basics · 50 Angles · 50 Systems). Players identify the forces, draw their directions and set
their sizes. After a fully correct diagram, the situation plays out as a short motion replay that
shows **velocity and acceleration as separate arrows**.

## Play it

Open **`dist/Physics_Arcade.html`** in any modern browser (Chrome, Edge, Firefox, Safari).

- It is one self-contained file of about 2.9 MB, with all code, art, fonts and sounds inside.
- It needs no internet, server, login or install. You can copy it to a USB stick or post it on a class site.
- All three levels are open from the first screen.
- Progress and settings are saved only in that browser.
- Teachers can add `#teacher` to the end of the address to open the original preview tools (jump to any situation, show a correct diagram, reset progress, answer-key self-test). These tools are **not access-controlled** and are not a security feature.

## What's in the game

- **Main menu.** A workshop bench holding three working machines: an elevator for Basics, a ramp for Angles and an Atwood pulley for Systems. Each level's tag hangs below its machine, and the Continue button resumes where you left off. Theme, sound and Settings are on the front page.
- **Game screen.** A large illustrated scene with the original high-contrast vector force overlay on top. The situation brief and givens sit above it, and a tool panel beside it changes with each step. "How to draw" and the force legend are collapsible.
- **Art.**
  - About 40 original cut-paper environments and about 85 props, drawn to the teacher's exact geometry.
  - People are Kenney's CC0 toon characters, rendered from vector at screen resolution.
  - Clouds drift and water ripples. The objects being diagrammed never move while you draw.
- **Feedback.**
  - Green check stamp and a bell chime when you get a situation right.
  - Gentle cues for hints, with the teacher's 3-level hint ladder unchanged.
  - Level-complete fanfare.
- **Motion replays.** These play only after all three steps are correct, with Replay, Slow-mo and Show-diagram controls. Built from reusable archetypes:
  - an elevator, where the building cutaway scrolls past the car
  - sliding along a ramp or floor
  - pulling, pushing and towing
  - pulleys, including Atwood machines and table-and-pulley setups
  - falling and parachuting, where the camera follows and clouds stream past
  - equilibrium (nothing moves; the markers show zero velocity and zero acceleration)

  Velocity (green) follows the motion. Acceleration (purple) comes from the answer key's net force, so *an elevator moving down while slowing shows velocity ↓ and acceleration ↑*.
- **Settings.**
  - Light / dark / match device.
  - Sound effects on/off and volume; background music on/off and volume (off by default).
  - Motion replays on/off; velocity and acceleration markers on/off; reduce motion.
  - Extra-bold arrows; the teacher's original drawings instead of the illustrations.
  - Replay the tutorial; reset progress.
- **Input.**
  - Mouse and touch.
  - Keyboard: focus the picture, then use the arrow keys to draw, Q/E to rotate, +/− to change length, L to label, [ ] to select, Delete to remove and Enter to check.
  - A four-card first-run tutorial.

## Educational content guarantee

The teacher's script from `Free+Body+Diagram+Practice.html` runs **byte-for-byte unmodified**. The
arcade layer never edits it. Instead it:

1. Wraps a few of the engine's global functions (`load`, `submit`, `setStep`, …) to find out what happened. Each wrapper calls the original first.
2. Records the scene-builder calls (`incline`, `hangScene`, `motion`, …) to get the exact layout of every picture, then redraws it with new art.

Scenario wording, values, answer keys, accepted alternatives, hints, explanations, grading tolerances
and the five-first-try mastery rule are all the teacher's. `npm test` proves this every run: it
checks the bytes, compares all 152 scenarios with the original page at runtime, passes all 152
answer keys and rejects 760 deliberately wrong answers.

## Develop

```bash
npm install
```
```bash
npm run dev
```
Then open http://localhost:5173/. Add `#play1`, `#play2` or `#play3` to the address to jump straight into a level.

```bash
npm run build
```
This produces `dist/Physics_Arcade.html` and verifies that the embedded teacher engine is byte-identical and that the file references no external URLs.

```bash
npm test
```
This runs the full browser test suite against the built file. Results go to `tests/results.json` and screenshots to `screenshots/test/`.

### Source layout

```text
index.html                     page shell; keeps every DOM id the teacher engine uses
src/teacher/fbd-original.js    the teacher's script, extracted verbatim (tools/extract-teacher.mjs)
src/teacher/globals.js         read-only accessors for the engine's global state
src/bridge.js                  wraps engine functions → events (load, step-ok, solved, wrong…)
src/main.js                    screens, theme, feedback, boot
src/ui/                        menu tags, settings dialog, keyboard drawing, tutorial
src/audio.js                   Kenney samples + Web Audio synthesis, separate SFX/music buses
src/scene/game-scene.js        PixiJS stage under the SVG overlay (shared world coordinates)
src/scene/capture.js           records the teacher's scene-builder calls → exact geometry
src/scene/compose.js           one composer per builder / inline scene → layered Pixi art
src/scene/anim.js              outcome-animation archetypes + velocity/acceleration markers
src/scene/menu-diorama.js      the menu's workshop bench and three machines
src/scene/art/                 palette & rasterizer, props, environments, Kenney characters
assets/                        fonts and Kenney CC0 packs (see ASSET_PROVENANCE.md)
tests/run-all.mjs              Playwright test suite
tools/                         extract, post-build check, screenshot & contact-sheet helpers
backup/                        untouched copies of the teacher original and the Phase 1 file
```

### How the art lines up with the physics

The engine's diagram is an SVG in the teacher's 640 × 440 coordinate system. The page's viewBox
adds a small margin (−30 −12 700 464) so labels near the edges are not cut off. The PixiJS canvas
underneath uses the same fit box, scale and centring. The engine converts pointer positions with
`getScreenCTM()`, so arrows, dots and snapping stay exact at every screen size while the
illustration extends past the edges on wide screens.

## Documents

- `TEST_REPORT.md`: the commands run and what they showed.
- `ASSET_PROVENANCE.md`: every pack, font and generated asset, with its licence.
- `PROGRESS.md`: what is done, what is not, and the next steps.
- `docs/DESIGN.md`: the art direction and architecture notes.
- `Physics_Arcade_AI_Build_Brief.md` and `Physics_Arcade_Development_Plan.md`: the original brief and roadmap.
