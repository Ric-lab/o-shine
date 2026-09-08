#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let input = {};
try { input = raw.trim() ? JSON.parse(raw) : {}; }
catch { process.exit(0); }

const isAntigravity = !!input.toolCall;
const isCodex = !isAntigravity && ('turn_id' in input || 'agent_id' in input || 'permission_mode' in input);
const toolName = isAntigravity ? (input.toolCall?.name ?? '') : (input.tool_name ?? '');
const args = isAntigravity ? (input.toolCall?.args ?? {}) : (input.tool_input ?? {});

function antigravity(decision, reason) {
  process.stdout.write(JSON.stringify({ decision, reason }));
  process.exit(0);
}

function allow() {
  if (isAntigravity) antigravity('allow', 'O-Shine art guard: no blocking condition.');
  process.exit(0);
}

function deny(reason) {
  if (isAntigravity) antigravity('deny', reason);

  if (isCodex) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason
      }
    }));
    process.exit(0);
  }

  // Claude Code: exit 2 on PreToolUse is an unconditional block.
  console.error(reason);
  process.exit(2);
}

function findRoot() {
  const candidates = [];
  if (input.cwd) candidates.push(input.cwd);
  if (Array.isArray(input.workspacePaths)) candidates.push(...input.workspacePaths);
  candidates.push(process.cwd());

  for (const start of candidates) {
    let current = path.resolve(start);
    while (true) {
      if (fs.existsSync(path.join(current, 'AGENTS.md')) &&
          fs.existsSync(path.join(current, 'tools', 'art_pipeline.mjs'))) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return process.cwd();
}

const root = findRoot();
const activeFile = path.join(root, 'art', 'ACTIVE_JOB');

if (!fs.existsSync(activeFile)) allow();

const slug = fs.readFileSync(activeFile, 'utf8').trim();
if (!slug) allow();

const jobFile = path.join(root, 'art', 'jobs', slug, 'job.json');
if (!fs.existsSync(jobFile)) deny(`O-Shine art guard: active job '${slug}' has no job.json.`);

let job;
try { job = JSON.parse(fs.readFileSync(jobFile, 'utf8')); }
catch { deny(`O-Shine art guard: invalid job.json for '${slug}'.`); }

const order = [
  'BRIEFED','RESEARCHED','ART_DIRECTED','CONCEPT_GENERATED','CONCEPT_APPROVED',
  'MODEL_GENERATED','BLENDER_RENDERED','VISUAL_QA_PASSED','VFX_COMPLETED',
  'INTEGRATED','FINAL_QA_PASSED','DONE'
];

function atLeast(stage) {
  return order.indexOf(job.stage) >= order.indexOf(stage);
}

function flatten(obj) {
  try { return JSON.stringify(obj).toLowerCase(); }
  catch { return String(obj).toLowerCase(); }
}

const name = toolName.toLowerCase();
const payload = flatten(args);

// Protect state file from ad-hoc edits. The pipeline CLI is the state writer.
const targetsState =
  payload.includes('art/jobs/') && payload.includes('job.json');
const isPipelineCli = payload.includes('art_pipeline.mjs');

if (targetsState && !isPipelineCli) {
  deny(`O-Shine art guard: do not directly edit ${slug}/job.json. Use node tools/art_pipeline.mjs.`);
}

// Meshy production 3D must come only after approval.
if (name.includes('meshy') &&
    (name.includes('text_to_3d') || name.includes('text-to-3d') || name.includes('creative_lab'))) {
  deny('O-Shine art guard: production Text-to-3D / Creative Lab shortcuts are forbidden. Use approved concept -> Meshy Image-to-3D.');
}

const imageTo3d =
  name.includes('meshy') &&
  (name.includes('image_to_3d') || name.includes('image-to-3d') ||
   name.includes('multi_image_to_3d') || name.includes('multi-image-to-3d'));

if (imageTo3d && !atLeast('CONCEPT_APPROVED')) {
  deny(`O-Shine art guard: Meshy Image-to-3D blocked. Active job '${slug}' is ${job.stage}; requires CONCEPT_APPROVED.`);
}

// MCP clients may expose Blender tools either namespaced (mcp__blender__...) or bare.
const bareBlenderTools = new Set([
  'get_scene_info',
  'get_object_info',
  'get_viewport_screenshot',
  'execute_blender_code',
  'search_polyhaven_assets',
  'download_polyhaven_asset',
  'set_texture',
  'search_sketchfab_models',
  'download_sketchfab_model',
  'search_polypizza_models',
  'download_polypizza_model',
  'generate_hyper3d_model_via_text',
  'generate_hyper3d_model_via_images',
  'poll_rodin_job_status',
  'import_generated_asset',
  'generate_hunyuan3d_model',
  'import_generated_asset_hunyuan'
]);

const isBlenderTool =
  name.includes('blender') ||
  name.startsWith('mcp__blender__') ||
  bareBlenderTools.has(name);

if (isBlenderTool && !atLeast('MODEL_GENERATED')) {
  deny(`O-Shine art guard: Blender production blocked for active job '${slug}' at ${job.stage}; record the Meshy model first.`);
}

// Guard shell bypasses.
if ((name === 'bash' || name === 'run_command' || name.includes('shell') || name === 'powershell') &&
    (payload.includes('text-to-3d') || payload.includes('text_to_3d')) &&
    payload.includes('meshy')) {
  deny('O-Shine art guard: do not bypass the approved-reference pipeline with Meshy Text-to-3D.');
}

allow();
