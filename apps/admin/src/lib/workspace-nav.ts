import {
  Building2,
  HandHeart,
  Info,
  ListTree,
  MapPinned,
  PencilRuler,
  type LucideIcon,
} from 'lucide-react';

/**
 * One definition of the tour/client workspace surfaces, so every tab bar that
 * renders them stays in step.
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
  /** Panorama-only surface — model3d tours have no visual editor. */
  editorOnly?: boolean;
}

export interface ClientWorkspaceNavItem extends WorkspaceNavItem {
  countKey?: 'tours';
}

const TOUR_WORKSPACE_ITEMS: TourWorkspaceNavItem[] = [
  { suffix: '', label: 'Details', icon: Info, match: 'exact' },
  {
    suffix: '/edit',
    label: 'Editor',
    icon: PencilRuler,
    match: 'exact',
    editorOnly: true,
  },
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

export function tourWorkspaceItems(showEditor: boolean) {
  return TOUR_WORKSPACE_ITEMS.filter((item) => !item.editorOnly || showEditor);
}

export function isWorkspaceItemActive(
  pathname: string,
  href: string,
  match: WorkspaceMatch,
) {
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
