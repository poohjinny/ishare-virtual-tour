/** Dev Manage — highlight the hotspot being edited or moved. */
export const DEV_HOTSPOT_FOCUS_CLASS = 'hotspot--dev-focus';

/** Dev Manage → Move — grab cursor / drag-armed marker. */
export const DEV_HOTSPOT_MOVE_CLASS = 'hotspot--dev-move';

const HOTSPOT_BUTTON_SELECTOR =
  '.hotspot-nav, .hotspot-info, .hotspot-general-info';

function queryHotspotButton(root: ParentNode): HTMLElement | null {
  const button = root.querySelector(HOTSPOT_BUTTON_SELECTOR);
  return button instanceof HTMLElement ? button : null;
}

/** Dev Manage — same highlight for model3d CSS2D hotspot wraps. */
export function setDevFocusedHotspot3d(
  root: ParentNode | null,
  hotspotId: string | null,
): void {
  if (!root) return;

  root.querySelectorAll('.hotspot-3d-wrap').forEach((wrap) => {
    if (!(wrap instanceof HTMLElement)) return;
    const button = queryHotspotButton(wrap);
    if (!button) return;

    const isFocused = !!hotspotId && wrap.dataset.hotspotId === hotspotId;
    button.classList.toggle(DEV_HOTSPOT_FOCUS_CLASS, isFocused);
  });
}

/** Dev Manage → Move — arm grab cursor on the model3d wrap button. */
export function setDevMovingHotspot3d(
  root: ParentNode | null,
  hotspotId: string | null,
): void {
  if (!root) return;

  root.querySelectorAll('.hotspot-3d-wrap').forEach((wrap) => {
    if (!(wrap instanceof HTMLElement)) return;
    const button = queryHotspotButton(wrap);
    if (!button) return;
    button.classList.toggle(
      DEV_HOTSPOT_MOVE_CLASS,
      !!hotspotId && wrap.dataset.hotspotId === hotspotId,
    );
  });
}
