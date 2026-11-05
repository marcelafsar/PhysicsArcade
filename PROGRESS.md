# Progress

Status as of 2026-11-04: **playable, tested, offline build delivered** (`dist/Physics_Arcade.html`).

## Done, by stage of the brief

**A — Audit and design**
- Backups of both HTML files are in `backup/`.
- Read and mapped the engine: the scenario banks, the `mk1`/`mk2`/`mk3` generators, the 26 scene builders, the graders and the three-step flow.
- Mocked up three art directions and chose one (`docs/DESIGN.md`).

**B — Foundation and pilot**
- The teacher script is extracted verbatim and hooked in by wrapping, not editing.
- Toolchain: Vite with PixiJS v8 and the single-file plugin.
- New menu and HUD.
- Elevator pilot with all three required outcomes plus the three steady and arriving variants.
- Visual gate: menu, elevator, incline and pulley were screenshotted and reviewed (`screenshots/`).

**C — Full-scale visuals**
- All 152 scenes are composed with the new art.
- Environments and props are cohesive; Kenney characters are rendered from vector.
- Every scenario has a motion-replay archetype: equilibrium scenes show zero velocity and zero acceleration rather than inventing motion.

**D — Polish**
- First-run tutorial, collapsible help and legend, settings dialog.
- Local progress, keyboard drawing, touch, reduced motion.
- Sound design and transitions.
- The `#teacher` preview tools are kept and labelled as not access-controlled.

**E — Ship and audit**
- Single-file offline build.
- Automated suite: see `TEST_REPORT.md`.
- `README.md`, `ASSET_PROVENANCE.md`.

## Not done / known limitations

- **Rive.** Not used: free exports carry a splash screen and clean exports need the paid Cadet plan ($9 per seat per month). It needs your go-ahead before any purchase.
- **Adobe Firefly.** Not used: no authorized API access was available.
- **Animations are qualitative by design.** Normalized timing, with no invented speeds, times or distances. Acceleration direction always comes from the answer key's net force.
- **Character proportions.** The Kenney characters are big-headed toon figures, so in a few scenes (the elevator rider, standing on a scale) the centre-of-mass dot sits near the chin rather than mid-torso. The dot position itself is the teacher's and is unchanged.
- **Untested platforms.** Safari/iOS was not run; the tests use Chromium. OGG audio falls back to synthesized tones if a browser cannot decode it.
- **Performance figures are a lower bound.** They were measured in headless Chromium with software WebGL (about 60 fps during replays). Real school laptops with GPUs should do at least as well, but none were tested.

## Ideas for a next round

- A per-scenario achievement sticker book (decorative only; must not change grading).
- A scenario browser/search for teachers assigning a topic.
- Bespoke replays for a few more showcase scenes, such as a parachute canopy inflating or a skidding car leaving tyre marks.
- If Rive is purchased: rig the menu machines and the elevator rider in Rive and swap them into `menu-diorama.js` and `compose.js`.
