import type { IshareTooltipPlacement } from '../components/ui/tooltipClasses';

const TOOLTIP_HOST_CLASS = 'ishare-tooltip-host';

/** Apply dark iShare tooltip to a DOM element (PSV navbar, HTML markers). */
export function applyIshareTooltipDom(
  element: HTMLElement,
  label: string,
  placement: IshareTooltipPlacement = 'top',
): void {
  element.classList.add(TOOLTIP_HOST_CLASS);
  element.setAttribute('data-ishare-tooltip', label);
  element.setAttribute('data-ishare-tooltip-placement', placement);
  element.removeAttribute('title');
}

/** Update tooltip copy on an element that already uses iShare tooltips. */
export function setIshareTooltipLabel(
  element: HTMLElement,
  label: string,
): void {
  element.setAttribute('data-ishare-tooltip', label);
  element.removeAttribute('title');
}

/** Upgrade native `title` tooltips inside a root (e.g. PSV navbar). */
export function upgradeNativeTooltipsIn(
  root: ParentNode,
  placement: IshareTooltipPlacement = 'top',
): void {
  root.querySelectorAll<HTMLElement>('[title]').forEach((element) => {
    const label = element.getAttribute('title');
    if (!label) return;
    applyIshareTooltipDom(element, label, placement);
  });
}
