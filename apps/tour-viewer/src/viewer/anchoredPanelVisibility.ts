type AnchoredPanelVisibilityListener = (open: boolean) => void;

let anchoredPanelVisibilityListener: AnchoredPanelVisibilityListener | null =
  null;

export function setAnchoredPanelVisibilityListener(
  listener: AnchoredPanelVisibilityListener | null,
): void {
  anchoredPanelVisibilityListener = listener;
}

export function notifyAnchoredPanelOpened(): void {
  anchoredPanelVisibilityListener?.(true);
}

export function notifyAnchoredPanelClosed(): void {
  anchoredPanelVisibilityListener?.(false);
}
