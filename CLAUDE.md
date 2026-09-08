@AGENTS.md

# Claude Code

For O-Shine art / asset / VFX tasks, use the `oshine-art` skill and follow the repository art job state machine.

Before starting an art task:
- verify `/mcp` shows Meshy and Blender when those tools are required;
- verify `/hooks` shows the repository guard;
- create or activate the job with `node tools/art_pipeline.mjs`.

Do not manually edit `art/jobs/*/job.json`.
