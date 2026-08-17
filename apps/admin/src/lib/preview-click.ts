export type PreviewClickAxis = { axis: string; value: number };

const clickListeners = new Set<(position: PreviewClickAxis[]) => void>();
const viewListeners = new Set<(view: PreviewClickAxis[]) => void>();
const reloadListeners = new Set<() => void>();

function numericAxes(value: unknown): PreviewClickAxis[] | null {
  if (!value || typeof value !== 'object') return null;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, axisValue]) => typeof axisValue === 'number')
    .map(([axis, axisValue]) => ({ axis, value: axisValue as number }));
  return entries.length > 0 ? entries : null;
}

export function positionFromClickPayload(
  data: unknown,
): PreviewClickAxis[] | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.type !== 'tour:click') return null;
  return numericAxes(message.position);
}

export function viewFromPayload(data: unknown): PreviewClickAxis[] | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.type !== 'tour:view') return null;
  return numericAxes(message.view);
}

export function sceneFromReadyPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.type !== 'tour:ready') return null;
  return typeof message.sceneId === 'string' ? message.sceneId : null;
}

/** Matches `DEV_PARENT_COMMAND_SOURCE` in the viewer (`utils/devParentBridge`). */
const PREVIEW_COMMAND_SOURCE = 'ishare-admin-preview';

/** Scene hop for an already-loaded authoring iframe — avoids a viewer reload. */
export function buildPreviewNavigateCommand(tourId: string, sceneId: string) {
  return {
    source: PREVIEW_COMMAND_SOURCE,
    type: 'tour:navigate',
    tourId,
    sceneId,
  } as const;
}

export function publishPreviewClick(position: PreviewClickAxis[]) {
  for (const listener of clickListeners) listener(position);
}

export function subscribePreviewClick(
  listener: (position: PreviewClickAxis[]) => void,
) {
  clickListeners.add(listener);
  return () => {
    clickListeners.delete(listener);
  };
}

export function publishPreviewView(view: PreviewClickAxis[]) {
  for (const listener of viewListeners) listener(view);
}

export function subscribePreviewView(
  listener: (view: PreviewClickAxis[]) => void,
) {
  viewListeners.add(listener);
  return () => {
    viewListeners.delete(listener);
  };
}

export function publishPreviewReload() {
  for (const listener of reloadListeners) listener();
}

export function subscribePreviewReload(listener: () => void) {
  reloadListeners.add(listener);
  return () => {
    reloadListeners.delete(listener);
  };
}

export function mergePreviewAxes(
  current: PreviewClickAxis[],
  next: PreviewClickAxis[],
) {
  const byAxis = new Map(next.map((entry) => [entry.axis, entry.value]));
  if (current.some((entry) => byAxis.has(entry.axis))) {
    const merged = current.map((entry) =>
      byAxis.has(entry.axis) ?
        { ...entry, value: byAxis.get(entry.axis) ?? entry.value }
      : entry,
    );
    for (const entry of next) {
      if (!merged.some((item) => item.axis === entry.axis)) {
        merged.push(entry);
      }
    }
    return merged;
  }
  return next;
}

export function axesToRecord(position: PreviewClickAxis[]) {
  return Object.fromEntries(position.map(({ axis, value }) => [axis, value]));
}
