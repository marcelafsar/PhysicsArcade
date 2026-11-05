# PHYSICS ARCADE — Full AI-Owned Rebuild Brief

**Issued:** November 4, 2026  
**Implementation agent:** Claude Code / Claude Desktop with local file and terminal access  
**Target:** A polished, animated, classroom-ready physics game, produced by the coding agent end-to-end  
**Inputs:** `Physics_Arcade_Phase_1.html`, `Physics_Arcade_Development_Plan.md`, and teacher-original `Free Body Diagram Practice.html` (copy the teacher-original file into the project folder if it is not already there).

## 0. Mission and creative reset

The current prototype works educationally, but its visuals do not meet the desired quality bar. Treat its menu and game illustrations as expendable. **Do not cosmetically restyle the current hero/banner/cards and declare victory.** Redesign the experience like a purpose-built 2D science game with professionally coherent art direction, scene staging, motion, feedback and interaction. Think museum-quality interactive physics simulator plus polished indie game rather than a business dashboard, generic SaaS page, admin UI, or AI template.

The human is the product owner/reviewer, **not the asset artist, rigger, programmer or integrator**. Do all feasible source research, asset collection, coding, rigging/animation, sound production, integration, testing and final packaging yourself using your terminal, browser, available tools and permitted accounts. Do not outsource steps to the user by producing lists of things they must draw, crop, import or code. Only stop for a necessary user authorization, provider credentials, a paid purchase, or a major pedagogical choice the original sources cannot resolve. Work around unavailable optional tools without fabricating integrations.

The end user is a student in a physics class. The educational content and correctness are paramount, while the presentation must feel like a real game.

## 1. Hard constraints — never modify

- **Exactly preserve all 152 existing scenario definitions:** 52 Level 1 Basics, 50 Level 2 Angles, 50 Level 3 Systems. Maintain IDs, titles, exact scenario prompt text, givens, numeric values, answer forces, accepted alternate labels, directions, hints, explanations, axes/anchors and solution criteria. Never regenerate, reword, simplify, or invent problems.
- **Preserve the three-step instructional flow:** identify forces, choose directions, set magnitudes; retain working support for separate objects/diagrams in advanced scenarios.
- **Preserve all grading rules and the current five-first-try mastery behavior per level** unless the teacher explicitly approves changes. Decorative game rewards never affect physics grades.
- All three levels are unlocked and accessible from the first screen. Switching is always possible; never require completing Level 1 first.
- Treat the original teacher HTML as an independent baseline, not just the Phase 1 HTML. Snapshot/compare all educational data and regression-test against it.
- Maintain correct velocity-versus-acceleration distinctions. If the physical motion data are not sufficient for a quantitative simulation, show a qualitative animation without inventing specific real-world speeds, times, or acceleration values.
- No paid, unlicensed, undisclosed or hotlinked game assets. Build must work without account login or external services for students.
- Audio must be user-mutable; respect reduced-motion, accessible legibility, keyboard and touch.

## 2. Art direction and UI acceptance criteria

**Avoid:** giant navy/purple gradient hero, three identical white cards, overlarge marketing headings, generic faux-glass panels, random emojis, emoji as a complete illustration, simplistic stick or block human figures, random generic icons, decorative confetti everywhere, thin unreadable arrows, oversized permanent instruction text, busy particles, fake 3D, and inconsistent styles across scenes.

**Instead build:**
- A distinctive game identity and logo treatment; visual system with controlled colors, type scale, spacing, textures, icons, borders, and lighting.
- A purposeful title/menu screen with interactive visual storytelling: a beautifully built physics diorama or layered demonstration that subtly animates. Level selection should have meaningful subject-specific illustrations, not three interchangeable generic cards.
- Three clearly selectable levels (Basics, Angles, Systems), Continue/Resume, quick light/dark switch, and Settings easily visible. Mastery may be displayed without making the player feel graded every second.
- Gameplay screen centered on one large, attractive, legible interactive scene. Scenario brief/givens should remain easily readable; show compact progress and contextual tool panel, with collapsible instructions and force legend.
- Force-arrow layer must be crisp, high contrast, precisely aligned, and visually distinct from scenery, with obvious drag handles, force labels, directional snap feedback, consistent 1-dot-to-N scale.
- Pleasant transitions and micro-interactions that serve the lesson. Desktop and mobile layouts should each feel intentionally designed, not simply collapsed.
- Two themes: light and dark from the front page and gameplay. Both should be visually refined, not merely inverted backgrounds.

### Visual review gate

Before batch-producing art, build and **visually inspect** an actual menu, one elevator, one incline, and one pulley composition. Save screenshots. If any looks like the old template or inconsistent with the others, redesign before scaling. After that, continue autonomously to completion; do not stop at the pilot.

## 3. Toolchain — have AI actually operate these tools

### PixiJS — default scene renderer

Use a modern supported PixiJS v8 release for the animated scene stage. Render with PixiJS sprites/layers and reuse background environments, actors, props, and lighting. Do **not** rewrite working grade math in PixiJS; retain a separate accurate vector interaction overlay (e.g. SVG/HTML) tied to the scene's shared world coordinate system. The current diagram viewBox uses 640 x 440: preserve the transforms, anchor points, cross-level axes, and pointer coordinate conversion.

Install with a reproducible package manager lockfile and bundler (e.g. Vite). Prefer stable WebGL for broad school device support. Do not rely on a remote CDN at runtime.

### Rive — advanced art/animation where useful

Rive now has a Windows-compatible agent/CLI workflow: https://rive.app/agents and https://rive.app/cli . Inspect official instructions, then install/operate its CLI if compatible with the environment. Where it clearly improves quality, generate rigged character and machine animations (elevator, pulley, people, moving mechanisms) with reusable state machines; export and integrate the real resulting assets, not mocks. Check export limitations and licensing. If runtime export requires paid access or the CLI cannot reliably produce the required quality, use layered PixiJS sprites, GSAP-like JS timelines, or another licensed solution instead. Do not block completion on Rive.

### Kenney — sourced production assets

Browse https://kenney.nl/assets for relevant free packs (scenery, interface, props, UI, sound). Download assets and inspect license metadata; Kenney's asset-page packs are generally CC0. Organize imported assets by source and use them in actual rendered scenes. **Do not paste URLs into the game and call it a completed asset pipeline.** If no fitting asset exists, create/commission through an available generator, or author consistent bespoke vector/raster art with your tooling. Avoid an inconsistent collage of unrelated packs.

### Adobe Firefly — optional art generation

Use Adobe Firefly when a suitable accessible account/API is actually authorized. Its API typically requires separately configured organization access and secure OAuth credentials; never ask for secrets in chat and never embed credentials in the client bundle. Firefly artwork should be designed as a production asset: consistent style/scene direction, cropped into independent layers when animation needs it, appropriate resolution, transparent cutouts where possible, verified permissions, optimized sizes. No need to force this provider if inaccessible; use available local/licensed AI art tools and the Kenney pipeline instead.

### Audio

Produce and integrate cohesive UI hover/click, selection, submit, success (clear, pleasant check-mark sound), incorrect/hint, level-complete and machinery/motion audio. Prefer licensed audio packs or locally synthesized assets; keep a provenance file. No autoplay background music. Provide separate music/SFX mute and volume, plus sound off on the front-page settings.

### Testing and build

Use Playwright or equivalent browser automation for screenshots, functionality, error logs, interactions and screen-size tests. Build source in readable modules and preserve original testable content. Produce an offline launchable output; prefer a **single self-contained HTML** (bundled code, assets, and audio) when it can be delivered at reasonable size. If that makes the distribution impractical, deliver both an explicit offline ZIP package and a lightweight HTML entry point, explain the tradeoff and never require students to run a development server.

## 4. Gameplay behavior and animations

**Primary loop:** Select level -> read one unchanged problem -> identify forces -> place force vectors -> set magnitudes -> correctness check -> short cinematic motion payoff -> next problem or replay. Clear mistakes as useful hints, not as punishments.

Only trigger cinematic outcome animations after successful completion of the third step. Provide replay, skip, slow-motion (when useful), and disable-animation controls. Never allow animated scene art to break the precision of the diagram: pause or hide arrow overlay during cinematic mode, then restore correct placement on replay/explanation.

### Required elevator physics trio

1. **Elevator starting up**: elevator car and person move upward and accelerate upward; normal force > gravity. Use readable foreground/background parallax and floor indicator.
2. **Elevator arriving at the lobby**: car and person move **down** and slow down; their acceleration/net force point **up**. Do not animate this as an ascending elevator.
3. **Elevator starting down**: car and person move **down** and speed up; acceleration/net force down, gravity > normal.

For all three: retain center-of-mass/arrow anchors while student is drawing; show celebratory green check and short success sound on completion; optionally overlay separate Motion and Acceleration indicators to reinforce the distinction; ensure scene animation runs once or replays only when requested.

### Reusable animation archetypes

Build a data-driven animation registry keyed by scenario ID and rendered using reusable behaviors: vertical lift, downward fall with drag, frictional sliding/deceleration, constant-velocity movement, incline movement, spring stretch/recoil, hanging equilibrium, buoyancy/floating, tension/pulley, connected bodies, drag/terminal velocity, vehicle stopping, pushing/pulling. A scenario lacking confidently grounded motion should get beautiful static/semi-animated ambient artwork, not a scientifically false movement.

## 5. Acceptance tests, objective quality bar

Maintain and extend automated tests demonstrating:

1. Scenario bank untouched and same 152 IDs/descriptions/givens/answers/hints/explanations as baseline. Prefer byte-exact content-block comparison plus data-level checks.
2. All 152 original correct answers pass the grader; representative incorrect answers are rejected; force arrows remain interactive with mouse/touch and keyboard alternatives.
3. All levels playable immediately; correct switching without resets, corrupted state, or accidental level completion.
4. Success, incorrect, hint, settings, theme, volume, animation-toggle, replay and next buttons work. No dead or decorative buttons.
5. Elevator animations correctly distinguish velocity from acceleration. Scene stays synchronized with physics anchors on desktop and mobile.
6. Actual assets render; no failed requests, broken images, type/font clipping, console errors or horizontal scrolling.
7. Desktop 1366 x 768, laptop 1280 x 720, tablet 768 x 1024, and phone 390 x 844 at minimum; screenshot each theme and at least one scenario from each level.
8. Offline packaged version works from a normal local HTML file/ZIP without downloading third-party scripts or contacting a server.
9. Run a performance pass on average school-laptop targets; reduce effects if they reduce frame rate or interfere with input.
10. Maintain an `ASSET_PROVENANCE.md` with origin and license of every imported pack or generated visual/sound, and a `TEST_REPORT.md` with commands run and observed results. Only claim tests you actually executed.

## 6. Work plan: autonomously implement, verify, continue

**Stage A — Audit & design**: Back up both HTML files. Read and understand current render/interaction/state/grading architecture and teacher original. Write a short design spec, enumerate scene archetypes, and create a stable architecture. Visualize three candidate distinct artistic directions, select the strongest based on the game brief, not generic trends. Produce an actual menu composition.

**Stage B — Foundation & pilot**: Modularize code without changing scenario data or grading. Install PixiJS and necessary tools. Replace menu. Build layered elevator art and all three correct animations, with replay and audio. Complete automated snapshot and UI tests.

**Stage C — Full-scale visuals**: Acquire/generate coherent licensed assets, create reusable art kits, and update scene representation across all 152 scenarios as appropriate. Do not reduce variety to the same generic background. Use theme-aware readable overlays. Implement animations by archetype.

**Stage D — Game polish**: Improve interactive tutorial, contextual help, transitions, settings, local progress, accessible input, responsive UI, sound design and visual feedback. Retain current problems and mastery rules. Teacher controls should remain local and clearly labeled as unprotected preview tools, not security.

**Stage E — Ship and audit**: Build the offline playable version, generate screenshots/short recorded demos if possible, verify the full 152 answer keys, run gameplay regression tests, inspect appearance, fix defects and deliver a clear `README.md`, `TEST_REPORT.md`, `ASSET_PROVENANCE.md`, and final playable artifact.

## 7. Execution rules

- **Actually perform each stage; don't answer with a plan only.** Begin inspecting and editing files, installing compatible tools, acquiring assets and running tests in the same coding session.
- Use screenshot-based visual critique: evaluate quality, alignment, consistency, legibility, motion feedback and viewport sizes before saying the design is complete. Iterate until it looks deliberately art-directed.
- If a third-party platform is unavailable or costly, use a documented viable replacement automatically, rather than marking the project blocked. Only seek authorization for purchases, paid account use, or restricted credentials.
- Keep your changes reproducible; work in version-controlled commits/checkpoints or maintain good backup copies. Do not overwrite teacher original.
- Distinguish functional production assets from prototypes/mocks and incomplete features. Never claim integration that didn't happen.
- If you run into context limits, create a concise `PROGRESS.md` and continue from that on the next run; don't quietly abandon the remaining stages.
- Protect the project's educational value: correctness is more important than animated spectacle.

## 8. Preferred handoff layout

```text
PhysicsGame/
  Free Body Diagram Practice.html      # immutable teacher original
  Physics_Arcade_Phase_1.html          # immutable playable reference
  Physics_Arcade_Development_Plan.md   # earlier roadmap / educational requirements
  Physics_Arcade_AI_Build_Brief.md     # this delivery brief
  src/                                 # modular source
  assets/                              # copied/license-tracked local source art/audio
  tests/                               # key and interaction checks
  dist/                                # offline game bundle
  README.md
  ASSET_PROVENANCE.md
  TEST_REPORT.md
  PROGRESS.md
```

**Definition of done:** A genuinely improved, visually polished, offline playable physics game with 152 original questions intact, three open levels, refined menus, integrated real art assets, scientifically correct feedback animations and sounds, and a demonstrably passing test suite. A set of mockups or a partially integrated tools demonstration does not satisfy the requirement.
