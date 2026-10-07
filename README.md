# Orchestration Threshold — companion demo

Interactive lab for the article *"Should We Use Docker or Kubernetes?" Is the
Wrong Question*. Docker and Kubernetes are layers of the same stack, not
alternatives — this demo proves it two ways.

Zero dependencies — Node 20+ only. The decision model and the pipeline data
are plain ES modules shared by the browser UI, the proof script, and the test
suite.

## Two features

| Feature | What it proves |
|---|---|
| **Pipeline visualizer** | Write code → Dockerfile → `docker build` → image → registry is identical for both paths. Docker runs the image on one host (containers, networks, volumes, Compose); Kubernetes adds a control plane (API server, etcd, scheduler, controller manager), worker nodes (kubelet, runtime), and declared objects (Pods, Services, autoscaling). Kubernetes consumes Docker's output — it is not a competitor. |
| **Orchestration threshold model** | Describe a workload — services, hosts, replicas, traffic pattern, deploy cadence, team size — and the model answers "Docker/Compose suffices" or "Kubernetes earns its overhead", listing which requirements tipped the balance. The three-person-startup preset scores as over-engineered on K8s. |

## Run it

```text
npm start       # serve the lab on :3000
npm test        # model verdicts + pipeline structure + server routes
npm run prove   # one verdict line per preset workload
npm run check   # both
```

## Layout

```text
app/server.js      zero-dep static host + /health + /version
public/index.html  the lab
public/guide.html  what the model proves + honest limits
public/model.mjs   pure workload-scoring engine (no DOM)
public/pipeline.mjs shared + per-path pipeline stage data
public/app.js      browser wiring
public/styles.css  atlas-grid tokens (design-kit build)
test/              node:test suites
scripts/prove.mjs  CLI proofs
```

## Honest limits

- The scorer is a teaching heuristic, not a capacity plan — it weighs six
  signals and ignores cost, compliance, and managed platforms (ECS, Cloud Run)
  that blur the line it draws.
- Pipeline stages are explanatory — nothing builds or schedules for real.
- The threshold is tuned so the article's own examples land where the article
  says they should. That is the point: the reasoning is visible, not hidden.

This is an educational demo, not production infrastructure.
