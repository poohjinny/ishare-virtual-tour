import type { NavbarCustomButton, Viewer } from '@photo-sphere-viewer/core';

/** Visual-only PSV navbar gutter between control groups. */
export function createNavbarGroupDivider(id: string): NavbarCustomButton {
  return {
    id,
    title: '',
    className: 'psv-nav-group-divider',
    content:
      '<span class="psv-nav-group-divider__line" aria-hidden="true"></span>',
    collapsable: false,
    disabled: true,
    onClick() {
      /* decorative */
    },
  };
}

/** Strip tooltip/a11y chrome from decorative dividers after PSV mounts them. */
export function polishNavbarGroupDividers(viewer: Viewer): void {
  viewer.container
    .querySelectorAll<HTMLElement>('.psv-nav-group-divider')
    .forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
      el.removeAttribute('title');
      el.removeAttribute('aria-label');
      el.removeAttribute('data-ishare-tooltip');
      el.removeAttribute('data-ishare-tooltip-placement');
      el.classList.remove('ishare-tooltip-host');
      el.tabIndex = -1;
    });
}
