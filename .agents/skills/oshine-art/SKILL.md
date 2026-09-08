---
name: oshine-art
description: Required O-Shine workflow for game art, minigame visual design, concept images, Meshy 3D assets, Blender rendering, sprites, sprite sheets, and gameplay VFX. Use whenever a task creates or changes visual game assets or visual effects.
---

# O-Shine Art Pipeline

Read `AGENTS.md` and `docs/agents/O_SHINE_ART_PIPELINE.md` before production work.

## Mandatory sequence

1. **Create/activate job**
   - `node tools/art_pipeline.mjs init <slug> --brief "<brief>"` if it does not exist.
   - `node tools/art_pipeline.mjs activate <slug>`.

2. **Research**
   - Research current market/game references before designing.
   - Study composition, theme, symbol hierarchy, visual feedback, win states, and VFX.
   - Produce `art/jobs/<slug>/research.md`.
   - Record it:
     `node tools/art_pipeline.mjs researched <slug> --file art/jobs/<slug>/research.md`.

3. **Art direction and decomposition**
   - Decide a coherent original theme.
   - Go beyond generic categories. Example: do not write only `slot_symbols`; decide concrete symbols such as crown, red throne, silver sword, chalice, shield, gem, Wild, Scatter, with rationale and hierarchy.
   - Create `art/jobs/<slug>/ART_PLAN.json` matching `art/schemas/art-plan.schema.json`.
   - Record it:
     `node tools/art_pipeline.mjs directed <slug> --plan art/jobs/<slug>/ART_PLAN.json`.

4. **Concept generation**
   - Use Meshy image generation for concept boards / approved reference candidates.
   - Prefer `gpt-image-2` through Meshy when available; `nano-banana-2` is an allowed Meshy fallback.
   - Keep the concept useful for Image-to-3D: clean silhouette, full object, clear material separation, limited occlusion, and useful views.
   - Save the selected candidate under `art/concepts/<slug>/`.
   - Record it:
     `node tools/art_pipeline.mjs concept <slug> --file <path>`.

5. **Director approval gate**
   - STOP production 3D until the director explicitly approves the recorded concept.
   - Do not infer approval from silence or earlier approval of another image.
   - After explicit approval only:
     `node tools/art_pipeline.mjs approve <slug> --file <same-concept-path>`.
   - Approval is hash-bound; changing the concept invalidates it.

6. **Meshy Image-to-3D**
   - Use Meshy Image-to-3D or Multi-Image-to-3D from the approved reference.
   - Do not use Text-to-3D as a shortcut for production assets.
   - Poll until complete and download the model into `art/meshy/models/<slug>/`.
   - Record:
     `node tools/art_pipeline.mjs model <slug> --file <model-path> [--task-id <id>]`.

7. **Blender studio**
   - Import the model into the O-Shine Blender studio.
   - Treat the approved concept as the design target. Do not redesign it arbitrarily.
   - Use a consistent studio camera, light rig, framing, transparent film, and output settings.
   - Preserve useful Meshy texture information. Adjust materials only when required for consistency/readability.
   - Static asset -> transparent PNG.
   - Rotating/animated asset -> rendered frames -> sprite sheet/atlas.
   - Record:
     `node tools/art_pipeline.mjs render <slug> --file <render-path>`.

8. **Visual QA**
   - Actually inspect the approved reference and final Blender output.
   - Check silhouette, proportions, palette, material read, framing, transparency, clipping, lighting consistency, and mobile readability.
   - Create a contact sheet or comparison image under `art/qa/<slug>/`.
   - If it fails, iterate in Blender and re-render.
   - When it passes:
     `node tools/art_pipeline.mjs visual-qa <slug> --file <qa-path> --notes "<short assessment>"`.

9. **VFX**
   - Design VFX as game art, not website decoration.
   - Tier 1: pre-rendered flipbook/sprite sheet for premium effects (Big Win, Jackpot, magic, explosion, major glow/rays).
   - Tier 2: sprite assets used as particles (coins, stars, sparks, gems, confetti).
   - Tier 3: code-only transforms (scale, rotate, fade, shake, squash/stretch).
   - Code choreographs VFX; it must not replace premium effect art with improvised CSS/DOM.
   - Record:
     `node tools/art_pipeline.mjs vfx <slug> --path <vfx-output>`.

10. **Integration**
    - Integrate assets into React/Canvas.
    - Keep runtime 3D out of the shipping app.
    - Record:
      `node tools/art_pipeline.mjs integrated <slug>`.

11. **Final QA**
    - Run game tests and visual verification.
    - Record:
      `node tools/art_pipeline.mjs final-qa <slug> --notes "<result>"`.
    - Verify:
      `node tools/art_pipeline.mjs verify <slug>`.
    - Finalize:
      `node tools/art_pipeline.mjs finalize <slug>`.

## Do not

- Do not skip research.
- Do not generate 3D before concept approval.
- Do not use Meshy Text-to-3D for production assets.
- Do not substitute a client-native image generator for Meshy in the official pipeline.
- Do not manually edit job state JSON.
- Do not claim "render succeeded" as visual QA.
- Do not treat CSS/DOM as the premium VFX art pipeline.
- Do not add SFX unless explicitly requested.
- Do not migrate the game to Unity as part of an art task.
