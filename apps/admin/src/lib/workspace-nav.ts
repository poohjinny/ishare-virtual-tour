import {
  Building2,
  HandHeart,
  Info,
  ListTree,
  MapPinned,
  type LucideIcon,
} from 'lucide-react';

import { tourPath } from '@/lib/admin-routes';

/**
 * One definition of the tour/client workspace surfaces, so every tab bar that
 * renders them stays in step. The panorama editor is a tool route
 * (`/tours/[tourId]/edit`), not a workspace tab.
 */

type WorkspaceMatch = 'exact' | 'prefix';

export interface WorkspaceNavItem {
  suffix: string;
  label: string;
  icon: LucideIcon;
  match: WorkspaceMatch;
}

export interface TourWorkspaceNavItem extends WorkspaceNavItem {
  countKey?: 'scenes' | 'namings';
}

export interface ClientWorkspaceNavItem extends WorkspaceNavItem {
  countKey?: 'tours';
}

export const TOUR_WORKSPACE_ITEMS: TourWorkspaceNavItem[] = [
  { suffix: '', label: 'Details', icon: Info, match: 'exact' },
  {
    suffix: '/scenes',
    label: 'Scenes',
    icon: ListTree,
    match: 'prefix',
    countKey: 'scenes',
  },
  {
    suffix: '/namings',
    label: 'Namings',
    icon: HandHeart,
    match: 'exact',
    countKey: 'namings',
  },
];

export const CLIENT_WORKSPACE_ITEMS: ClientWorkspaceNavItem[] = [
  { suffix: '', label: 'Details', icon: Building2, match: 'exact' },
  {
    suffix: '/tours',
    label: 'Tours',
    icon: MapPinned,
    match: 'exact',
    countKey: 'tours',
  },
];

export function isWorkspaceItemActive(
  pathname: string,
  href: string,
  match: WorkspaceMatch,
) {
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Details / Scenes / Namings list — not Layout, scene, or naming children. */
export function isTourWorkspaceSurface(pathname: string, tourId: string) {
  const base = tourPath(tourId);
  return (
    pathname === base ||
    pathname === `${base}/scenes` ||
    pathname === `${base}/namings`
  );
}
