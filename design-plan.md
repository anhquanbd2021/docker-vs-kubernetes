# Artifact plan — Orchestration Threshold

type: web
subject: Interactive companion demo for the article "Should We Use Docker or Kubernetes? Is the Wrong Question" — a pipeline visualizer showing the identical container build half feeding both Docker and Kubernetes paths, plus a workload-scoring decision model that answers whether Docker/Compose suffices or Kubernetes earns its overhead.
audience: Engineers and tech leads reading the LinkedIn article who have heard the "Docker vs Kubernetes" framing and want a concrete, defensible answer for their own workload.
job: Prove that Docker and Kubernetes are layers of the same stack (not competitors) by showing one shared pipeline feeding two operating models, then score a user-described workload and explain which requirements tip the balance.
constraints: Zero runtime dependencies (Node stdlib + browser ES modules only, no npm install); static site served by a hand-rolled server; must work at 390 px width; decision model must be a pure DOM-free module so tests and the prove script exercise the same code; no real IPs, credentials, or hostnames.
direction: atlas-grid
direction_reason: The demo is fundamentally a comparison tool — two columns of pipeline stages, a scoring readout, a requirement-by-requirement breakdown. atlas-grid's use_for explicitly names dashboards, comparison tables, and research summaries, and its ruled grid rhythm matches pipeline/diagram content.
accent: keep
accent_reason: The direction's steel-blue accent reads as infrastructure/tooling and pairs cleanly with the Docker-blue association readers already carry; no override needed.
headline: Docker or Kubernetes? Score the workload, not the rivalry.
primary_action: Score this workload
bold_moment: The split pipeline diagram — one shared build column feeding a single-host Docker lane and a multi-component Kubernetes lane, with the fork visually emphasized.
sections:
- Hero naming the demo, stating the wrong-question thesis, linking to guide
- Pipeline visualizer with shared build stages feeding Docker and Kubernetes lanes, stage detail on click
- Decision model with workload inputs (services, hosts, replicas, traffic pattern, team size, deploy cadence) plus presets including the three-person startup
- Verdict panel answering Docker/Compose vs Kubernetes with score, threshold line, and which requirements tipped the balance
- Machinery comparison listing what each side adds (Compose vs control plane components)
- Honest limits and run-locally footer
layout:
```text
[nav] Lab | Guide | Source
[hero] headline + lede .............. warning card
[pipeline]  shared stages column ->  [Docker lane]   [Kubernetes lane]
                                     run/network/    control plane +
                                     volume/compose  workers/pods
[inputs]  services|hosts|replicas|traffic|team|deploys   [presets row]
[verdict]  DOCKER SUFFICES / K8S EARNS IT  + score bar + reasons list
[machinery table]  Docker adds... | Kubernetes adds...
[limits]  what the model does not claim
```
mobile_layout: single column — shared pipeline stacks above both lanes, lanes stack Docker-then-Kubernetes, inputs become a vertical form, verdict panel full width; tables scroll horizontally inside a wrapper.
tablet_layout: two-column hero collapses at ~820 px; pipeline lanes stay side-by-side down to ~700 px then stack; input grid drops to one column.
responsive: fluid grid with auto-fit/minmax for cards; pipeline uses CSS grid with a fork connector that rotates to vertical flow under 700 px; no fixed-width elements below 390 px.
generic_check: No, it is built around the article's specific claims — the identical shared pipeline half, the named control-plane components (API server, etcd, scheduler, controller manager), and the startup preset that must score as over-engineered.
not_doing:
- Not a real cluster simulator — stages and scoring are explanatory models, not live Docker/Kubernetes API calls.
- Not a migration planner or cost calculator — it answers "which machinery does this workload justify", not TCO or migration steps.
