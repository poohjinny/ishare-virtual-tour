import type { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

/** True while the PSV viewer instance is mounted and not tearing down. */
export type VirtualTourActiveCheck = () => boolean;

/**
 * Wrap VirtualTourPlugin navigation so async node loads that outlive teardown
 * do not reject with "Cannot read properties of undefined (reading 'loadNode')".
 */
export function bindVirtualTourLifecycleGuard(
  virtualTour: VirtualTourPlugin,
  isActive: VirtualTourActiveCheck,
): void {
  const setCurrentNodeOriginal = virtualTour.setCurrentNode.bind(virtualTour);
  virtualTour.setCurrentNode = (nodeId, options, fromLink) => {
    if (!isActive()) {
      return Promise.resolve(false);
    }

    return setCurrentNodeOriginal(nodeId, options, fromLink).catch(
      (err: unknown) => {
        if (!isActive()) {
          return false;
        }
        throw err;
      },
    );
  };

  const setNodesOriginal = virtualTour.setNodes.bind(virtualTour);
  virtualTour.setNodes = (nodes, startNodeId) => {
    if (!isActive()) {
      return;
    }

    try {
      setNodesOriginal(nodes, startNodeId);
    } catch {
      // Ignore sync validation errors during teardown races.
    }
  };
}
