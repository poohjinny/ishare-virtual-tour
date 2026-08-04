import type { IshareTooltipPlacement } from '../components/ui/tooltipClasses';
import {
  ensureIshareTooltipDelegation,
  hideIshareTooltip,
  refreshIshareTooltipIfActive,
  showIshareTooltip,
} from './ishareTooltipRuntime';

const TOOLTIP_HOST_CLASS = 'ishare-tooltip-host';
const TOOLTIP_PORTAL_CLASS = 'ishare-tooltip-host--portal';

/** Apply dark iShare tooltip to a DOM element (PSV navbar, HTML markers). */
export function applyIshareTooltipDom(
  element: HTMLElement,
  label: string,
  placement: IshareTooltipPlacement = 'top',
): void {
  ensureIshareTooltipDelegation();
  element.classList.add(TOOLTIP_HOST_CLASS, TOOLTIP_PORTAL_CLASS);
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
  refreshIshareTooltipIfActive(element);
}

/** Upgrade native `title` tooltips inside a root (e.g. PSV navbar). */
export function upgradeNativeTooltipsIn(
  root: ParentNode,
  placement: IshareTooltipPlacement = 'top',
): void {
  ensureIshareTooltipDelegation();
  root.querySelectorAll<HTMLElement>('[title]').forEach((element) => {
    const nextLabel = element.getAttribute('title');
    if (!nextLabel) return;
    applyIshareTooltipDom(element, nextLabel, placement);
  });
}

export {
  hideIshareTooltip,
  showIshareTooltip,
  ensureIshareTooltipDelegation,
};
