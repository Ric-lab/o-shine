# O-Shine pipeline tools

## `art_pipeline.mjs`

Durable art-job state machine.

```bash
node tools/art_pipeline.mjs help
```

Agents must use this CLI instead of directly editing `art/jobs/*/job.json`.

## `art_guard.mjs`

Cross-client PreToolUse guard for Claude Code and Antigravity.

It:

- reads `art/ACTIVE_JOB`;
- blocks Meshy Text-to-3D shortcuts;
- blocks Meshy Image-to-3D before concept approval;
- blocks Blender production before the Meshy model is recorded;
- discourages direct state JSON edits.

Codex currently relies primarily on `AGENTS.md`, the project skill, and the state CLI rather than this client hook.

## `setup_agent_tools.ps1`

Windows helper for:

- setting `MESHY_API_KEY` outside Git;
- installing the Blender MCP addon;
- registering Codex MCP servers when Codex CLI is available.

## Windows MCP note

The checked-in project configs use `cmd /c` wrappers where appropriate because Windows GUI/agent clients can fail to spawn bare `npx`/`uvx` commands even when they work in an interactive terminal.

Meshy secrets are never committed to Git.

## `pipeline_doctor.mjs`

Checks that the repository-side pipeline package is installed at the repo root and that key JSON files parse.

It deliberately does not claim MCP connectivity or agent-client trust.
