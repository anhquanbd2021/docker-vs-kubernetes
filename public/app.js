// app.js — browser wiring for Orchestration Threshold.
// All logic lives in the pure modules (model.mjs, pipeline.mjs); this file
// only renders them and reacts to input.

import { scoreWorkload, PRESETS, THRESHOLD, SCORE_MAX } from './model.mjs';
import { SHARED_STAGES, PATHS, FORK_NOTE } from './pipeline.mjs';

const $ = (id) => document.getElementById(id);

// ---------- pipeline visualizer ----------

const stageTitle = $('stage-title');
const stageDetail = $('stage-detail');
let selectedStage = null;

function stageButton(stage) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'stage';
  btn.textContent = stage.title;
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
    if (selectedStage) selectedStage.setAttribute('aria-pressed', 'false');
    selectedStage = btn;
    btn.setAttribute('aria-pressed', 'true');
    stageTitle.textContent = stage.title;
    stageDetail.textContent = stage.detail;
  });
  return btn;
}

function renderShared() {
  const ol = $('shared-stages');
  for (const stage of SHARED_STAGES) {
    const li = document.createElement('li');
    li.append(stageButton(stage));
    ol.append(li);
  }
}

function renderLane(containerId, path) {
  const host = $(containerId);
  for (const group of path.groups) {
    const label = document.createElement('p');
    label.className = 'group-label';
    label.textContent = group.label;
    host.append(label);
    for (const stage of group.stages) host.append(stageButton(stage));
  }
}

// ---------- decision model ----------

const inputs = {
  services: $('in-services'),
  hosts: $('in-hosts'),
  replicas: $('in-replicas'),
  traffic: $('in-traffic'),
  deploys: $('in-deploys'),
  teamSize: $('in-team'),
};

function readForm() {
  return {
    services: inputs.services.value,
    hosts: inputs.hosts.value,
    replicas: inputs.replicas.value,
    traffic: inputs.traffic.value,
    deploys: inputs.deploys.value,
    teamSize: inputs.teamSize.value,
  };
}

function writeForm(w) {
  inputs.services.value = w.services;
  inputs.hosts.value = w.hosts;
  inputs.replicas.value = w.replicas;
  inputs.traffic.value = w.traffic;
  inputs.deploys.value = w.deploys;
  inputs.teamSize.value = w.teamSize;
}

function renderVerdict(result) {
  $('verdict-label').textContent = result.label;
  const badge = $('verdict-badge');
  badge.textContent = result.verdict === 'kubernetes' ? 'KUBERNETES' : 'DOCKER / COMPOSE';
  badge.className = `badge ${result.verdict === 'kubernetes' ? 'k8s' : 'docker'}`;

  const pct = Math.min(100, (result.score / SCORE_MAX) * 100);
  const fill = $('scorebar-fill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('k8s', result.verdict === 'kubernetes');
  $('scorebar-tick').style.left = `${(THRESHOLD / SCORE_MAX) * 100}%`;
  $('scorebar').setAttribute(
    'aria-label',
    `Orchestration score ${result.score} of ${SCORE_MAX}; threshold ${THRESHOLD}`,
  );

  $('verdict-meta').textContent =
    `Score ${result.score}/${SCORE_MAX} against a threshold of ${THRESHOLD} — ` +
    (result.confidence === 'borderline'
      ? 'a borderline call.'
      : `a clear ${result.verdict === 'kubernetes' ? 'Kubernetes' : 'Docker'} call.`);

  const caution = $('verdict-caution');
  if (result.caution) {
    caution.hidden = false;
    caution.textContent = result.caution;
  } else {
    caution.hidden = true;
    caution.textContent = '';
  }

  const list = $('reason-list');
  list.replaceChildren();
  for (const r of result.reasons) {
    const li = document.createElement('li');
    const pts = document.createElement('span');
    pts.className = `pts ${r.favors === 'kubernetes' ? 'k8s' : 'docker'}`;
    pts.textContent = r.favors === 'kubernetes' ? `K8s +${r.points}` : 'Docker';
    const b = document.createElement('b');
    b.textContent = r.title;
    const p = document.createElement('p');
    p.textContent = r.detail;
    li.append(pts, b, p);
    list.append(li);
  }
}

function renderAdds() {
  const fill = (id, items) => {
    const ul = $(id);
    ul.replaceChildren();
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = item;
      ul.append(li);
    }
  };
  fill('docker-adds', PATHS.docker.adds);
  fill('k8s-adds', PATHS.kubernetes.adds);
}

function renderPresets() {
  const row = $('preset-row');
  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset';
    btn.textContent = preset.name;
    btn.title = preset.blurb;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      writeForm(preset.workload);
      renderVerdict(scoreWorkload(preset.workload));
      for (const other of row.querySelectorAll('.preset')) {
        other.setAttribute('aria-pressed', String(other === btn));
      }
    });
    row.append(btn);
  }
}

// ---------- boot ----------

renderShared();
renderLane('docker-lane', PATHS.docker);
renderLane('k8s-lane', PATHS.kubernetes);
document.querySelector('.fork-note').textContent = FORK_NOTE;
renderPresets();
renderAdds();

$('workload-form').addEventListener('submit', (e) => {
  e.preventDefault();
  renderVerdict(scoreWorkload(readForm()));
});
for (const el of Object.values(inputs)) {
  el.addEventListener('input', () => renderVerdict(scoreWorkload(readForm())));
}
renderVerdict(scoreWorkload(readForm()));
