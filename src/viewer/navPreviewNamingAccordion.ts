/** Single-open accordion for naming opportunities in the nav preview panel. */

export interface NavPreviewNamingPanelHandlers {
  onGoToNaming: (infoHotspotId: string) => void;
}

let panelHandlers: NavPreviewNamingPanelHandlers | null = null;

export function setNavPreviewNamingPanelHandlers(
  handlers: NavPreviewNamingPanelHandlers | null,
): void {
  panelHandlers = handlers;
}

function setNamingPanelExpanded(
  card: HTMLElement,
  trigger: HTMLElement,
  expanded: boolean,
): void {
  const panelWrap = card.querySelector('.nav-preview-panel__naming-panel-wrap');

  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  card.classList.toggle('nav-preview-panel__naming-card--open', expanded);

  if (panelWrap instanceof HTMLElement) {
    panelWrap.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  }
}

export function toggleNavPreviewNamingAccordion(
  accordionRoot: HTMLElement,
  trigger: HTMLElement,
): void {
  const card = trigger.closest('.nav-preview-panel__naming-card');
  if (!(card instanceof HTMLElement)) return;

  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  const nextExpanded = !isExpanded;

  for (const siblingTrigger of accordionRoot.querySelectorAll(
    '[data-nav-naming-toggle]',
  )) {
    if (!(siblingTrigger instanceof HTMLElement)) continue;
    if (siblingTrigger === trigger) continue;

    const siblingCard = siblingTrigger.closest(
      '.nav-preview-panel__naming-card',
    );
    if (!(siblingCard instanceof HTMLElement)) continue;

    setNamingPanelExpanded(siblingCard, siblingTrigger, false);
  }

  setNamingPanelExpanded(card, trigger, nextExpanded);
}

export function bindNavPreviewNamingAccordion(
  panelRoot: HTMLElement,
): () => void {
  const onClick = (event: Event) => {
    if (!(event.target instanceof Element)) return;

    const goButton = event.target.closest('[data-nav-naming-go]');
    if (goButton instanceof HTMLElement) {
      event.preventDefault();
      event.stopPropagation();
      const hotspotId = goButton.getAttribute('data-nav-naming-go');
      if (hotspotId) {
        panelHandlers?.onGoToNaming(hotspotId);
      }
      return;
    }

    const toggle = event.target.closest('[data-nav-naming-toggle]');
    if (toggle instanceof HTMLElement) {
      event.preventDefault();
      event.stopPropagation();
      const accordion = toggle.closest('[data-nav-naming-accordion]');
      if (accordion instanceof HTMLElement) {
        toggleNavPreviewNamingAccordion(accordion, toggle);
      }
    }
  };

  panelRoot.addEventListener('click', onClick, true);
  return () => panelRoot.removeEventListener('click', onClick, true);
}
