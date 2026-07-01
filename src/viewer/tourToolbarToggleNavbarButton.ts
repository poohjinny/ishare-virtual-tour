import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

import {
  TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL,
  TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL,
} from '../constants/tourToolbar';
import {
  applyIshareTooltipDom,
  setIshareTooltipLabel,
} from '../utils/ishareTooltipDom';

export const TOUR_TOOLBAR_TOGGLE_BUTTON_ID = 'tour-toolbar-toggle';

const TOOLBAR_TOGGLE_MATERIAL_SYMBOL_CLASS =
  'material-symbols-rounded psv-toolbar-toggle-material-symbol';

function toolbarMaterialSymbolIcon(name: string): string {
  return `<span class="${TOOLBAR_TOGGLE_MATERIAL_SYMBOL_CLASS}" aria-hidden="true">${name}</span>`;
}

const TOOLBAR_EXPAND_ICON = toolbarMaterialSymbolIcon('unfold_more');

const TOOLBAR_COLLAPSE_ICON = toolbarMaterialSymbolIcon('unfold_less');

interface NavbarButtonWithContainer {
  container: HTMLElement;
  show: (refresh?: boolean) => void;
  hide: (refresh?: boolean) => void;
}

function autoSizeNavbar(viewer: Viewer) {
  (viewer.navbar as unknown as { autoSize: () => void }).autoSize();
}

function resolveToolbarToggleRoot(container: HTMLElement): HTMLElement {
  const root = container.closest('.psv-tour-toolbar-toggle');
  return root instanceof HTMLElement ? root : container;
}

function resolveToolbarToggleLabel(collapsed: boolean): string {
  return collapsed ?
      TOUR_TOOLBAR_TOGGLE_EXPAND_LABEL
    : TOUR_TOOLBAR_TOGGLE_COLLAPSE_LABEL;
}

function wrapToolbarIcon(svg: string): string {
  return `<span class="psv-toolbar-toggle-icon-stack" aria-hidden="true">${svg}</span>`;
}

function resolveToolbarIcon(collapsed: boolean): string {
  return wrapToolbarIcon(
    collapsed ? TOOLBAR_EXPAND_ICON : TOOLBAR_COLLAPSE_ICON,
  );
}

function applyToolbarToggleTooltip(root: HTMLElement, label: string): void {
  if (root.classList.contains('ishare-tooltip-host')) {
    setIshareTooltipLabel(root, label);
    return;
  }

  applyIshareTooltipDom(root, label, 'top');
}

export function createTourToolbarToggleNavbarButton(
  getCollapsed: () => boolean,
  onToggle: () => void,
): NavbarCustomButton {
  const collapsed = getCollapsed();

  return {
    id: TOUR_TOOLBAR_TOGGLE_BUTTON_ID,
    title: resolveToolbarToggleLabel(collapsed),
    className: 'psv-tour-toolbar-toggle',
    content: resolveToolbarIcon(collapsed),
    collapsable: false,
    onClick() {
      onToggle();
    },
  };
}

export function syncTourToolbarToggleNavbarButton(
  viewer: Viewer,
  collapsed: boolean,
): void {
  const button = viewer.navbar.getButton(
    TOUR_TOOLBAR_TOGGLE_BUTTON_ID,
    false,
  ) as NavbarButtonWithContainer | undefined;

  if (!button) return;

  const root = resolveToolbarToggleRoot(button.container);
  const label = resolveToolbarToggleLabel(collapsed);

  applyToolbarToggleTooltip(root, label);
  root.setAttribute('aria-label', label);
  root.classList.add('psv-button--hover-scale');
  if (button.container !== root) {
    button.container.removeAttribute('title');
    button.container.removeAttribute('data-ishare-tooltip');
    button.container.removeAttribute('data-ishare-tooltip-placement');
    button.container.classList.remove('ishare-tooltip-host');
  }
  button.container.innerHTML = resolveToolbarIcon(collapsed);
  autoSizeNavbar(viewer);
}

export function syncTourToolbarToggleNavbarButtonVisibility(
  viewer: Viewer,
  visible: boolean,
): void {
  const button = viewer.navbar.getButton(
    TOUR_TOOLBAR_TOGGLE_BUTTON_ID,
    false,
  ) as NavbarButtonWithContainer | undefined;

  if (!button) return;

  if (visible) {
    button.show(false);
  } else {
    button.hide(false);
  }

  autoSizeNavbar(viewer);
}
