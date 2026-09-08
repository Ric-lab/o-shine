#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const STAGES = [
  'BRIEFED',
  'RESEARCHED',
  'ART_DIRECTED',
  'CONCEPT_GENERATED',
  'CONCEPT_APPROVED',
  'MODEL_GENERATED',
  'BLENDER_RENDERED',
  'VISUAL_QA_PASSED',
  'VFX_COMPLETED',
  'INTEGRATED',
  'FINAL_QA_PASSED',
  'DONE',
];

const cwd = process.cwd();
const artDir = path.join(cwd, 'art');
const jobsDir = path.join(artDir, 'jobs');
const activeFile = path.join(artDir, 'ACTIVE_JOB');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function now() {
  return new Date().toISOString();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugOk(slug) {
  return /^[a-z0-9][a-z0-9_-]*$/.test(slug);
}

function jobDir(slug) {
  return path.join(jobsDir, slug);
}

function jobPath(slug) {
  return path.join(jobDir(slug), 'job.json');
}

function readJob(slug) {
  const p = jobPath(slug);
  if (!fs.existsSync(p)) fail(`Job '${slug}' does not exist. Run init first.`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJob(job) {
  ensureDir(jobDir(job.slug));
  fs.writeFileSync(jobPath(job.slug), JSON.stringify(job, null, 2) + '\n');
}

function stageIndex(stage) {
  return STAGES.indexOf(stage);
}

function requireStage(job, minimum) {
  if (stageIndex(job.stage) < stageIndex(minimum)) {
    fail(`Job '${job.slug}' is at ${job.stage}; requires at least ${minimum}.`);
  }
}

function exactNext(job, next) {
  const expected = STAGES[stageIndex(job.stage) + 1];
  if (expected !== next) {
    fail(`Invalid transition ${job.stage} -> ${next}. Expected next stage: ${expected ?? 'none'}.`);
  }
}

function relOrAbs(p) {
  return path.isAbsolute(p) ? p : path.join(cwd, p);
}

function requireFile(p, label) {
  const absolute = relOrAbs(p);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    fail(`${label} file does not exist: ${p}`);
  }
  return absolute;
}

function requirePath(p, label) {
  const absolute = relOrAbs(p);
  if (!fs.existsSync(absolute)) fail(`${label} path does not exist: ${p}`);
  return absolute;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function history(job, event, data = {}) {
  job.history.push({ at: now(), event, ...data });
}

function getArg(flag, required = true) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) {
    if (required) fail(`Missing ${flag}`);
    return null;
  }
  return process.argv[i + 1];
}

function setStage(job, next) {
  exactNext(job, next);
  job.stage = next;
}

function help() {
  console.log(`
O-Shine art pipeline

Commands:
  init <slug> --brief "<text>"
  activate <slug>
  status [slug]
  researched <slug> --file <research.md>
  directed <slug> --plan <ART_PLAN.json>
  concept <slug> --file <concept-image>
  approve <slug> --file <same-concept-image>
  model <slug> --file <model-file> [--task-id <id>]
  render <slug> --file <render-image>
  visual-qa <slug> --file <qa-evidence> [--notes "<text>"]
  vfx <slug> --path <vfx-output>
  integrated <slug>
  final-qa <slug> [--notes "<text>"]
  verify <slug>
  finalize <slug>

Rules:
- Transitions are sequential.
- Approval is SHA-256-bound to the recorded concept.
- Do not manually edit job.json.
`);
}

const [,, command, slugArg] = process.argv;

ensureDir(jobsDir);

if (!command || command === 'help' || command === '--help' || command === '-h') {
  help();
  process.exit(0);
}

if (command === 'init') {
  const slug = slugArg;
  if (!slug || !slugOk(slug)) fail('Use a lowercase slug: letters, numbers, _ or -.');
  if (fs.existsSync(jobPath(slug))) fail(`Job '${slug}' already exists.`);
  const brief = getArg('--brief');
  const job = {
    schemaVersion: 1,
    slug,
    brief,
    createdAt: now(),
    updatedAt: now(),
    stage: 'BRIEFED',
    research: { file: null },
    artDirection: { plan: null },
    concept: { file: null, sha256: null },
    approval: { approved: false, conceptSha256: null, approvedAt: null },
    model: { file: null, taskId: null },
    render: { file: null },
    visualQa: { passed: false, evidence: null, notes: null },
    vfx: { completed: false, path: null },
    integration: { completed: false },
    finalQa: { passed: false, notes: null },
    history: [{ at: now(), event: 'JOB_CREATED', stage: 'BRIEFED' }],
  };
  writeJob(job);
  ensureDir(path.join(artDir, 'concepts', slug));
  ensureDir(path.join(artDir, 'meshy', 'models', slug));
  ensureDir(path.join(artDir, 'renders', slug));
  ensureDir(path.join(artDir, 'vfx', slug));
  ensureDir(path.join(artDir, 'qa', slug));
  fs.writeFileSync(activeFile, slug + '\n');
  console.log(`Created and activated '${slug}' at BRIEFED.`);
  process.exit(0);
}

if (command === 'activate') {
  const slug = slugArg;
  readJob(slug);
  fs.writeFileSync(activeFile, slug + '\n');
  console.log(`Active art job: ${slug}`);
  process.exit(0);
}

if (command === 'status') {
  let slug = slugArg;
  if (!slug) {
    if (!fs.existsSync(activeFile)) fail('No active job.');
    slug = fs.readFileSync(activeFile, 'utf8').trim();
  }
  const job = readJob(slug);
  console.log(JSON.stringify(job, null, 2));
  process.exit(0);
}

if (!slugArg) fail('Missing job slug.');
const slug = slugArg;
const job = readJob(slug);

if (command === 'researched') {
  const file = getArg('--file');
  requireFile(file, 'Research');
  setStage(job, 'RESEARCHED');
  job.research.file = file;
  history(job, 'RESEARCH_RECORDED', { file });
} else if (command === 'directed') {
  const plan = getArg('--plan');
  const abs = requireFile(plan, 'Art plan');
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(abs, 'utf8')); }
  catch { fail(`Art plan is not valid JSON: ${plan}`); }
  if (!Array.isArray(parsed.assets) || parsed.assets.length === 0) fail('ART_PLAN.json must contain non-empty assets[].');
  if (!Array.isArray(parsed.benchmarks) || parsed.benchmarks.length === 0) fail('ART_PLAN.json must contain benchmark lessons.');
  if (!Array.isArray(parsed.vfx)) fail('ART_PLAN.json must contain vfx[] (may be empty only when genuinely not applicable).');
  setStage(job, 'ART_DIRECTED');
  job.artDirection.plan = plan;
  history(job, 'ART_DIRECTION_RECORDED', { plan });
} else if (command === 'concept') {
  const file = getArg('--file');
  const abs = requireFile(file, 'Concept');
  setStage(job, 'CONCEPT_GENERATED');
  job.concept.file = file;
  job.concept.sha256 = sha256(abs);
  job.approval = { approved: false, conceptSha256: null, approvedAt: null };
  history(job, 'CONCEPT_RECORDED', { file, sha256: job.concept.sha256 });
} else if (command === 'approve') {
  const file = getArg('--file');
  const abs = requireFile(file, 'Concept');
  if (job.stage !== 'CONCEPT_GENERATED') fail(`Approval requires CONCEPT_GENERATED; current ${job.stage}.`);
  if (job.concept.file !== file) fail(`Approval file must match recorded concept exactly: ${job.concept.file}`);
  const hash = sha256(abs);
  if (hash !== job.concept.sha256) fail('Concept changed after it was recorded. Re-record the concept before approval.');
  setStage(job, 'CONCEPT_APPROVED');
  job.approval = { approved: true, conceptSha256: hash, approvedAt: now() };
  history(job, 'CONCEPT_APPROVED', { file, sha256: hash });
} else if (command === 'model') {
  const file = getArg('--file');
  const abs = requireFile(file, 'Model');
  if (job.stage !== 'CONCEPT_APPROVED') fail(`Model recording requires CONCEPT_APPROVED; current ${job.stage}.`);
  const conceptAbs = requireFile(job.concept.file, 'Approved concept');
  if (!job.approval.approved || sha256(conceptAbs) !== job.approval.conceptSha256) {
    fail('Approved concept hash no longer matches. Re-record/re-approve concept.');
  }
  setStage(job, 'MODEL_GENERATED');
  job.model.file = file;
  job.model.taskId = getArg('--task-id', false);
  history(job, 'MODEL_RECORDED', { file, taskId: job.model.taskId });
} else if (command === 'render') {
  const file = getArg('--file');
  requireFile(file, 'Render');
  setStage(job, 'BLENDER_RENDERED');
  job.render.file = file;
  history(job, 'BLENDER_RENDER_RECORDED', { file });
} else if (command === 'visual-qa') {
  const file = getArg('--file');
  requireFile(file, 'QA evidence');
  setStage(job, 'VISUAL_QA_PASSED');
  job.visualQa = { passed: true, evidence: file, notes: getArg('--notes', false) };
  history(job, 'VISUAL_QA_PASSED', { evidence: file, notes: job.visualQa.notes });
} else if (command === 'vfx') {
  const p = getArg('--path');
  requirePath(p, 'VFX');
  setStage(job, 'VFX_COMPLETED');
  job.vfx = { completed: true, path: p };
  history(job, 'VFX_COMPLETED', { path: p });
} else if (command === 'integrated') {
  setStage(job, 'INTEGRATED');
  job.integration.completed = true;
  history(job, 'INTEGRATION_RECORDED');
} else if (command === 'final-qa') {
  setStage(job, 'FINAL_QA_PASSED');
  job.finalQa = { passed: true, notes: getArg('--notes', false) };
  history(job, 'FINAL_QA_PASSED', { notes: job.finalQa.notes });
} else if (command === 'verify') {
  const errors = [];
  const checks = [
    ['research file', job.research.file],
    ['art plan', job.artDirection.plan],
    ['concept file', job.concept.file],
    ['approved concept', job.approval.approved && job.approval.conceptSha256],
    ['model file', job.model.file],
    ['Blender render', job.render.file],
    ['visual QA evidence', job.visualQa.passed && job.visualQa.evidence],
    ['VFX output', job.vfx.completed && job.vfx.path],
    ['integration', job.integration.completed],
    ['final QA', job.finalQa.passed],
  ];
  for (const [label, value] of checks) if (!value) errors.push(`Missing ${label}`);
  const fileChecks = [
    ['research', job.research.file],
    ['art plan', job.artDirection.plan],
    ['concept', job.concept.file],
    ['model', job.model.file],
    ['render', job.render.file],
    ['visual QA', job.visualQa.evidence],
  ];
  for (const [label, p] of fileChecks) {
    if (p && !fs.existsSync(relOrAbs(p))) errors.push(`${label} path no longer exists: ${p}`);
  }
  if (job.concept.file && job.approval.approved) {
    const p = relOrAbs(job.concept.file);
    if (fs.existsSync(p) && sha256(p) !== job.approval.conceptSha256) errors.push('Approved concept hash changed');
  }
  if (errors.length) {
    console.error(errors.map(e => `- ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`PASS: '${slug}' satisfies required pipeline records. Current stage: ${job.stage}`);
  process.exit(0);
} else if (command === 'finalize') {
  if (job.stage !== 'FINAL_QA_PASSED') fail(`Finalize requires FINAL_QA_PASSED; current ${job.stage}.`);
  // Inline verify-equivalent critical checks.
  if (!job.approval.approved || !job.visualQa.passed || !job.vfx.completed || !job.integration.completed || !job.finalQa.passed) {
    fail('Required completion records are missing.');
  }
  setStage(job, 'DONE');
  history(job, 'JOB_FINALIZED');
} else {
  fail(`Unknown command '${command}'. Run: node tools/art_pipeline.mjs help`);
}

job.updatedAt = now();
writeJob(job);
console.log(`${slug}: ${job.stage}`);
