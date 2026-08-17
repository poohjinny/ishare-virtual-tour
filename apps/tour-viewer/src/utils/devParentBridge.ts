/**
 * Authoring host → viewer commands (`?dev=1` only).
 *
 * The Admin editor keeps one iframe mounted while staff hop scenes, so instead
 * of rebuilding the iframe URL it asks the running viewer to navigate. Outbound
 * readouts stay in `devTourBridge`.
 */

export const DEV_PARENT_COMMAND_SOURCE = 'ishare-admin-preview' as const;

export interface DevParentNavigateCommand {
  type: 'tour:navigate';
  tourId: string;
  sceneId: string;
}

export function parseDevParentCommand(
  data: unknown,
): DevParentNavigateCommand | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (message.source !== DEV_PARENT_COMMAND_SOURCE) return null;
  if (message.type !== 'tour:navigate') return null;
  if (
    typeof message.tourId !== 'string' ||
    typeof message.sceneId !== 'string'
  ) {
    return null;
  }
  return {
    type: 'tour:navigate',
    tourId: message.tourId,
    sceneId: message.sceneId,
  };
}

/** Only the framing host may drive the viewer; callers still check tour / scene. */
export function subscribeDevParentCommands(
  handler: (command: DevParentNavigateCommand) => void,
): () => void {
  if (typeof window === 'undefined' || window.parent === window) {
    return () => undefined;
  }

  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    const command = parseDevParentCommand(event.data);
    if (!command) return;
    handler(command);
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}
