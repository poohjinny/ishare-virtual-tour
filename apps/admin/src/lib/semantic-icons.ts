/**
 * Semantic glyphs shared by badges, menus, and filters — the icon counterpart
 * to `semantic-colors.ts`. One value, one glyph, so a filter row and the badge
 * it names cannot drift apart.
 */

import {
  Bookmark,
  Box,
  CircleCheck,
  CircleDot,
  Clock,
  Compass,
  Eye,
  EyeOff,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Link2,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Tag,
  UserRound,
  Trophy,
  Users,
  View,
  type LucideIcon,
} from 'lucide-react';

import { semanticSlug } from '@/lib/semantic-colors';
import type { AdminStaffRole } from '@/lib/admin-users';
import type { TourVisibility } from '@/lib/tour-catalog';
import type { AdminNamingStatus } from '@/lib/tour-namings';

/** Unlisted is the link-only tier, so it reads as a link rather than a state of the eye. */
export const VISIBILITY_ICONS: Record<TourVisibility, LucideIcon> = {
  public: Eye,
  unlisted: Link2,
  internal: EyeOff,
};

export const LICENSE_ICONS = {
  licensed: ShieldCheck,
  unlicensed: ShieldOff,
} as const;

export const VIEWER_ICONS = {
  panorama: View,
  model3d: Box,
} as const;

/** Staff roles read as their scope: manage staff, author, or look. */
export const STAFF_ROLE_ICONS: Record<AdminStaffRole, LucideIcon> = {
  Master: ShieldCheck,
  Editor: Pencil,
  Viewer: UserRound,
};

export const NAMING_STATUS_ICONS: Record<AdminNamingStatus, LucideIcon> = {
  open: CircleDot,
  reserved: Bookmark,
  soon: Clock,
  sold: CircleCheck,
};

/** Keyed by catalog category slug — see `CATEGORY_COLORS` for the same vocabulary. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  healthcare: HeartPulse,
  education: GraduationCap,
  culture: Landmark,
  'sporting-venues': Trophy,
  'international-aid': Globe,
  'social-services': Users,
  tourism: Compass,
  demo: FlaskConical,
};

/** Categories come from the catalog, so an unknown one falls back to the concept glyph. */
export function categoryIcon(label: string): LucideIcon {
  return CATEGORY_ICONS[semanticSlug(label)] ?? Tag;
}

/** Vocabulary an option value belongs to, for menus that render values generically. */
export type SemanticIconKind =
  | 'category'
  | 'license'
  | 'namingStatus'
  | 'viewer'
  | 'visibility';

/** Categories are open-ended catalog strings, so they resolve through the slug lookup. */
const VALUE_ICONS: Record<
  Exclude<SemanticIconKind, 'category'>,
  Record<string, LucideIcon>
> = {
  license: LICENSE_ICONS,
  namingStatus: NAMING_STATUS_ICONS,
  viewer: VIEWER_ICONS,
  visibility: VISIBILITY_ICONS,
};

export function semanticValueIcon(
  kind: SemanticIconKind,
  value: string,
): LucideIcon | undefined {
  return kind === 'category' ? categoryIcon(value) : VALUE_ICONS[kind][value];
}
