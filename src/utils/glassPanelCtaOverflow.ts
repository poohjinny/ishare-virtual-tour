export const GLASS_PANEL_CTA_TEXT_SELECTOR =
  '.tour-glass-panel__footer .tour-glass-panel__cta-text';

export function isCtaTextTruncated(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth + 1;
}

export function ctaTextFullLabel(element: HTMLElement): string {
  return element.dataset.ctaLabel?.trim() || element.textContent?.trim() || '';
}

export function applyCtaTextOverflowTitle(element: HTMLElement): void {
  const fullLabel = ctaTextFullLabel(element);

  if (!fullLabel) {
    element.removeAttribute('title');
    return;
  }

  if (isCtaTextTruncated(element)) {
    element.title = fullLabel;
  } else {
    element.removeAttribute('title');
  }
}

export function refreshGlassPanelCtaOverflowTitles(root: ParentNode): void {
  for (const element of root.querySelectorAll(GLASS_PANEL_CTA_TEXT_SELECTOR)) {
    if (element instanceof HTMLElement) {
      applyCtaTextOverflowTitle(element);
    }
  }
}

export function bindGlassPanelCtaOverflowTitles(root: ParentNode): () => void {
  const observed = new Set<HTMLElement>();

  const refresh = () => {
    refreshGlassPanelCtaOverflowTitles(root);
  };

  const observe = (element: HTMLElement) => {
    if (observed.has(element)) return;
    observed.add(element);
    resizeObserver.observe(element);
  };

  const resizeObserver = new ResizeObserver(() => {
    refresh();
  });

  refresh();

  for (const element of root.querySelectorAll(GLASS_PANEL_CTA_TEXT_SELECTOR)) {
    if (element instanceof HTMLElement) {
      observe(element);
    }
  }

  if (root instanceof HTMLElement) {
    observe(root);

    const footer = root.querySelector('.tour-glass-panel__footer');
    if (footer instanceof HTMLElement) {
      observe(footer);
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(refresh);
  });

  return () => {
    resizeObserver.disconnect();
    observed.clear();
  };
}
