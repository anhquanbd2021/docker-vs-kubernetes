import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreWorkload, normalizeWorkload, PRESETS, THRESHOLD, SCORE_MAX } from '../public/model.mjs';

test('single service on one host with a small team stays on Docker', () => {
  const r = scoreWorkload({ services: 1, hosts: 1, replicas: 1, traffic: 'steady', deploys: 'weekly', teamSize: 3 });
  assert.equal(r.verdict, 'docker');
  assert.equal(r.label, 'Docker/Compose suffices');
  assert.ok(r.score < THRESHOLD);
});

test('a many-service fleet on many hosts earns Kubernetes', () => {
  const r = scoreWorkload({ services: 15, hosts: 10, replicas: 5, traffic: 'bursty', deploys: 'daily', teamSize: 14 });
  assert.equal(r.verdict, 'kubernetes');
  assert.equal(r.label, 'Kubernetes earns its overhead');
  assert.ok(r.score >= THRESHOLD);
});

test('the three-person startup preset scores as over-engineered on K8s', () => {
  const preset = PRESETS.find((p) => p.id === 'startup');
  const r = scoreWorkload(preset.workload);
  assert.equal(r.verdict, 'docker');
  assert.equal(r.overEngineering, true);
  assert.match(r.caution, /over-engineered/);
});

test('every preset lands on its expected verdict', () => {
  for (const preset of PRESETS) {
    const r = scoreWorkload(preset.workload);
    assert.equal(r.verdict, preset.expect, `${preset.id} should be ${preset.expect}`);
  }
});

test('reasons explain what tipped the balance', () => {
  const r = scoreWorkload({ services: 12, hosts: 6, replicas: 4, traffic: 'bursty', deploys: 'daily', teamSize: 10 });
  assert.ok(r.reasons.length >= 6);
  const pulls = r.reasons.filter((x) => x.favors === 'kubernetes' && x.points > 0);
  assert.ok(pulls.length >= 5);
  // strongest pull first
  assert.ok(r.reasons[0].points >= r.reasons.at(-1).points);
});

test('bursty traffic scores strictly higher than steady', () => {
  const base = { services: 4, hosts: 2, replicas: 2, deploys: 'weekly', teamSize: 5 };
  const steady = scoreWorkload({ ...base, traffic: 'steady' });
  const bursty = scoreWorkload({ ...base, traffic: 'bursty' });
  assert.ok(bursty.score > steady.score);
});

test('normalization clamps sloppy input instead of throwing', () => {
  const w = normalizeWorkload({ services: 0, hosts: -3, replicas: 'x', traffic: 'weird', deploys: 'hourly', teamSize: undefined });
  assert.deepEqual(w, { services: 1, hosts: 1, replicas: 1, traffic: 'steady', deploys: 'weekly', teamSize: 3 });
});

test('score is bounded by the declared max', () => {
  const r = scoreWorkload({ services: 99, hosts: 99, replicas: 99, traffic: 'bursty', deploys: 'daily', teamSize: 200 });
  assert.ok(r.score <= SCORE_MAX);
});
