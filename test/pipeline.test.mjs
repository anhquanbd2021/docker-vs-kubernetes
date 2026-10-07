import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARED_STAGES, PATHS, FORK_NOTE, pathStages } from '../public/pipeline.mjs';

test('both paths share the identical first half of the pipeline', () => {
  const sharedLen = SHARED_STAGES.length;
  assert.ok(sharedLen >= 5);
  assert.deepEqual(pathStages('docker').slice(0, sharedLen), SHARED_STAGES);
  assert.deepEqual(pathStages('kubernetes').slice(0, sharedLen), SHARED_STAGES);
  // The shared half is the same objects on both paths — nothing re-implemented.
  assert.deepEqual(
    pathStages('docker').slice(0, sharedLen),
    pathStages('kubernetes').slice(0, sharedLen),
  );
});

test('the shared half ends at the registry — the fork happens after the image', () => {
  assert.equal(SHARED_STAGES.at(-1).id, 'registry');
  assert.ok(SHARED_STAGES.some((s) => s.id === 'build'));
});

test('the Kubernetes path names the real control plane components', () => {
  const ids = pathStages('kubernetes').map((s) => s.id);
  for (const id of ['api-server', 'etcd', 'scheduler', 'controller-manager', 'kubelet', 'runtime', 'pods', 'services', 'autoscaling']) {
    assert.ok(ids.includes(id), `kubernetes path is missing ${id}`);
  }
});

test('the Docker path stays on one host: run, networks, volumes, compose', () => {
  const ids = pathStages('docker').map((s) => s.id);
  for (const id of ['run', 'networks', 'volumes', 'compose']) {
    assert.ok(ids.includes(id), `docker path is missing ${id}`);
  }
  // And it never invents cluster machinery.
  assert.ok(!ids.includes('etcd') && !ids.includes('scheduler'));
});

test('every stage has an id, title, and real detail text; ids are unique per path', () => {
  for (const pathId of ['docker', 'kubernetes']) {
    const stages = pathStages(pathId);
    const ids = new Set();
    for (const s of stages) {
      assert.ok(s.id && s.title && s.detail && s.detail.length > 30, `stage ${s.id} is thin`);
      assert.ok(!ids.has(s.id), `duplicate stage id ${s.id} on ${pathId} path`);
      ids.add(s.id);
    }
  }
});

test('paths declare what each side adds; the fork note carries the thesis', () => {
  assert.ok(PATHS.docker.adds.length >= 3);
  assert.ok(PATHS.kubernetes.adds.length >= 3);
  assert.match(FORK_NOTE, /consumes what Docker produces/);
  assert.throws(() => pathStages('swarm'), /unknown path/);
});
