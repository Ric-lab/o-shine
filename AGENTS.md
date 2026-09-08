# O-Shine — Agent Instructions

These instructions are authoritative for this repository.

## Locked product decisions

- O-Shine is an Android casual arcade / simulated-casino hub with **no real-money gambling**.
- Keep the application stack: **React 19 + Vite + Canvas/Matter.js + Capacitor**.
- Do **not** migrate the game to Unity, Godot, or another engine unless the director explicitly reopens that decision.
- Do not add a backend or permanent server dependency.
- Preserve existing player persistence keys. In particular, never rename:
  - `bplm.gameLogic.v1`
  - `bplm.audio.v1`
  - `bplm.theme.v1`
  - `bplm.cloud.v2`

## Authoritative art pipeline

For every task involving game art, visual redesign, 2D concepts, 3D assets, sprites, sprite sheets, VFX, or a new minigame visual package:

1. Read `docs/agents/O_SHINE_ART_PIPELINE.md`.
2. Use the `oshine-art` skill when your client supports skills.
   - Claude Code project skill: `.claude/skills/oshine-art/SKILL.md`
   - Codex + Antigravity shared project skill: `.agents/skills/oshine-art/SKILL.md`
3. Create or activate an art job with `node tools/art_pipeline.mjs`.
4. Work through the job stages in order. Do not skip stages.
5. Never start production 3D before an approved 2D concept exists.
6. All production 3D assets follow **Meshy image generation -> director-approved reference -> Meshy Image-to-3D -> Blender -> 2.5D render**.
7. The agent must research benchmarks before deciding the theme and asset inventory. Do not stop at generic labels such as "slot symbols"; decide which symbols, why they belong to the theme, and their gameplay/visual hierarchy.
8. Blender is the final studio: camera, lighting, framing, transparent render, sprite-sheet rendering, and consistency.
9. The game ships 2D outputs (PNG / atlas / sprite sheet), not runtime 3D models.
10. Premium VFX are asset-first: pre-rendered flipbooks/sprite sheets or sprite-based particles. Code may choreograph, transform, and play them; CSS/DOM must not be the primary renderer for premium gameplay VFX.
11. SFX is a separate workflow and is not part of the visual pipeline unless explicitly requested.
12. Before claiming completion, visually inspect the final render against the approved reference and run `node tools/art_pipeline.mjs verify <job>`.

## Editorial approval

The approved concept image is the editorial contract.

- The agent may research, propose, generate, and revise concepts.
- The agent must not assume approval.
- Only run `node tools/art_pipeline.mjs approve ...` after the director explicitly approves the referenced concept in the conversation or directly runs the command.
- An approval is bound to the concept file hash. If the concept changes, approval becomes invalid.

## State management

Do not manually edit `art/jobs/*/job.json`. Use `node tools/art_pipeline.mjs ...`.

When an art job is active, `art/ACTIVE_JOB` contains its slug. Hooks use this state to prevent accidental stage skipping.

## Old documentation

Older project documents may describe obsolete art or rendering decisions. If they conflict with this file or `docs/agents/O_SHINE_ART_PIPELINE.md`, the newer pipeline wins.

## Tool expectations

For visual asset work the expected toolchain is:

- Web/browser research for benchmarks.
- Meshy MCP for concept image generation and Image-to-3D.
- Blender MCP for Blender operations and visual iteration.
- Repository scripts for state, QA records, and pipeline checks.

Do not replace Meshy with a client-native image generator merely because it is convenient. The pipeline must remain portable across Claude Code, Codex, and Antigravity.

## DCC Bridge

Meshy's DCC Bridge may be used as a convenience for moving a Meshy model into Blender when both applications are local. It is not the source of truth and must not bypass the job state, approved concept, Blender studio, or QA gates.

## Client discovery fallback

The pipeline must not depend on a client's skill-discovery UI.

If `oshine-art` is not listed as an available skill:
1. read `docs/agents/O_SHINE_ART_PIPELINE.md`;
2. read the applicable `SKILL.md` file directly;
3. continue using `tools/art_pipeline.mjs` and the active job state.

Do not treat a missing skill-menu entry as permission to bypass the pipeline.
