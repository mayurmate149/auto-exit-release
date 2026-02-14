type AutoExitSnapshot = {
  running: boolean;
  exited: boolean;
  mtm: number | null;
  trailingSL: number | null;
  trailingSLPct: number | null;
  mtmPct: number | null;
  cutReason: string | null;
  summary: any;
  logs: string[];
  updatedAt: string | null;
};

const initialSnapshot: AutoExitSnapshot = {
  running: false,
  exited: false,
  mtm: null,
  trailingSL: null,
  trailingSLPct: null,
  mtmPct: null,
  cutReason: null,
  summary: null,
  logs: [],
  updatedAt: null,
};

let snapshot: AutoExitSnapshot = { ...initialSnapshot };
const listeners = new Set<(state: AutoExitSnapshot) => void>();

export function getAutoExitSnapshot(): AutoExitSnapshot {
  return snapshot;
}

export function updateAutoExitSnapshot(partial: Partial<AutoExitSnapshot>) {
  snapshot = {
    ...snapshot,
    ...partial,
    logs: partial.logs ? [...partial.logs] : snapshot.logs,
    updatedAt: new Date().toISOString(),
  };
  listeners.forEach((listener) => listener(snapshot));
}

export function resetAutoExitSnapshot() {
  snapshot = { ...initialSnapshot, updatedAt: new Date().toISOString() };
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeAutoExitSnapshot(listener: (state: AutoExitSnapshot) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
