// model.mjs — the orchestration threshold decision model.
// Pure ES module: no DOM, no I/O. The browser lab, the prove script, and the
// test suite all drive the same engine.
//
// The model answers the article's real question: not "which is better" but
// "which machinery does this workload justify today". Score is a count of
// requirements that pull toward fleet orchestration; under THRESHOLD, Docker
// (plus Compose) is the correct amount of machinery.

export const THRESHOLD = 10;
export const SCORE_MAX = 30;

const DEPLOY_CADENCES = ['rare', 'weekly', 'daily'];
const TRAFFIC_PATTERNS = ['steady', 'bursty'];

// Clamp/defaults so both the form and tests can pass sloppy input.
export function normalizeWorkload(raw = {}) {
  const int = (v, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(1, Math.round(n)) : d;
  };
  return {
    services: int(raw.services, 1),
    hosts: int(raw.hosts, 1),
    replicas: int(raw.replicas, 1),
    traffic: TRAFFIC_PATTERNS.includes(raw.traffic) ? raw.traffic : 'steady',
    deploys: DEPLOY_CADENCES.includes(raw.deploys) ? raw.deploys : 'weekly',
    teamSize: int(raw.teamSize, 3),
  };
}

export function scoreWorkload(raw) {
  const w = normalizeWorkload(raw);
  const reasons = [];
  const pull = (points, title, detail) =>
    reasons.push({ favors: 'kubernetes', points, title, detail });
  const hold = (title, detail) =>
    reasons.push({ favors: 'docker', points: 0, title, detail });

  // Services — the count of things that must find and talk to each other.
  if (w.services >= 10) {
    pull(5, 'Many services', 'Service discovery, health checks, and per-service rollout rules stop fitting in one Compose file.');
  } else if (w.services >= 5) {
    pull(3, 'Growing service count', 'Five-plus services means coordination — startup order, discovery, per-service scaling — that Compose only approximates.');
  } else if (w.services >= 2) {
    pull(1, 'A few services', 'A handful of named services still sits comfortably inside Compose or a managed container service.');
  } else {
    hold('Single service', 'One Dockerfile, one container. There is nothing to orchestrate.');
  }

  // Hosts — the count of machines a human would have to place work on.
  if (w.hosts >= 6) {
    pull(5, 'Real fleet', 'Six-plus hosts means placement decisions outgrow human hands — that is the scheduler’s whole job.');
  } else if (w.hosts >= 3) {
    pull(3, 'Several hosts', 'Spreading containers across a few machines by hand already feels like a scheduler, minus the reliability.');
  } else if (w.hosts === 2) {
    pull(1, 'Two hosts', 'A second host can still be run by convention — it is the first hint of a fleet.');
  } else {
    hold('One host', 'A single machine is Docker’s home turf — no cluster, no control plane, no on-call surface you did not ask for.');
  }

  // Replicas — availability requirements.
  if (w.replicas >= 4) {
    pull(4, 'High availability', 'Four-plus replicas is a self-healing, load-spread requirement — controllers do this continuously, humans do it badly.');
  } else if (w.replicas === 3) {
    pull(3, 'Availability requirement', 'Three replicas across failure domains is exactly what a replica controller exists for.');
  } else if (w.replicas === 2) {
    pull(1, 'Some redundancy', 'Two replicas can still be a restart policy and a second port — but the need is real.');
  } else {
    hold('Single replica', 'No availability requirement stated — a restart policy covers it.');
  }

  // Traffic — steady vs. bursty is the autoscaling question.
  if (w.traffic === 'bursty') {
    pull(3, 'Bursty traffic', 'Load that spikes and retreats is the case autoscaling was built for — replica counts follow demand.');
  } else {
    hold('Steady traffic', 'Predictable load is sized once and left alone — no autoscaler to feed.');
  }

  // Deploy cadence — how often you pay the rollout cost.
  if (w.deploys === 'daily') {
    pull(3, 'Frequent deploys', 'Daily shipping wants rolling deploys and automatic rollback — machinery, not procedure.');
  } else if (w.deploys === 'weekly') {
    pull(1, 'Weekly deploys', 'A weekly push can still be a careful human with a restart command.');
  } else {
    hold('Rare deploys', 'Ships so infrequently that a manual restart is a fine deployment strategy.');
  }

  // Team — who pays for the control plane.
  if (w.teamSize >= 9) {
    pull(2, 'Platform capacity', 'A team this size can staff the control plane — upgrades, RBAC, etcd — without starving the product.');
  } else if (w.teamSize >= 4) {
    pull(1, 'Shared ops burden', 'A mid-size team can absorb cluster care, but it is still borrowed time.');
  } else {
    hold('Small team', 'A cluster is a second product. For a handful of engineers it eats the roadmap — the cautionary tale is exactly this shape.');
  }

  const score = reasons.reduce((s, r) => s + r.points, 0);
  const isK8s = score >= THRESHOLD;
  const distance = Math.abs(score - THRESHOLD);

  // Sort: strongest pull first, docker-side holds after, then stable by text.
  reasons.sort((a, b) => b.points - a.points);

  return {
    workload: w,
    score,
    threshold: THRESHOLD,
    max: SCORE_MAX,
    verdict: isK8s ? 'kubernetes' : 'docker',
    label: isK8s ? 'Kubernetes earns its overhead' : 'Docker/Compose suffices',
    confidence: distance <= 3 ? 'borderline' : 'clear',
    reasons,
    // The startup scenario: tiny workload, score far under threshold — running
    // it on Kubernetes is machinery the workload never asked for.
    overEngineering: !isK8s && score <= 4,
    caution:
      !isK8s && score <= 4
        ? 'On Kubernetes this workload is over-engineered — the control plane costs more than the problem it solves. This is the three-person-startup failure mode: six months of cluster care for one service.'
        : distance <= 3
          ? 'Close call. Start with Docker — every image you build is already Kubernetes-compatible, and the on-ramp does not expire.'
          : null,
  };
}

// Preset workloads — the form buttons and the prove script share these.
export const PRESETS = [
  {
    id: 'startup',
    name: 'Three-person startup',
    blurb: 'One service, one host, three engineers — the article’s cautionary tale.',
    workload: { services: 1, hosts: 1, replicas: 1, traffic: 'steady', deploys: 'weekly', teamSize: 3 },
    expect: 'docker',
  },
  {
    id: 'side-project',
    name: 'Solo side project',
    blurb: 'Two containers on a rented box, deployed when there is time.',
    workload: { services: 2, hosts: 1, replicas: 1, traffic: 'steady', deploys: 'rare', teamSize: 1 },
    expect: 'docker',
  },
  {
    id: 'growing-saas',
    name: 'Growing SaaS',
    blurb: 'Six services, three hosts, real uptime promises, shipping daily.',
    workload: { services: 6, hosts: 3, replicas: 3, traffic: 'bursty', deploys: 'daily', teamSize: 8 },
    expect: 'kubernetes',
  },
  {
    id: 'platform-fleet',
    name: 'Platform fleet',
    blurb: 'Fifteen services across ten hosts with autoscaling rules.',
    workload: { services: 15, hosts: 10, replicas: 5, traffic: 'bursty', deploys: 'daily', teamSize: 14 },
    expect: 'kubernetes',
  },
];
