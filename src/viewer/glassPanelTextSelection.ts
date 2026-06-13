import { PSV_CAPTURE_EVENTS_CLASS } from '../components/tourGlassPanelHtml';

/** PSV markers use pointer cursor + inherit drag behavior — enable copy in panel body. */
export function enableGlassPanelTextSelection(root: ParentNode): void {
  if (!(root instanceof HTMLElement)) return;

  const panel = root.querySelector('.tour-glass-panel--anchored');
  if (panel instanceof HTMLElement) {
    panel.classList.add(PSV_CAPTURE_EVENTS_CLASS);
  }

  root.style.userSelect = 'text';

  for (const el of root.querySelectorAll(
    '.tour-glass-panel__body, .nav-preview-panel__body, .nav-preview-panel__hero-title, .tour-glass-panel__copy, .tour-glass-panel__paragraph',
  )) {
    if (el instanceof HTMLElement) {
      el.style.userSelect = 'text';
    }
  }

  for (const button of root.querySelectorAll('button')) {
    if (button instanceof HTMLElement) {
      button.style.userSelect = 'none';
    }
  }
}
