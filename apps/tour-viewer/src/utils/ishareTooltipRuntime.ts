import type { IshareTooltipPlacement } from '../components/ui/tooltipClasses';
import { computeIshareTooltipPosition } from './ishareTooltipPosition';

const BUBBLE_CLASS = 'ishare-tooltip-bubble';
const BUBBLE_ENTERED_CLASS = 'ishare-tooltip-bubble--entered';
const HOST_SELECTOR = '.ishare-tooltip-host[data-ishare-tooltip]';
/** Keep in sync with `.ishare-tooltip-bubble` opacity transition. */
const TOOLTIP_FADE_MS = 140;

let bubble: HTMLSpanElement | null = null;
let activeAnchor: HTMLElement | null = null;
let activePlacement: IshareTooltipPlacement = 'top';
let hideTimer: number | null = null;
let enterRaf = 0;
let delegationInstalled = false;

function canUseHoverTooltips(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureBubble(): HTMLSpanElement {
  if (bubble && bubble.isConnected) return bubble;
  const node = document.createElement('span');
  node.className = BUBBLE_CLASS;
  node.setAttribute('role', 'tooltip');
  node.style.visibility = 'hidden';
  node.style.left = '0px';
  node.style.top = '0px';
  document.body.appendChild(node);
  bubble = node;
  return node;
}

function readPlacement(anchor: HTMLElement): IshareTooltipPlacement {
  const raw = anchor.getAttribute('data-ishare-tooltip-placement');
  if (raw === 'bottom' || raw === 'left' || raw === 'right' || raw === 'top') {
    return raw;
  }
  return 'top';
}

function cancelEnterRaf(): void {
  if (enterRaf) {
    window.cancelAnimationFrame(enterRaf);
    enterRaf = 0;
  }
}

function cancelHideTimer(): void {
  if (hideTimer != null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function clearWindowListeners(): void {
  window.removeEventListener('resize', onWindowReposition);
  window.removeEventListener('scroll', onWindowReposition, true);
}

function reposition(): void {
  if (!activeAnchor || !bubble) return;
  // Prefer layout size (ignores enter/exit translate) so placement offset
  // doesn’t skew the resting left/top.
  const tipWidth = bubble.offsetWidth;
  const tipHeight = bubble.offsetHeight;
  if (tipWidth <= 0 || tipHeight <= 0) return;

  const next = computeIshareTooltipPosition({
    trigger: activeAnchor.getBoundingClientRect(),
    tipWidth,
    tipHeight,
    preferred: activePlacement,
  });
  bubble.style.left = `${next.left}px`;
  bubble.style.top = `${next.top}px`;
  bubble.setAttribute('data-ishare-tooltip-placement', next.placement);
}

function onWindowReposition(): void {
  if (!activeAnchor) return;
  reposition();
}

function clearBubbleVisual(): void {
  if (!bubble) return;
  bubble.classList.remove(BUBBLE_ENTERED_CLASS);
  bubble.style.visibility = 'hidden';
  bubble.textContent = '';
}

function scheduleEnter(anchor: HTMLElement): void {
  cancelEnterRaf();
  if (prefersReducedMotion()) {
    bubble?.classList.add(BUBBLE_ENTERED_CLASS);
    return;
  }
  // Double rAF so opacity:0 paints before transitioning to --entered.
  enterRaf = window.requestAnimationFrame(() => {
    enterRaf = window.requestAnimationFrame(() => {
      enterRaf = 0;
      if (activeAnchor !== anchor || !bubble) return;
      bubble.classList.add(BUBBLE_ENTERED_CLASS);
    });
  });
}

/** Show (or refresh) the shared body-portaled tooltip for an anchor. */
export function showIshareTooltip(options: {
  anchor: HTMLElement;
  label: string;
  placement?: IshareTooltipPlacement;
}): void {
  const label = options.label.trim();
  if (!label) {
    hideIshareTooltip(options.anchor);
    return;
  }

  ensureIshareTooltipDelegation();
  cancelHideTimer();
  cancelEnterRaf();

  const node = ensureBubble();
  const alreadyOpen =
    activeAnchor === options.anchor &&
    node.style.visibility !== 'hidden' &&
    node.classList.contains(BUBBLE_ENTERED_CLASS);

  activeAnchor = options.anchor;
  activePlacement = options.placement ?? readPlacement(options.anchor);
  node.textContent = label;

  window.addEventListener('resize', onWindowReposition);
  window.addEventListener('scroll', onWindowReposition, true);

  if (alreadyOpen) {
    // Label/placement refresh while visible — keep faded in.
    reposition();
    return;
  }

  // Measure while hidden, then reveal at opacity 0 and fade/slide in.
  node.classList.remove(BUBBLE_ENTERED_CLASS);
  node.style.visibility = 'hidden';
  node.style.left = '0px';
  node.style.top = '0px';
  // Preferred side first so left/right CSS translate is ready before paint;
  // reposition may flip and update the attribute.
  node.setAttribute('data-ishare-tooltip-placement', activePlacement);
  reposition();
  node.style.visibility = 'visible';
  void node.offsetWidth;
  scheduleEnter(options.anchor);
}

/** Hide the shared tooltip. Pass `anchor` to only hide if that host is active. */
export function hideIshareTooltip(anchor?: HTMLElement | null): void {
  if (anchor && activeAnchor && activeAnchor !== anchor) return;

  cancelEnterRaf();
  clearWindowListeners();
  activeAnchor = null;

  if (!bubble) return;

  if (prefersReducedMotion() || bubble.style.visibility === 'hidden') {
    cancelHideTimer();
    clearBubbleVisual();
    return;
  }

  bubble.classList.remove(BUBBLE_ENTERED_CLASS);
  cancelHideTimer();
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    clearBubbleVisual();
  }, TOOLTIP_FADE_MS);
}

/** Refresh the open bubble when an active host’s label changes. */
export function refreshIshareTooltipIfActive(
  anchor: HTMLElement,
  labelOverride?: string,
  placementOverride?: IshareTooltipPlacement,
): void {
  if (activeAnchor !== anchor || !bubble) return;
  const label = (
    labelOverride ??
    anchor.getAttribute('data-ishare-tooltip') ??
    ''
  ).trim();
  if (!label) {
    hideIshareTooltip(anchor);
    return;
  }
  bubble.textContent = label;
  if (placementOverride) {
    activePlacement = placementOverride;
  } else if (anchor.hasAttribute('data-ishare-tooltip-placement')) {
    activePlacement = readPlacement(anchor);
  }
  reposition();
}

function resolveHost(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest(HOST_SELECTOR);
}

function onPointerOver(event: PointerEvent): void {
  if (!canUseHoverTooltips()) return;
  const host = resolveHost(event.target);
  if (!host) return;
  const label = host.getAttribute('data-ishare-tooltip') ?? '';
  if (!label.trim()) return;
  if (host === activeAnchor) return;
  showIshareTooltip({ anchor: host, label, placement: readPlacement(host) });
}

function onPointerOut(event: PointerEvent): void {
  const host = resolveHost(event.target);
  if (!host || host !== activeAnchor) return;
  const next = event.relatedTarget;
  if (next instanceof Node && host.contains(next)) return;
  hideIshareTooltip(host);
}

function onFocusIn(event: FocusEvent): void {
  const host = resolveHost(event.target);
  if (!host) return;
  const label = host.getAttribute('data-ishare-tooltip') ?? '';
  if (!label.trim()) return;
  showIshareTooltip({ anchor: host, label, placement: readPlacement(host) });
}

function onFocusOut(event: FocusEvent): void {
  const host = resolveHost(event.target);
  if (!host || host !== activeAnchor) return;
  const next = event.relatedTarget;
  if (next instanceof Node && host.contains(next)) return;
  hideIshareTooltip(host);
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') hideIshareTooltip();
}

/**
 * Document-level listeners for HTML/`data-ishare-tooltip` hosts
 * (PSV navbar, markers, share header). Safe to call repeatedly.
 */
export function ensureIshareTooltipDelegation(): void {
  if (delegationInstalled || typeof document === 'undefined') return;
  delegationInstalled = true;
  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('keydown', onKeyDown, true);
}
