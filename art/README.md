# O-Shine Art Workspace

This directory stores durable artifacts from the official agentic art pipeline.

## Layout

- `jobs/` — state and planning for each art task/minigame.
- `concepts/` — 2D editorial references generated through Meshy.
- `meshy/models/` — downloaded Meshy production models.
- `renders/` — Blender 2.5D outputs.
- `vfx/` — VFX source frames / atlases.
- `qa/` — comparison sheets and visual QA evidence.
- `schemas/` — JSON schemas for job and art-plan records.

`ACTIVE_JOB` is created by `node tools/art_pipeline.mjs activate <slug>`.

Never manually edit `jobs/<slug>/job.json`; use the CLI.

Use:

```bash
node tools/art_pipeline.mjs help
```
