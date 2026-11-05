# Physics Arcade — Development Roadmap

**Version:** Planning brief 1.0 — November 4, 2026  
**Current playable prototype:** `Physics_Arcade_Phase_1.html`  
**Owner/subject:** Classroom Free Body Diagram Practice redesign

## 1. Non-negotiable constraints

- Preserve **all 152 existing scenarios**: 52 Basics, 50 Angles, 50 Systems. Preserve the literal scenario descriptions, givens, force labels, exact numeric values, expected force directions, answer keys, hints, explanations, and grading rules. No AI rewrite or re-generated numbers.
- Preserve the three-step exercise flow: identify forces → place and label force vectors → set magnitudes. Preserve the first-attempt mastery rule (five fully correct diagrams per level) unless the teacher explicitly authorizes a scoring change.
- All three levels must be playable immediately, without prerequisites or locking.
- Motion/acceleration demonstrations must be scientifically correct. **Direction of motion and direction of acceleration are not always the same.**
- Preserve responsive layout, pointer/keyboard support, high-contrast vector legibility, reduced-motion preferences, and the ability to disable sound.
- Deliver a standalone HTML file when required for classroom distribution. Development may use multiple source files and a build step; avoid requiring cloud accounts or external CDNs at runtime.

## 2. Status: Phase 1 implemented

The standalone prototype adds:

- Full-screen main menu with three level cards and instant navigation.
- In-game Home button and Settings entry points.
- Light/dark toggle on the menu and in game.
- Configurable sound-effect toggle, volume, animation toggle and high-contrast arrows.
- Synthetic success, incorrect-answer, step-complete and level-complete cues using the browser's Web Audio API (no external audio files).
- Local progress/preferences storage when browser permissions allow it; current scenario is not automatically restored after reload.
- Correct-answer celebration ring plus a proof-of-concept elevator cabin animation after an elevator problem is fully solved.
- Interface-spacing, card, type, button and responsive-layout refinements.

The test harness loaded the game and checked all 152 existing solution keys: **0 failing answer keys**. It exercised level selection, menu, settings, theme, and the complete three-step correct-answer path for the elevator, with **no JavaScript runtime errors in that test**. The scenario-bank declaration block was compared byte-for-byte with the original and was unchanged.

### What Phase 1 intentionally does NOT do

The actual in-problem scene drawings remain the teacher's original SVG artwork, except that the elevator car is now grouped for animation. The large visual overhaul, scenario animation catalogue, custom sound samples, music, deeper gamification and teacher analytics are NOT yet finished. The elevator animation is a stylized proof of concept, not a real-time physical simulation.

## 3. Proposed final creative direction

**Art direction:** "modern illustrated physics lab": premium 2D/2.5D scenery, readable shapes, soft but not childish lighting, consistent scale, sparse motion graphics, clear focus on the diagram. Avoid low-resolution clip art, harsh default gradients, unnecessary particle spam, and a confusing 3D camera.

**Core layout:** one central, large scene pane; a compact scenario strip above; right-hand contextual tools that change with the active step; unobstructed force-vector overlay. A collapsible Help panel replaces the enormous permanent instructional block after the first tutorial.

**Interaction:** click or drag directly on the diagram; immediate directional preview; magnet/snapping assistance where applicable; micro-feedback, pause, restart, inspect answer after appropriate hinting.

## 4. Recommended software / art pipeline

| Role | Recommended tool | Why / caveat |
|---|---|---|
| 2D game renderer | **PixiJS v8** | Fast sprite rendering and layered, animated scenes. Replace the old SVG *art layer*, not the precise force-arrow mathematics. PixiJS does not create artwork automatically. |
| Source illustrations | **Kenney CC0 packs + custom layered art** | Clean, legally simple assets; supplement with custom generated or designer-produced scenarios so all 152 have one visual language. |
| Generated visual concepts | **Adobe Firefly** (optional) | Good for reference boards, scene concepts and coherent art exploration; generated outputs still need cropping, layering and cleanup before use as game assets. |
| Premium animated vector assets | **Rive** (optional) | Interactive rigs/state machines for a person, elevator, pulley and other reusable actors. Its official pricing currently distinguishes free creation from paid production export. Avoid relying on Rive for every individual scene. |
| Sound effects | **Web Audio API** (prototype), then licensed WAV/OGG samples and optionally **howler.js** | Accessible volume/mute and reliable audio. Respect classroom use; no autoplay music by default. |

**Alternative:** Phaser 4 is a full HTML game framework and is appropriate if a broad engine rewrite becomes necessary. However, for this existing diagram-centric application, adopting PixiJS as a *scene renderer* while preserving the proven HTML controls and precise SVG vector overlay minimizes risk.

**Compatibility rule:** The existing scene is 640 × 440 SVG coordinates. Maintain a stable coordinate mapping between the new scene renderer and the vector interaction layer. Never move the physics anchor points or arbitrarily rescale one layer without the other.

## 5. Animation and lesson design

Build **reusable outcome animations**, not 152 bespoke animations. A first library could cover:

| Template | Scenario examples | Correct visual behavior |
|---|---|---|
| Elevator ascent | Elevator starting up | Cabin and person rise; upward acceleration; normal force > gravity |
| Elevator descending and slowing | Elevator arriving at lobby | Cabin moves down while slowing; upward acceleration |
| Elevator descending and speeding up | Elevator starting down | Cabin moves down while speeding up; downward acceleration |
| Sliding resistance | Hockey puck, sled, skidding car | Object slides in motion direction and slows because friction opposes velocity |
| Constant-velocity motion | Rolling ball, lifting bucket | Continues moving without implying net force in travel direction |
| Hanging equilibrium | Plant, fish, balloon | Subtle idle sway if appropriate; no net translation |
| Free fall / drag | Skydivers | Falling motion; appropriate velocity and drag cues |
| Pulleys and linked objects | Level 3 systems | Connected objects move together with consistent rope constraints |
| Inclined planes | Level 2 car/cart | Motion stays on ramp; vector overlay remains accurately oriented |

**Outcome trigger:** Only after `gradeAny(...)` reports a fully correct final solution; never animate the correct outcome before a student has completed the activity. Let learners choose Replay and Slow Motion without changing the scenario answer.

**Pedagogical cue:** Display **Velocity** and **Acceleration** as separate optional labels, not as synonymous arrows. Students can hide animation and still read the exact original explanation.

## 6. Product phases

### Phase 2 — Visual art pilot

1. Choose one final art style and build a mini asset guide (palette, vector stroke widths, lighting, character proportions, backgrounds and UI component rules).
2. Replace the original elevator illustration with a layered, high-quality sprite or Rive asset; keep the force diagram and center of mass accurately aligned.
3. Build and verify three elevator outcomes: speed up upward, slow down while moving downward, speed up downward.
4. Produce equivalent style reference art for one incline, one pulley, and one moving car before mass-converting scenes.
5. Add a Replay button, optional velocity/acceleration display, and classroom-safe sound cues.

### Phase 3 — Consistent scenarios

1. Audit and tag all 152 scenarios by visual and animation archetype (do not edit the scenario bank text).
2. Convert or skin existing scene art with reusable backgrounds, characters, props, surfaces and machines.
3. Use a static fallback for any unsupported scene; never block a lesson because animation assets are missing.
4. Optimize asset memory, device pixel ratio, resize behavior and scene transition time.

### Phase 4 — Better gameplay

1. Add a 45-second interactive tutorial for the three-step force-diagram process, skippable and replayable.
2. Make the Help/Force Legend collapsible and contextual to the current step.
3. Add a scenario browser/search for a teacher's assignment or a student's chosen topic.
4. Add optional achievement feedback (not a new grading rule), a personal practice streak, and scenario completion badges.
5. Keep "New situation" and immediate level switching.

### Phase 5 — Teacher quality / release

1. Run automated answer-key self-tests and browser interaction tests for all levels.
2. Test both themes, mute, reduced motion, keyboard and touch, offline behavior, and classroom laptops.
3. Provide a teacher preview/export workflow. The current `#teacher` shortcut is *not secure access control*; if used for real graded assessments, solutions and answer data must be access-controlled appropriately.
4. Validate with the physics teacher before claiming instructional correctness or assessment readiness.
5. Produce a final self-contained offline HTML bundle if that remains a hard requirement.

## 7. Claude / Codex implementation handoff — next task

> You are upgrading `Physics_Arcade_Phase_1.html`, a standalone educational free-body-diagram game. The initial version contains 152 physics scenarios in three banks, known-good grading functions, a menu, settings, optional sound, and prototype elevator animation. **Do not touch any scenario's ID, prompt, givens, numerical values, forces, correct directions, answers, feedback hints, explanations, the three-step grading logic, or mastery rule.** Begin by creating a verified backup, extracting a read-only scenario-content module and adding a stable scene-rendering adapter. Implement a polished, layered **elevator scene pilot** using PixiJS v8 (or explain explicitly why another renderer is superior) while retaining precise, interactive SVG force vectors above the visual scene. Introduce a simple data-driven outcome-animation registry keyed by scenario ID and ensure the three elevator scenarios have correct velocity-versus-acceleration behavior. Provide replay and mute support. Do not rely on CDN assets in the final offline build. Do not convert all 152 scenarios before the elevator pilot is reviewed. Provide automated or scripted checks showing all 152 original answer keys still pass, correct level selection, and working touch/mouse arrows. Test at 390px mobile and 1360px desktop. Deliver source files plus a buildable standalone HTML. Clearly distinguish a complete implementation from placeholders.

## 8. Non-priority ideas to avoid for now

- Mandatory sequential level unlocking.
- Altering teacher-authored problems to fit new art.
- A physics engine that overrides the original answer key or invents accelerations not given in the prompt.
- Online accounts, tracking, ads, paywalls, or forced social features.
- Simulated teacher security using a hidden UI panel.
- One-off animations for every scenario before building a reusable template system.

## Source references (tool choices)

- PixiJS rendering: https://pixijs.download/v8.14.3/docs/rendering.html
- Rive interactive motion: https://rive.app/features
- Rive pricing: https://rive.app/pricing
- Kenney asset licensing: https://kenney.nl/support
- Phaser 4 framework: https://www.phaser.io/oss/docs/phaser/getting-started/what-is-phaser
- Howler audio: https://howlerjs.com/
- Adobe Firefly custom models: https://helpx.adobe.com/firefly/web/custom-models/get-started-with-custom-models/generate-and-edit-images-with-custom-models.html
