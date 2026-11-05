# Test report

All results below come from commands actually run on **2026-11-04** against the final build
`dist/Physics_Arcade.html` (2.91 MB). The browser was Playwright 1.64.1 driving headless Chromium
with software WebGL (SwiftShader), on Windows 11.

## Commands run

```bash
npm run build
```
This runs `tools/extract-teacher.mjs`, then `vite build`, then `tools/postbuild.mjs`. Output:
`✓ dist/Physics_Arcade.html  2.91 MB — teacher engine byte-identical, no external URLs`

```bash
npm test
```
This runs `tests/run-all.mjs`. **Result: 102/102 checks passed**, exit code 0. The full console
output is in `tests/last-run.txt` and the machine-readable results in `tests/results.json`.

```bash
node tools/scene-sheet.mjs http://localhost:5173/ screenshots/scenes
```
This renders every one of the 152 scenes on the dev build and makes contact sheets
(`screenshots/scenes/sheet_00…12.png`). It reported 0 console errors or warnings.

```bash
node tools/cine-shot.mjs http://localhost:5173/ screenshots/dev/cine "1|elev-down-slow" "2|ramp-shove" "3|atwood-50-30"
```
This captures frames of the motion replays for visual review.

## What the suite does

1. **Teacher content.**
   - Byte comparison of the teacher's `<script>` with `src/teacher/fbd-original.js`, with the copy embedded in the built file, and with the backup.
   - It then loads the original teacher page and the built game side by side and compares all 152 scenario objects, serialized with every hint and explanation function's source text.
2. **Answer keys.** Every key must pass the identify, directions and magnitudes graders. Then five kinds of wrong answer are generated for each scenario (760 in total) and every one must be rejected: a missing force, a reversed force, a wrong size, an extra force, and a missing tick in step 1.
3. **Menu and settings.** Each level opens straight from the menu, plus the tab switcher, Home and Continue, the theme toggle, and every setting in the dialog.
4. **A real play-through with the mouse.** The test makes a deliberate wrong first try, then ticks the checklist, drags arrows on the diagram, labels them in the picker, and drags the tips to size. It then checks the success stamp, that the retry does not count toward mastery, the replay controls, and Next situation.
5. **Elevator trio.** The replay legend must state velocity and acceleration separately, and the building must scroll the right way past the car.
6. **Touch and keyboard.** The same play-through on a 390 × 844 touch device using CDP touch events, plus keyboard drawing, labelling, rotating and deleting. The first-run tutorial is shown, stepped through and replayed, and the audio samples must decode.
7. **Visuals.** 4 viewports × 2 themes. For each: a menu screenshot plus one scenario from each level. Checks: no horizontal scroll, no clipped buttons or headings, no console errors, no failed requests. All 152 scenes must compose with the new art and none may fall back to the old drawings.
8. **Offline.** The built file is opened with all network access blocked.
9. **Performance.** Frame rate during a replay, and the time to switch scenes.

## Results (verbatim from `tests/last-run.txt`)

**1. Teacher content is untouched**

- ✓ src/teacher/fbd-original.js is byte-identical to the teacher script (sha256 f1bd669b7c1cfd17)
- ✓ built game embeds the teacher script byte-for-byte
- ✓ teacher original matches its backup copy
- ✓ scenario counts are 52 / 50 / 50 (152 total) (52/50/50)
- ✓ every scenario (ids, text, givens, forces, answers, hints, explanations) equals the original at runtime (152 identical)
- ✓ scenario ids are unique

**2. Answer keys and grading**

- ✓ all 152 correct answer keys pass all three graders (152/152)
- ✓ the engine's own self-test reports no failing keys
- ✓ wrong answers (missing, reversed, wrong size, extra force, unchecked force) are rejected for every scenario (760 wrong answers rejected)

**3. Menu, levels, settings**

- ✓ credits shown on the menu: Elizabeth Gauvin (original) and Marcel Afsar (this version)
- ✓ menu is the first screen; game hidden
- ✓ three level tags, all enabled
- ✓ Level 3 opens immediately from the menu ({"level":3,"scLevel":3,"game":true,"tab":"3"})
- ✓ Level 1 opens immediately from the menu ({"level":1,"scLevel":1,"game":true,"tab":"1"})
- ✓ Level 2 opens immediately from the menu ({"level":2,"scLevel":2,"game":true,"tab":"2"})
- ✓ switching levels with the in-game tabs works
- ✓ Home → Continue resumes the same level
- ✓ theme toggle switches light/dark
- ✓ settings dialog opens from the game
- ✓ setting works: sfxOff
- ✓ setting works: sfxOn
- ✓ setting works: vol
- ✓ setting works: music
- ✓ setting works: cine
- ✓ setting works: labels
- ✓ setting works: reduce
- ✓ setting works: contrast
- ✓ setting works: classic
- ✓ setting works: pixiBack
- ✓ setting works: themeDark
- ✓ setting works: themeLight
- ✓ Escape closes settings
- ✓ menu sound button toggles mute

**4. Play-through: elevator arriving at the lobby (mouse)**

- ✓ mouse: an incomplete answer gets a hint, not a pass
- ✓ mouse: step 1 accepted (identify)
- ✓ mouse: two arrows drawn and labelled on the diagram ([["FN",90,3],["Fg",270,3]])
- ✓ mouse: step 2 accepted (directions)
- ✓ mouse: step 3 accepted — scenario solved (Now it's correct.To slow your downward motion, the net force must point up, so FN > Fg. The direction of the net force m)
- ✓ mouse: green check stamp shown
- ✓ mouse: the retry means it does not count toward mastery
- ✓ outcome animation starts after the correct answer and hides the arrow overlay
- ✓ elevator arriving at the lobby: velocity DOWN, acceleration UP (VelocitydownAccelerationup · slowing down)
- ✓ slow-motion toggles
- ✓ replay restarts the animation
- ✓ "Show diagram" ends the animation and restores the arrows
- ✓ "Watch motion" replay button is offered afterwards
- ✓ "Watch motion" replays
- ✓ "Next situation" loads a new situation

**5. Elevator trio — motion vs. acceleration**

- ✓ elev-up-speed: velocity up, acceleration up (VelocityupAccelerationup · speeding up)
- ✓ elev-up-speed: building scrolls down past the car (car moving up) (43)
- ✓ elev-down-slow: velocity down, acceleration up (VelocitydownAccelerationup · slowing down)
- ✓ elev-down-slow: building scrolls up past the car (car moving down) (-250)
- ✓ elev-down-speed: velocity down, acceleration down (VelocitydownAccelerationdown · speeding up)
- ✓ elev-down-speed: building scrolls up past the car (car moving down) (-43)

**6. Touch and keyboard input**

- ✓ touch: an incomplete answer gets a hint, not a pass
- ✓ touch: step 1 accepted (identify)
- ✓ touch: two arrows drawn and labelled on the diagram ([["FN",90,3],["Fg",270,3]])
- ✓ touch: step 2 accepted (directions)
- ✓ touch: step 3 accepted — scenario solved (Now it's correct.To slow your downward motion, the net force must point up, so FN > Fg. The direction of the net force m)
- ✓ touch: green check stamp shown
- ✓ touch: the retry means it does not count toward mastery
- ✓ touch: no page errors
- ✓ keyboard: arrow key draws an arrow and opens the label picker ({"step":2,"phase":"draw","n":1,"active":"","status":"Keyboard drawing: arrow keys draw, L labels, [ and ] select, Delete)
- ✓ keyboard: Enter on a picker choice labels the arrow (without submitting) (Fg)
- ✓ keyboard: Q / Shift+Q rotate by 1° / 5° (276)
- ✓ keyboard: Delete removes the selected arrow
- ✓ tutorial appears on first entry to the game
- ✓ tutorial can be stepped through and closes
- ✓ tutorial can be replayed from Settings
- ✓ tutorial: no page errors
- ✓ Kenney sound samples decode in the browser (43 samples decoded)

**7. Viewports, themes, rendering**

- ✓ desktop-light: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ desktop-light: no clipped buttons or headings
- ✓ desktop-light: no console errors or failed requests
- ✓ laptop-light: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ laptop-light: no clipped buttons or headings
- ✓ laptop-light: no console errors or failed requests
- ✓ tablet-light: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ tablet-light: no clipped buttons or headings
- ✓ tablet-light: no console errors or failed requests
- ✓ phone-light: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ phone-light: no clipped buttons or headings
- ✓ phone-light: no console errors or failed requests
- ✓ desktop-dark: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ desktop-dark: no clipped buttons or headings
- ✓ desktop-dark: no console errors or failed requests
- ✓ laptop-dark: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ laptop-dark: no clipped buttons or headings
- ✓ laptop-dark: no console errors or failed requests
- ✓ tablet-dark: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ tablet-dark: no clipped buttons or headings
- ✓ tablet-dark: no console errors or failed requests
- ✓ phone-dark: renders the illustrated scene, no horizontal scroll (menu + game) (menu true, game true)
- ✓ phone-dark: no clipped buttons or headings
- ✓ phone-dark: no console errors or failed requests
- ✓ all 152 scenes compose with the new art (no fallback to the old drawings)
- ✓ main page: no console errors during the whole run

**8. Offline single-file build**

- ✓ opens from a plain local file with all network access blocked
- ✓ offline: fonts loaded from the bundle
- ✓ offline: no console errors

**9. Performance (headless software rendering — a lower bound for real GPUs)**

- ✓ outcome animation frame rate measured (60.5 fps (software GL))
- ✓ scene switch time (27 ms)

## Screenshots

- `screenshots/key/`: a curated set: art-direction study, menus (light, dark, phone), game screens per level and viewport, the three elevator replays, and the tutorial.
- `screenshots/test/`: every screenshot the suite takes (4 viewports × 2 themes × menu and three scenarios, plus replay frames).
- `screenshots/scenes/`: contact sheets of all 152 scenes.

## Bugs the tests found during development (all fixed)

- **Dark mode threw an error.** The game scene was missing its `setTheme` method.
- **Fast scene switching freed textures still on screen.** This raised `alphaMode` errors. Fixed with reference-counted textures and by finishing any crossfade before starting the next.
- **The HUD theme button lost its icon.** The engine's `setDark` writes emoji text into it; the icon is now restored after every theme change.
- **Test-only bug.** A selector matched a stale hidden label-picker button instead of the checklist checkbox. The test now scopes its selectors to `#checklist`.

## Limits of this testing

- **Chromium only.** Firefox and Safari/iOS were not run.
- **Software GPU.** The frame rate (about 60 fps) was measured with software WebGL in a headless browser. It is a lower bound for machines with a GPU, but no physical school laptop was tested.
- **Audio not listened to.** Tests confirm the 43 Kenney samples decode and that sound controls change the volume state. Nobody listened to the output.
- **Teacher review still needed.** The pedagogy of the replays (for example, equilibrium scenes show no motion and zero acceleration) follows the brief, but the physics teacher has not reviewed it.
