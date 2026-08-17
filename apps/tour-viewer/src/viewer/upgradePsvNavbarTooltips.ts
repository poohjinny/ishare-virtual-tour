import type { Viewer } from '@photo-sphere-viewer/core';
import { upgradeNativeTooltipsIn } from '../utils/ishareTooltipDom';

export function upgradePsvNavbarTooltips(viewer: Viewer): void {
  const navbar = viewer.container.querySelector('.psv-navbar');
  if (!navbar) return;

  upgradeNativeTooltipsIn(navbar, 'top');
}
