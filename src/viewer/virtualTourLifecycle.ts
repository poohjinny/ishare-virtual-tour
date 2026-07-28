import type { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

/** True while the PSV viewer instance is mounted and not tearing down. */
export type VirtualTourActiveCheck = () => boolean;

/**
 * PSV client-side tours warn when a node is not the target of any `links[]` entry.
 * This app navigates with markers instead, so every node would warn on `setNodes`.
 */
const PSV_NEVER_LINKED_WARN = /^PhotoSphereViewer: Node .+ is never linked to$/;

type VirtualTourWithDatasource = VirtualTourPlugin & {
  datasource?: { loadNode?: unknown };
};

function hasDatasource(virtualTour: VirtualTourPlugin): boolean {
  return Boolean((virtualTour as VirtualTourWithDatasource).datasource);
}

function isVirtualTourTeardownError(err: unknown): boolean {
  if (err == null) return false;
  if (typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
    return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  // destroy() deletes `datasource` while setCurrentNode's promise chain still runs.
  return (
    message.includes("reading 'loadNode'") ||
    (message.includes('loadNode') && message.includes('undefined'))
  );
}

function withNeverLinkedWarningsSuppressed(run: () => void): void {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && PSV_NEVER_LINKED_WARN.test(first)) {
      return;
    }
    Reflect.apply(originalWarn, console, args);
  };
  try {
    run();
  } finally {
    console.warn = originalWarn;
  }
}

/**
 * Wrap VirtualTourPlugin navigation so async node loads that outlive teardown
 * do not reject with "Cannot read properties of undefined (reading 'loadNode')".
 *
 * Also suppresses expected "never linked" warnings (marker nav, empty `links`).
 *
 * @returns Unbind — call before `viewer.destroy()` so Strict Mode remount cannot
 * revive an old instance via a shared `isActive` ref.
 */
export function bindVirtualTourLifecycleGuard(
  virtualTour: VirtualTourPlugin,
  isActive: VirtualTourActiveCheck,
): () => void {
  let bound = true;
  const stillSafe = () => bound && isActive() && hasDatasource(virtualTour);

  const setCurrentNodeOriginal = virtualTour.setCurrentNode.bind(virtualTour);
  virtualTour.setCurrentNode = (nodeId, options, fromLink) => {
    if (!stillSafe()) {
      return Promise.resolve(false);
    }

    return setCurrentNodeOriginal(nodeId, options, fromLink).catch(
      (err: unknown) => {
        if (!stillSafe() || isVirtualTourTeardownError(err)) {
          return false;
        }
        throw err;
      },
    );
  };

  const setNodesOriginal = virtualTour.setNodes.bind(virtualTour);
  virtualTour.setNodes = (nodes, startNodeId) => {
    if (!stillSafe()) {
      return;
    }

    try {
      withNeverLinkedWarningsSuppressed(() => {
        setNodesOriginal(nodes, startNodeId);
      });
    } catch (err) {
      if (!stillSafe() || isVirtualTourTeardownError(err)) {
        return;
      }
      throw err;
    }
  };

  return () => {
    bound = false;
  };
}
