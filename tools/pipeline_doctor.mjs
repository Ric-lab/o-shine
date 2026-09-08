#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'AGENTS.md',
  'CLAUDE.md',
  '.mcp.json',
  '.claude/settings.json',
  '.claude/skills/oshine-art/SKILL.md',
  '.agents/skills/oshine-art/SKILL.md',
  '.agents/rules/oshine-art.md',
  '.agents/hooks.json',
  '.agents/mcp_config.json',
  '.codex/config.toml',
  '.codex/hooks.json',
  'docs/agents/O_SHINE_ART_PIPELINE.md',
  'tools/art_pipeline.mjs',
  'tools/art_guard.mjs',
  'art/schemas/art-plan.schema.json',
  'art/schemas/art-job.schema.json'
];

let failed = false;
for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`MISSING ${rel}`);
    failed = true;
  }
}

for (const rel of [
  '.mcp.json',
  '.claude/settings.json',
  '.agents/hooks.json',
  '.agents/mcp_config.json',
  '.codex/hooks.json',
  'art/schemas/art-plan.schema.json',
  'art/schemas/art-job.schema.json'
]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  try { JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) {
    console.error(`INVALID JSON ${rel}: ${e.message}`);
    failed = true;
  }
}

if (!process.env.MESHY_API_KEY) {
  console.warn('WARN MESHY_API_KEY is not set in this process. Repo files are fine, but Meshy MCP will need the local secret.');
}

if (failed) process.exit(1);

console.log('PASS repository pipeline structure is present and JSON configs parse.');
console.log('NOTE this does not prove MCP connectivity or client hook trust; verify those inside each client.');
