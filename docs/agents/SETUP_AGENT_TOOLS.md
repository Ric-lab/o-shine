# O-Shine Agent Tool Setup

## Important: repository files are necessary, but not sufficient by themselves

Committing this package makes the **instructions, skills, hooks, schemas, and pipeline state machine** travel with the repository.

Each computer that will actually produce assets still needs a **one-time local tool setup**:

- Meshy API credentials must exist outside Git;
- Blender + Blender MCP addon must be installed;
- Blender must be running with the MCP server started for Blender tool calls;
- Claude Code must approve project MCP servers once;
- Antigravity must have the `oshine-art` workspace rule set to Always On;
- Codex needs its user-level Meshy/Blender MCP registrations.

Once those one-time steps are complete, normal future work starts by opening the repo and giving the agent the task.

This repository contains the instructions and workflow, but each workstation still needs access to Meshy and Blender.

## 1. Copy these files to the repository root

Keep the directory structure exactly as provided.

Commit them to Git so the agent instructions and skills travel with the repository.

Do **not** commit your Meshy API key.

## 2. Run the Windows setup helper

From PowerShell in the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\setup_agent_tools.ps1
```

The helper:

- checks Node/npm;
- checks `uvx`;
- securely asks for the Meshy API key and stores it as a Windows user environment variable;
- installs/updates the Blender MCP addon when `uvx` is available;
- attempts to register Meshy and Blender MCP servers in Codex if Codex is installed;
- prints verification steps.

Restart Claude Code / Codex / Antigravity after changing environment variables.

## 3. Blender MCP

Install `uv` with its official installer if `uvx` is missing.

Then:

```powershell
uvx blender-mcp install-addon
```

In Blender:

1. Edit -> Preferences -> Add-ons.
2. Enable the Blender MCP addon.
3. In a 3D viewport press `N`.
4. Open the Blender MCP tab.
5. Start the MCP server.

The default repository config expects:

- host: `localhost`
- port: `9876`

Blender must be running for local Blender MCP calls.

## 4. Meshy

A Meshy API key is required for the official MCP server.

The server is:

`@meshy-ai/meshy-mcp-server`

The repository does not contain the key. Claude expands `MESHY_API_KEY` from the operating-system environment. The setup helper also stores the Meshy MCP secret in Antigravity/Codex user-level configuration, outside Git.

## 5. Claude Code verification

Open Claude Code in the repository and check:

```text
/memory
/skills
/mcp
/hooks
```

Expected:

- root `CLAUDE.md` / `AGENTS.md` instructions visible;
- `oshine-art` skill available;
- `meshy` MCP connected;
- `blender` MCP connected when Blender is running;
- repository `PreToolUse` guard loaded.

Project MCP configuration is committed in `.mcp.json`.

Claude asks once before trusting project MCP servers.

## 6. Codex verification

Codex reads repository `AGENTS.md` and discovers the shared repository skill at:

`.agents/skills/oshine-art/SKILL.md`

After setup/restart, verify:

```powershell
codex mcp list
```

You should see:

- `meshy`
- `blender`

If not, register them manually:

```powershell
codex mcp add meshy -- npx -y @meshy-ai/meshy-mcp-server
codex mcp add blender -- uvx blender-mcp
```

Codex MCP configuration is normally stored in the user's Codex config rather than relying on this repository.

## 7. Antigravity verification

Antigravity reads:

- `.agents/mcp_config.json`
- `.agents/skills/`
- `.agents/rules/`
- `.agents/hooks.json`

Open the Antigravity Customizations / Rules UI and make sure `oshine-art` is set to **Always On**.

Use the MCP manager to confirm Meshy and Blender are connected.

If the GUI cannot find `npx` or `uvx`, restart it after installing tools / changing PATH, or replace the command with the executable's absolute path in your local Antigravity configuration.

## 8. First smoke test

Do not begin with a full game.

Create a pipeline job:

```powershell
node tools/art_pipeline.mjs init pipeline-smoke-test --brief "Create one original royal arcade crown icon and a small win VFX concept."
node tools/art_pipeline.mjs activate pipeline-smoke-test
node tools/art_pipeline.mjs status pipeline-smoke-test
```

Then tell the agent:

> Continue the active O-Shine art job and follow the repository pipeline.

The agent should research and produce the art plan/concept before trying Image-to-3D.

## 9. Approval

When the agent presents a concept and you approve it in chat, it may run:

```powershell
node tools/art_pipeline.mjs approve <job> --file <concept-path>
```

You can also run this command yourself.

Approval is tied to the SHA-256 of that exact file.

## 10. Meshy DCC Bridge

The Meshy DCC Bridge for Blender is optional.

It is useful when you want one-click transfer from the Meshy workspace to a local Blender instance.

The official agent pipeline does not depend on it, because Meshy MCP can generate/download a model and Blender MCP can import/process it.

Do not add Unity to the workflow merely because Meshy also offers a Unity DCC Bridge.


## Cloud-agent limitation

The official Meshy stage is cloud-based, but the current Blender MCP stage is **local**.

Therefore:

- Claude Code / Codex / Antigravity running on the same PC as Blender can use the full pipeline.
- A fully remote/cloud Codex session cannot control your local Blender merely because these files are in Git.
- To run the entire pipeline with the PC off, Blender itself would also need to run in a reachable cloud/remote environment.

This is an infrastructure limitation, not an instruction-file limitation.


## Codex project hooks

This package also includes:

- `.codex/config.toml` with `[features] hooks = true`
- `.codex/hooks.json` with the same art-stage guard

Codex requires the repository/config layer and non-managed hook to be trusted before the hook can run.
Verify the hook in the Codex UI/CLI after opening the repository.

Important: Codex hooks have changed across 2026 releases and have had regressions. The durable behavior is:
`AGENTS.md` + `.agents/skills/oshine-art/SKILL.md` + `tools/art_pipeline.mjs`.
Treat the Codex hook as an additional enforcement layer that must be verified on the installed version.

## Repository self-check

After extracting the package at the repository root:

```powershell
node tools/pipeline_doctor.mjs
```

A PASS means the required repository files are present and parse correctly.
It does not prove that Meshy/Blender are connected or that each client's hook has been trusted.


## Codex Desktop on Windows — skill discovery fallback

As of late August 2026 there is an open Codex Desktop/Windows regression where documented
repository skills under `.agents/skills/` may fail to appear in the Available Skills UI.

This package does not rely on that UI.

`AGENTS.md` explicitly tells Codex to read:

`docs/agents/O_SHINE_ART_PIPELINE.md`

and:

`.agents/skills/oshine-art/SKILL.md`

directly when automatic skill discovery is unavailable.

Therefore the workflow instructions remain available even if the skill selector is affected.
