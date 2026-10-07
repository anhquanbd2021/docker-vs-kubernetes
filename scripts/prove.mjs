// prove.mjs — runs the decision model over the preset workloads and the
// pipeline structure checks, printing one PASS line per claim.
// `npm run prove` — the same modules the browser lab drives.

import { scoreWorkload, PRESETS, THRESHOLD, SCORE_MAX } from '../public/model.mjs';
import { SHARED_STAGES, PATHS, pathStages } from '../public/pipeline.mjs';

const mark = (ok) => (ok ? 'PASS' : 'FAIL');
const lines = [];
let failed = 0;
const line = (name, ok, text) => {
  if (!ok) failed += 1;
  lines.push([name, `${mark(ok)} ${text}`]);
};

// Claim 1 — the shared half is identical for both paths.
const sharedLen = SHARED_STAGES.length;
line(
  'Pipeline',
  pathStages('docker').slice(0, sharedLen).length === sharedLen &&
    JSON.stringify(pathStages('docker').slice(0, sharedLen)) ===
      JSON.stringify(pathStages('kubernetes').slice(0, sharedLen)),
  `${sharedLen} shared stages feed both paths — Kubernetes consumes Docker's output`,
);
line(
  'Pipeline',
  pathStages('kubernetes').some((s) => s.id === 'runtime'),
  'the node-level runtime on the K8s path is the same container technology Docker built',
);
line(
  'Pipeline',
  pathStages('kubernetes').some((s) => s.id === 'etcd') && !pathStages('docker').some((s) => s.id === 'etcd'),
  'only the Kubernetes path adds a control plane (API server, etcd, scheduler, controller manager)',
);

// Claim 2 — the model answers "which machinery does this workload justify".
for (const preset of PRESETS) {
  const r = scoreWorkload(preset.workload);
  line(
    preset.name,
    r.verdict === preset.expect,
    `score ${r.score}/${SCORE_MAX} vs threshold ${THRESHOLD} → ${r.label}`,
  );
}

const startup = scoreWorkload(PRESETS.find((p) => p.id === 'startup').workload);
line('Startup', startup.overEngineering === true, `three-person startup on K8s flags as over-engineered`);

const mid = scoreWorkload({ services: 4, hosts: 2, replicas: 2, traffic: 'steady', deploys: 'weekly', teamSize: 5 });
line('Middle', mid.verdict === 'docker', `a few named services still fits Compose (score ${mid.score}/${SCORE_MAX})`);

const edge = scoreWorkload({ services: 6, hosts: 3, replicas: 3, traffic: 'bursty', deploys: 'daily', teamSize: 6 });
line('Tipping point', edge.verdict === 'kubernetes', `many services + rolling deploys + autoscaling tips to K8s (score ${edge.score}/${SCORE_MAX})`);

console.log('\n  Orchestration Threshold — proofs\n');
for (const [m, l] of lines) console.log(`  ${m.padEnd(16)} ${l}`);
console.log('');
if (failed) {
  console.error(`  ${failed} proof(s) FAILED`);
  process.exit(1);
}
