# O-Shine — Official Agentic Art Pipeline

Status: **AUTHORITATIVE**
Owner: Director
Scope: game art, minigame visual direction, 2D concepts, 3D assets, sprites, sprite sheets, and VFX.

If older O-Shine documentation conflicts with this file, this file wins for the visual production pipeline.

---

## 1. Goal

The pipeline must let Claude Code, Codex, Antigravity, or a future agent produce coherent O-Shine game art without depending on one client's native image generator or on conversational memory.

The process must provide:

- high creative speed;
- market-aware art direction;
- explicit editorial control;
- repeatable 3D production;
- consistent final rendering;
- game-quality VFX;
- visible QA artifacts;
- portability between agents.

The agent is allowed to make creative decisions, but it must make them **before** manufacturing assets.

---

## 2. Official high-level flow

**Brief -> Research -> Art Direction -> Asset/VFX Decomposition -> Meshy Concept Image -> Director Approval -> Meshy Image-to-3D -> Blender -> 2.5D Output -> Visual QA -> VFX -> Integration -> Final QA**

This order is mandatory.

The agent must think broadly first and manufacture narrowly second.

---

## 3. What the agent is responsible for

A brief is intentionally high level.

Example:

> Create Match Machine, a premium casual slot minigame with a royal theme.

The director does not need to pre-list all files or all symbols.

The agent must research and decide:

- what visual subtheme works;
- what the machine needs;
- which symbols exist;
- which symbols are basic / premium / Wild / Scatter;
- how the visual hierarchy works;
- what states need visual feedback;
- which VFX are needed;
- which assets are reusable/modular;
- which outputs need static renders versus multiple frames.

A bad decomposition is:

- machine
- buttons
- slot symbols
- VFX

A useful decomposition is closer to:

- main cabinet
- reel window
- reel separators
- Spin button
- win panel
- jackpot frame
- royal crown (premium)
- red velvet throne (premium)
- silver sword (mid)
- golden chalice (mid)
- shield / gem (low)
- original O-Shine Scatter
- original O-Shine Wild
- reel-stop flash
- winning-symbol glow
- Big Win rays
- coin burst
- Jackpot flipbook

The exact inventory is a design decision, not a fixed template.

---

## 4. Research / benchmark stage

Before generating a concept, research relevant games and visual references.

The goal is not to copy proprietary assets. The goal is to understand market solutions:

- composition;
- silhouette;
- symbol hierarchy;
- thematic vocabulary;
- use of gold/color;
- readability at mobile scale;
- framing;
- animation language;
- win feedback;
- VFX density;
- premium versus low-value symbol differentiation.

Use benchmark knowledge to produce an original O-Shine solution.

Store research in:

`art/jobs/<job>/research.md`

---

## 5. Art direction stage

Translate research into a concrete original direction.

Define:

- theme;
- mood;
- palette intent;
- recurring materials;
- shape language;
- symbol inventory;
- symbol hierarchy;
- special symbols;
- modular UI pieces;
- animation needs;
- VFX inventory.

Write the machine-readable plan to:

`art/jobs/<job>/ART_PLAN.json`

Use `art/schemas/art-plan.schema.json`.

The art plan is allowed to evolve before concept approval. Once production begins, major redesigns should go back through concept approval.

---

## 6. Meshy is the official concept-image generator

The official pipeline does not depend on Nano Banana being native to Antigravity or on any client-specific image tool.

Use Meshy image generation so Claude Code, Codex, and Antigravity use the same external visual service.

Preferred model through Meshy when available:

1. `gpt-image-2`
2. `nano-banana-2` as Meshy fallback

The exact backend model may change without changing the pipeline.

### Concept image purpose

The concept is not the shipping asset.

It is the **editorial contract** that controls:

- silhouette;
- proportions;
- theme;
- visible materials;
- color relationships;
- main details;
- overall quality target.

For related symbols, use a coherent concept board where useful.

For Image-to-3D candidates:

- show the full object;
- keep the silhouette clean;
- avoid unnecessary occlusion;
- avoid complex backgrounds;
- separate important materials visually;
- use useful front / 3/4 / side views when the object needs rotational correctness.

Store selected concepts under:

`art/concepts/<job>/`

---

## 7. Director approval gate

Production 3D cannot start before explicit approval.

The director can revise concepts cheaply at this stage.

Approval is recorded by:

`node tools/art_pipeline.mjs approve <job> --file <concept>`

The command stores a SHA-256 hash.

If the image changes after approval, the hash no longer matches and the 3D gate closes again.

The agent must never interpret silence as approval.

---

## 8. Every production 3D asset uses Meshy -> Blender

There are no routine branches such as:

- "this object is simple, model directly in Blender";
- "this character uses Meshy";
- "this button can skip Meshy".

The standard path is always:

**approved image -> Meshy Image-to-3D -> Blender**

This intentionally trades Meshy credits for:

- speed;
- consistent process;
- simpler instructions;
- less tool-choice ambiguity;
- better agent portability.

### Meshy role

Meshy creates the initial production geometry / texture representation from the approved image.

Use:

- Image-to-3D;
- Multi-Image-to-3D when multiple views materially improve the object.

Do not use Text-to-3D as a shortcut for official production assets because it bypasses the approved visual contract.

Download models under:

`art/meshy/models/<job>/`

---

## 9. Blender role

Blender is not the first art director.

Blender is the **final virtual studio**.

It is responsible for:

- model import;
- orientation;
- centering;
- scale;
- framing;
- small cleanup;
- camera;
- light rig;
- transparent film;
- material adjustments only when needed;
- static rendering;
- rotational rendering;
- animation-frame rendering;
- sprite-sheet preparation;
- visual consistency across assets.

Preserve useful Meshy textures. Do not destroy approved design information merely to replace everything with generic materials.

The approved concept remains the visual target.

---

## 10. The game ships 2.5D, not runtime 3D

No production Meshy model is shipped merely because it exists.

The normal runtime output is 2D.

### Static object

Meshy model -> Blender -> transparent PNG

### Rotating / animated object

Meshy model -> Blender -> 16–32+ rendered frames -> atlas / sprite sheet

Topology perfection is not the goal.

The criterion is:

> Does the object look excellent from the camera(s) used by the game?

Hidden geometry can be imperfect if it never harms the rendered output.

---

## 11. VFX is art-first

Premium game VFX must not look like generic web animation.

Do not build premium gameplay effects primarily from CSS gradients, DOM elements, or ad-hoc box shadows.

### Tier 1 — premium pre-rendered VFX

Use for:

- Big Win;
- Mega Win;
- Jackpot;
- magic;
- fire;
- major flashes;
- rays;
- explosions;
- high-value celebration effects.

Preferred form:

**Blender/visual production -> transparent frame sequence -> flipbook / sprite sheet**

### Tier 2 — sprite particles

Use pre-produced visual assets and let code control:

- spawn count;
- position;
- velocity;
- gravity;
- lifetime;
- rotation;
- scale.

Examples:

- coins;
- stars;
- sparks;
- gems;
- confetti.

### Tier 3 — transforms

Code may directly control:

- scale;
- rotation;
- opacity;
- screen shake;
- squash/stretch;
- simple movement.

These are choreography, not the artwork itself.

---

## 12. SFX is intentionally separate

Do not add audio generation to the visual pipeline by default.

Finish:

- gameplay;
- assets;
- VFX;
- visual integration.

Then a separate audio workflow can map game events to SFX.

This prevents the visual agent from spreading across too many disciplines at once.

---

## 13. Visual QA is mandatory

A successful command or render is not proof of a successful asset.

The agent must inspect:

- approved concept;
- final Blender render;
- related assets together when relevant.

Check:

- silhouette;
- proportions;
- color relationship;
- material read;
- consistent light direction;
- framing;
- clipping;
- transparency;
- mobile readability;
- thematic coherence;
- similarity to the approved editorial target.

Create comparison/contact-sheet evidence under:

`art/qa/<job>/`

If visual QA fails, iterate before integration.

---

## 14. Job state machine

Repository tooling records pipeline state.

Stages:

1. `BRIEFED`
2. `RESEARCHED`
3. `ART_DIRECTED`
4. `CONCEPT_GENERATED`
5. `CONCEPT_APPROVED`
6. `MODEL_GENERATED`
7. `BLENDER_RENDERED`
8. `VISUAL_QA_PASSED`
9. `VFX_COMPLETED`
10. `INTEGRATED`
11. `FINAL_QA_PASSED`
12. `DONE`

Use:

`node tools/art_pipeline.mjs help`

Do not manually edit `job.json`.

Hooks can inspect the active state and block common shortcuts.

---

## 15. Toolchain

### Required for the official visual workflow

- browser/web access;
- Meshy MCP;
- Blender MCP;
- Blender;
- repository job-state tooling;
- agent image inspection.

### Optional

- Meshy DCC Bridge, only as transport convenience from Meshy to a local Blender instance.

### Not part of the core pipeline

- Unity;
- Unity MCP;
- Canva;
- client-native image generation;
- SFX generation.

Unity may only be reconsidered for a specialized VFX studio after a real Blender VFX bottleneck is demonstrated and the director explicitly reopens the decision.

---

## 16. DCC Bridge

DCC means **Digital Content Creation**.

Meshy's Blender DCC Bridge can send a Meshy model into a running local Blender environment and handle import/material setup convenience.

It helps reduce manual download/import clicks.

It does **not** replace:

- Meshy MCP;
- the approved concept gate;
- the Blender studio;
- job state;
- visual QA.

For an agent-first workflow, MCP download -> Blender MCP import remains the most portable path. DCC Bridge is a convenience when both Meshy/Blender are being operated locally.

---

## 17. Completion definition

An art job is not complete until:

- research exists;
- an art plan exists;
- a concept is recorded;
- that exact concept hash is approved;
- a Meshy 3D model is recorded;
- a Blender render is recorded;
- visual QA passed with evidence;
- planned VFX are completed or explicitly marked not applicable in the art plan;
- integration is recorded;
- final QA passed;
- `node tools/art_pipeline.mjs verify <job>` passes;
- the job is finalized.

The goal is not to make the agent less creative.

The goal is to make creativity happen in the right stage and production happen through a repeatable factory.
