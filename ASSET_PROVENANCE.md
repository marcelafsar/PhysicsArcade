# Asset provenance

Every visual, sound and font in the game, where it came from, and its licence. Nothing is
hotlinked: all files are copied into `assets/` and bundled into the offline HTML.

## Imported packs

| Asset | Source | Licence | Files used | Where it appears |
|---|---|---|---|---|
| **Toon Characters 1** (Kenney, 2019) | https://kenney.nl/assets/toon-characters-1 — downloaded 2026-11-04 through Kenney's own download page | CC0 1.0 (`assets/vendor/kenney/toon-characters/License.txt`) | Vector pose sheets for Female person, Male person, Female adventurer, Male adventurer (`vector/*.svg`) and Kenney's sheet-layout XML | Every person in the scenes (elevator rider, pullers, pushers, skier, climber, parachutist, riders…) and the menu's elevator rider. Rasterized per pose at screen resolution. |
| **Background Elements Redux / Remastered** (Kenney) | https://kenney.nl/assets/background-elements-redux | CC0 1.0 (`assets/vendor/kenney/background-elements/License.txt`) | 32 retina PNGs: clouds, trees, pines (incl. snowy), palms, bushes, fence, houses; plus hill/mountain strips | Outdoor scene decoration (park, snowfield, beach, lawn, city, pond, cliff…) and drifting clouds |
| **Game Icons** (Kenney) | https://kenney.nl/assets/game-icons | CC0 1.0 (`assets/vendor/kenney/game-icons/License.txt`) | 28 white 2× PNG glyphs (gear, home, audio on/off, contrast, return, rewind, fast-forward, cross, trophy, right, video…) | All UI icons, used as CSS masks so they take the theme colour |
| **Interface Sounds** (Kenney) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 24 OGG files (click, select, confirmation, error, toggle, open/close, drop, pluck, tick, glass, scroll…) | UI clicks, step-complete cue, hint cue, label drop, settings, elevator arrival bell |
| **Impact Sounds** (Kenney) | https://kenney.nl/assets/impact-sounds | CC0 1.0 | 13 OGG files (wood, metal, soft, plank, glass, bell, snow footstep…) | Object coming to rest at the end of a "slowing down" replay |
| **UI Audio** (Kenney) | https://kenney.nl/assets/ui-audio | CC0 1.0 | 6 OGG files (rollover, click, switch) | Hover sound on the menu's level tags |

The unused remainder of each pack was not copied into the project.

## Fonts

| Font | Source | Licence | Use |
|---|---|---|---|
| **Lexend** (variable, 400–700, Latin subset) | Google Fonts, https://fonts.google.com/specimen/Lexend | SIL Open Font License 1.1 | All body text. Chosen for reading legibility. Atkinson Hyperlegible was tried first and dropped because its slashed zero made "700 N" read as "7ØØ N". |
| **Bricolage Grotesque** (variable, 700–800, Latin subset) | Google Fonts, https://fonts.google.com/specimen/Bricolage+Grotesque | SIL Open Font License 1.1 | Logo, headings, level tags, scene annotations |

Both are embedded as WOFF2 in the build (`assets/fonts/`).

## Original artwork (made for this project)

Written in code as layered SVG ("cut-paper" pieces with soft cast shadows), rasterized at the
player's screen resolution, and composed and animated with PixiJS. All of it is new; none of the
teacher's original scene SVG is reused in the illustrated mode.

| Set | File | Contents |
|---|---|---|
| Art kit, palette, rasterizer | `src/scene/art/kit.js` | "Workshop Diorama" palette, paper-shadow filters, grain texture, SVG→texture pipeline |
| Props (~85) | `src/scene/art/props.js` | Every object kind in the scenario bank: crates, cartons, microwave, aquarium, sleeping cat, chandelier, piano, punching bag, I-beam, parachute, hot-air balloon, bowling ball, fish, cars, carts, sleds, toboggan, penguin, traffic light, piñata, spotlight, lab masses, paint cans, pulleys… Each one is drawn in the same bounding box as the teacher's object, so contact points and centres of mass are unchanged. |
| Environments (~40) | `src/scene/art/envs.js` | Kitchen, living room, classroom, gym, stage, sunroom, hotel lobby, lab, warehouse, diner, bar, bathroom, store, garage, building cutaway around an elevator shaft, construction site, park, snowfield, beach, lawn, city sidewalk and street, cliff, well, pond, dock, skydiving sky, sunrise, ice rink, bowling alley, baseball infield, football turf, ramps (wood/concrete/metal/water/snow/grass) |
| Menu diorama | `src/scene/menu-diorama.js` | Workshop wall, pegboard, workbench, three working shadow-box machines (elevator, ramp, Atwood pulley) |
| Logo | `index.html` + `src/styles/main.css` | "Physics Arcade" lettering with a force arrow running into the A (pure CSS/type, no image) |
| Rigged arms | `src/scene/compose.js` (`puller`) | Drawn arms (sleeve and skin colours sampled from the Kenney sheets) so a hand lands exactly on any rope or handle angle |

## Synthesized sound (made for this project)

Made at runtime with the Web Audio API in `src/audio.js`, so there are no files:

- **Success chime.** A rising G5–C6–E6–G6 bell arpeggio (inharmonic partials), layered with Kenney's `confirmation_002`.
- **Level-complete fanfare.**
- **Machinery hum.** The elevator motor; its pitch and volume follow the replay's speed.
- **Friction hiss.** Band-passed noise that fades as a sliding object slows.
- **Wind.** Used while falling.
- **Optional background music.** A generative pentatonic marimba loop, off by default.
- **Fallback tones** for every cue, for browsers that cannot decode OGG.

## Services evaluated but not used

| Service | Finding | Decision |
|---|---|---|
| **Rive** (agent CLI, https://rive.app/cli) | The CLI runs on Windows and builds files without signing in. However, free exports play a Rive splash screen ("Free exports play a Rive splash screen. Upgrade to remove it"), and clean exports need the paid Cadet plan ($9 per seat per month). | Not installed and not shipped, to avoid a splash screen in a classroom game. The animated rigs (elevator, pulley, puller arms, menu machines) are built in PixiJS instead. If you want Rive, buy the Cadet plan; the menu machines would be the natural first candidates. |
| **Adobe Firefly** | No authorized Firefly API credentials were available in this environment. | Not used. All art is the original code-authored work above plus CC0 Kenney packs. |

## Teacher-authored content (unchanged)

`Free+Body+Diagram+Practice.html` holds the teacher's 152 scenarios, graders, hints and
explanations. Its `<script>` is copied byte-for-byte to `src/teacher/fbd-original.js` and runs
unmodified inside the game. A verbatim backup is kept in `backup/`.
