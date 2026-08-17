/** Status chips — color + label. Tooltip only when the label is coded or unclear. */
'use client';

import type { CSSProperties, ComponentProps, ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { HandHeart, Info, Navigation } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge, badgeVariants } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NAMING_STATUS_OPTIONS } from '@/lib/authoring-copy';
import { VIEWER_ICONS } from '@/lib/semantic-icons';
import type { AdminStaffRole, AdminStaffStatus } from '@/lib/admin-users';
import type { TourVisibility } from '@/lib/tour-catalog';
import type { AdminNamingStatus } from '@/lib/tour-namings';
import { cn } from '@/lib/utils';

/**
 * Feeds the item color to the `.badge-item` recipe. The variable goes inline
 * because Tailwind only emits class names it can read literally in the source,
 * and these tokens are picked per row.
 */
function itemBadge(token: string): CSSProperties {
  return { '--badge-item': `var(${token})` } as CSSProperties;
}

/** Table, info, and gallery-hero chips all read from the same item color. */
const visibilityItem: Record<TourVisibility, CSSProperties> = {
  public: itemBadge('--visibility-public'),
  unlisted: itemBadge('--visibility-unlisted'),
  internal: itemBadge('--visibility-internal'),
};

/** Viewer tour-category tokens — slug matches catalog labels. */
const categoryItem = {
  healthcare: itemBadge('--category-healthcare'),
  education: itemBadge('--category-education'),
  culture: itemBadge('--category-culture'),
  'sporting-venues': itemBadge('--category-sporting'),
  'international-aid': itemBadge('--category-aid'),
  'social-services': itemBadge('--category-social'),
  tourism: itemBadge('--category-tourism'),
  demo: itemBadge('--category-demo'),
} satisfies Record<string, CSSProperties>;

type CategorySlug = keyof typeof categoryItem;

function categorySlug(category: string): CategorySlug | undefined {
  const slug = category.trim().toLowerCase().replaceAll(/\s+/g, '-');
  return slug in categoryItem ? (slug as CategorySlug) : undefined;
}

const visibilityLabel: Record<TourVisibility, string> = {
  public: 'Public',
  unlisted: 'Unlisted',
  internal: 'Internal',
};

const namingStatusLabel = Object.fromEntries(
  NAMING_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<AdminNamingStatus, string>;

const namingStatusVariant = {
  open: 'success',
  reserved: 'warning',
  soon: 'info',
  sold: 'accent',
} as const;

const staffStatusMeta = {
  local: { label: 'Local', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  invited: { label: 'Invited', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'secondary' },
} as const satisfies Record<
  AdminStaffStatus,
  { label: string; variant: ComponentProps<typeof Badge>['variant'] }
>;

const staffRoleVariant = {
  Master: 'info',
  Editor: 'accent',
  Viewer: 'secondary',
} as const satisfies Record<
  AdminStaffRole,
  ComponentProps<typeof Badge>['variant']
>;

const hotspotTypeMeta = {
  naming: { label: 'Naming', hint: 'Naming opportunity pin', icon: HandHeart },
  nav: { label: 'Nav', hint: 'Link to another scene', icon: Navigation },
  info: { label: 'Info', hint: 'Information hotspot', icon: Info },
} as const;

const hotspotTypeVariant = {
  naming: 'naming',
  nav: 'info',
  info: 'caution',
} as const;

type BadgeSize = VariantProps<typeof badgeVariants>['size'];

function BadgeWithHint({
  hint,
  children,
  className,
  style,
  variant,
  size,
}: {
  hint: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: ComponentProps<typeof Badge>['variant'];
  size?: BadgeSize;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={variant}
          size={size}
          style={style}
          className={className}
        >
          {children}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

export function VisibilityBadge({
  visibility,
  className,
  hero = false,
  size,
}: {
  visibility: TourVisibility;
  className?: string;
  hero?: boolean;
  size?: BadgeSize;
}) {
  return (
    <Badge
      variant={hero ? 'hero' : 'outline'}
      size={size}
      style={visibilityItem[visibility]}
      className={cn(
        'border-transparent',
        hero ? 'badge-item-solid' : 'badge-item',
        className,
      )}
    >
      {visibilityLabel[visibility]}
    </Badge>
  );
}

export function NamingStatusBadge({
  status,
  className,
}: {
  status: AdminNamingStatus;
  className?: string;
}) {
  return (
    <Badge variant={namingStatusVariant[status]} className={className}>
      {namingStatusLabel[status]}
    </Badge>
  );
}

export function StaffStatusBadge({
  status,
  className,
}: {
  status: AdminStaffStatus;
  className?: string;
}) {
  const meta = staffStatusMeta[status];
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

export function StaffRoleBadge({
  role,
  className,
  size,
}: {
  role: AdminStaffRole;
  className?: string;
  size?: BadgeSize;
}) {
  return (
    <Badge
      variant={staffRoleVariant[role]}
      size={size}
      className={className}
    >
      {role}
    </Badge>
  );
}

export function CategoryBadge({
  category,
  className,
  hero = false,
  size,
}: {
  category: string;
  className?: string;
  hero?: boolean;
  size?: BadgeSize;
}) {
  const slug = categorySlug(category);

  return (
    <Badge
      variant={hero ? 'hero' : 'outline'}
      size={size}
      style={slug ? categoryItem[slug] : undefined}
      className={cn(
        'border-transparent',
        !slug ? hero && 'bg-foreground text-background'
        : hero ? 'badge-item-solid'
        : 'badge-item',
        className,
      )}
    >
      {category}
    </Badge>
  );
}

export function LicenseBadge({
  licensed,
  className,
}: {
  licensed: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant='outline'
      style={
        licensed ?
          itemBadge('--license-licensed')
        : itemBadge('--license-unlicensed')
      }
      className={cn('badge-item border-transparent', className)}
    >
      {licensed ? 'Licensed' : 'Unlicensed'}
    </Badge>
  );
}

export function ViewerTypeBadge({
  viewerType,
  className,
  size,
  hero = false,
}: {
  viewerType: 'panorama' | 'model3d';
  className?: string;
  size?: BadgeSize;
  hero?: boolean;
}) {
  const Icon: LucideIcon = VIEWER_ICONS[viewerType];
  const label = viewerType === 'model3d' ? '3D' : '360°';
  const hint =
    viewerType === 'model3d' ? '3D model tour' : '360° panorama tour';

  return (
    <BadgeWithHint
      hint={hint}
      variant={hero ? 'hero' : 'secondary'}
      size={size}
      style={
        hero ? undefined
        : viewerType === 'model3d' ?
          itemBadge('--viewer-model3d')
        : itemBadge('--viewer-panorama')
      }
      className={cn(
        hero ?
          'bg-foreground text-background'
        : 'badge-item border-transparent',
        className,
      )}
    >
      <Icon aria-hidden='true' />
      {label}
    </BadgeWithHint>
  );
}

export function HotspotTypeBadge({
  type,
  namingId,
  className,
}: {
  type: 'nav' | 'info';
  namingId?: string;
  className?: string;
}) {
  const kind = namingId ? 'naming' : type;
  const meta = hotspotTypeMeta[kind];
  const Icon = meta.icon;

  if (kind === 'naming') {
    return (
      <Badge variant={hotspotTypeVariant[kind]} className={className}>
        <Icon aria-hidden='true' />
        {meta.label}
      </Badge>
    );
  }

  return (
    <BadgeWithHint
      hint={meta.hint}
      variant={hotspotTypeVariant[kind]}
      className={className}
    >
      <Icon aria-hidden='true' />
      {meta.label}
    </BadgeWithHint>
  );
}
