// pipeline.mjs — the container pipeline as data: one shared build half that
// feeds both run-paths. Pure data + helpers; the visualizer, tests, and the
// prove script all read the same structure.
//
// The article's claim this encodes: everything up to and including the image
// in a registry is identical for Docker and for Kubernetes. Kubernetes does
// not replace any of it — it consumes what Docker produces.

export const SHARED_STAGES = [
  {
    id: 'code',
    title: 'Write code',
    detail:
      'Application source, identical no matter where it ends up running. Nothing on this page changes until the code does.',
  },
  {
    id: 'dockerfile',
    title: 'Write a Dockerfile',
    detail:
      'The recipe that turns source into a runnable image — base image, dependencies, entrypoint. One file, checked into the repo.',
  },
  {
    id: 'build',
    title: 'docker build',
    detail:
      'The Docker daemon builds the image layer by layer. Same command, same output, on a laptop or in CI.',
  },
  {
    id: 'image',
    title: 'Image',
    detail:
      'An immutable, versioned artifact. This is the hand-off point: everything before this line is identical on both paths; everything after it is a runtime question.',
  },
  {
    id: 'registry',
    title: 'Push to a registry',
    detail:
      'The image lands in a registry so any host — or any cluster — can pull it. This is where the pipeline forks, not where the debate starts.',
  },
];

// What each path adds on top of the shared half. Kubernetes stages are grouped
// the way the cluster is actually organized: control plane, worker nodes, and
// the objects you declare.
export const PATHS = {
  docker: {
    id: 'docker',
    label: 'Docker path',
    headline: 'Run it on one host',
    summary:
      'One machine, one operator. The image becomes a container; you decide what goes where.',
    groups: [
      {
        label: 'One host, one operator',
        stages: [
          {
            id: 'run',
            title: 'docker run',
            detail:
              'The image becomes a running container on a single machine. Imperative: run this, on this port, now.',
          },
          {
            id: 'networks',
            title: 'Networks',
            detail:
              'Bridge networks connect the containers on the host so they can reach each other by name.',
          },
          {
            id: 'volumes',
            title: 'Volumes',
            detail:
              'Named volumes keep data alive across container restarts and replacements.',
          },
          {
            id: 'compose',
            title: 'Compose',
            detail:
              'For a handful of services, docker compose up declares the whole app in one file — still one host, still you in the loop.',
          },
        ],
      },
    ],
    adds: [
      'Containers you start and stop by hand',
      'Host-local networking and named volumes',
      'Compose for multi-service apps on one machine',
    ],
  },
  kubernetes: {
    id: 'kubernetes',
    label: 'Kubernetes path',
    headline: 'Declare it to a fleet',
    summary:
      'Same image, new machinery. You describe the desired end state; controllers close the gap.',
    groups: [
      {
        label: 'Control plane',
        stages: [
          {
            id: 'api-server',
            title: 'API server',
            detail:
              'The front door of the cluster. Every kubectl call, every node, every controller talks to it.',
          },
          {
            id: 'etcd',
            title: 'etcd',
            detail:
              'The cluster’s state database. The desired state you declare — replicas, images, rollout rules — lives here.',
          },
          {
            id: 'scheduler',
            title: 'Scheduler',
            detail:
              'Watches for unplaced Pods and picks which node each one runs on.',
          },
          {
            id: 'controller-manager',
            title: 'Controller manager',
            detail:
              'Runs the control loops — deployment rollouts, replica replacement — that converge reality to the declared state.',
          },
        ],
      },
      {
        label: 'Worker nodes',
        stages: [
          {
            id: 'kubelet',
            title: 'Kubelet',
            detail:
              'Per-node agent. Takes Pod specs from the API server and makes them real on its machine.',
          },
          {
            id: 'runtime',
            title: 'Container runtime',
            detail:
              'The node-level engine that actually runs the containers — built from the same container technology Docker pioneered. Kubernetes consumes Docker’s output; it does not replace it.',
          },
        ],
      },
      {
        label: 'What you declare',
        stages: [
          {
            id: 'pods',
            title: 'Pods',
            detail:
              'The smallest unit of work: your image, running wherever the scheduler put it.',
          },
          {
            id: 'services',
            title: 'Services',
            detail:
              'Stable discovery and load balancing across a shifting set of Pods — no hand-edited host lists.',
          },
          {
            id: 'autoscaling',
            title: 'Self-healing + autoscaling',
            detail:
              'Dead Pods get replaced, rollouts meter out new versions, and replica counts follow load — no human in the control loop.',
          },
        ],
      },
    ],
    adds: [
      'A control plane to run and upgrade (API server, etcd, scheduler, controllers)',
      'Declarative state: rolling deploys, self-healing restarts, autoscaling',
      'Fleet-wide service discovery, health checks, and placement',
      'RBAC, manifests, and a mental model every engineer must learn',
    ],
  },
};

export const FORK_NOTE =
  'One image, two operating models. Kubernetes consumes what Docker produces — the debate starts after the image exists, not before.';

// Full ordered stage list for one run-path: the identical shared half,
// then everything that path adds. Tests assert both paths share the prefix.
export function pathStages(pathId) {
  const path = PATHS[pathId];
  if (!path) throw new Error(`unknown path: ${pathId}`);
  return [...SHARED_STAGES, ...path.groups.flatMap((g) => g.stages)];
}
