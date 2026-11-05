# Design notes

## Art direction: "Workshop Diorama"

I mocked up three directions on the same elevator composition (`docs/art-directions/directions.png`):

| | Direction | Verdict |
|---|---|---|
| A | **Cut-paper diorama**: layered card stock, soft warm cast shadows, paper grain | **Chosen.** Its layers suit PixiJS parallax, it matches Kenney's soft, flat, outline-free characters, and it keeps the ink-blue force arrows the most legible element on screen. |
| B | Blueprint lab: white line art on blue | Rejected. The force arrows (blue) disappear into the field, and it looks like a technical drawing, not a game. |
| C | Retro science poster: three-ink flat geometry | Its palette discipline was kept, but on its own it is too austere for 152 varied places. |

Rules used throughout:

- **Palette.** Warm paper (#f3e6d0), plum-black ink (#2b2130), tomato, teal, plum and mustard accents.
- **Shadows.** They lean warm plum, never grey. Every piece casts a soft paper shadow and has a lighter top edge.
- **Level identities.** Tomato for Basics, teal for Angles, plum for Systems: the menu headers, tags and active tab.
- **Force overlay.** Ink-blue arrows with white halos on top of everything. No scenery uses that saturated blue. A dashed motion cue sits in a separate annotation layer.
- **Type.** Bricolage Grotesque for display; Lexend for reading.
- **Dark theme.** "Night workshop": a deep plum interface, a moonlit window in the menu, and a dimming canvas filter on the scenes, so they don't look inverted.

## Architecture

```text
 teacher engine (classic script, unmodified)       arcade layer (ES modules, bundled)
 ─────────────────────────────────────────         ─────────────────────────────────────
 LEVELS / scenarios / graders / UI flow  ◀─wraps── bridge.js (load, submit, setStep…)
 scene() closures → helper calls         ◀─records─ capture.js → compose.js → PixiJS layers
 SVG overlay (#guides #arrows #axes)       shares   game-scene.js (same world transform)
 DOM ids (checklist, magpanel, picker…)    styled   index.html + main.css
```

- **Layers in each scene.** Backdrop (one raster of the environment plus static set pieces) → Kenney decor → mid (ropes, springs, set props) → actors (objects, people) → front (water, pulleys) → fx (velocity and acceleration markers).
- **Annotation layer.** Motion cues, angle marks, name labels and the elevator's floor display are SVG text in `#infoLayer`, crisp and in world coordinates, between the art and the engine's overlay.
- **Animation registry.** Each composer gives its scene a motion rig (`elevator`, `shaftLift`, `translate`, `fall` or `rest`) built from the captured motion cue (direction plus "speeding up", "slowing down" or "constant speed"). The acceleration direction is the engine's own `axisInfo` for the answer key's net force. Kinematics are normalized: no invented speeds, times or distances.
- **Shared textures.** Rasters are cached by key and reference-counted per scene build, so fast scene switching never frees a texture another scene still shows.
- **Fallbacks.** If WebGL is unavailable, or the player chooses "original drawings", the teacher's SVG art shows instead and everything else keeps working. If a composer fails, that one scene falls back to its original drawing; the test suite checks that none of the 152 does.
