import { cn } from '../../lib/cn';
import { badgeDotVariants, badgeVariants } from './badgeVariants';

export type BadgeVariant = 'outline' | 'fill';

/** @deprecated Use `fill` */
export type BadgeLegacyVariant = BadgeVariant | 'soft';

export type BadgeSize = 'sm' | 'lg';

export type BadgeTone = 'primary' | 'accent' | 'muted' | 'none';

export type NamingStatusModifier =
  | 'on-sale'
  | 'sold'
  | 'reserved'
  | 'coming-soon';

export interface BadgeProps {
  children: React.ReactNode;
  /** outline = bordered contextual; fill = tinted chip */
  variant?: BadgeLegacyVariant;
  /** sm = list chips; lg = panel header badges (fill only) */
  size?: BadgeSize;
  tone?: BadgeTone;
  /** Naming opportunity status — uses shared status colors instead of tone */
  statusModifier?: NamingStatusModifier;
  dot?: boolean;
  uppercase?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Badge({
  children,
  variant = 'outline',
  size = 'sm',
  tone = 'muted',
  statusModifier,
  dot = false,
  uppercase = false,
  className = '',
  'aria-label': ariaLabel,
}: BadgeProps) {
  const resolvedVariant = variant === 'soft' ? 'fill' : variant;
  const resolvedTone = statusModifier ? 'none' : tone;
  const resolvedStatus = statusModifier ?? 'none';

  return (
    <span
      className={cn(
        badgeVariants({
          variant: resolvedVariant,
          size: resolvedVariant === 'fill' ? size : 'sm',
          tone: resolvedTone,
          status: resolvedStatus,
          uppercase,
        }),
        className,
      )}
      aria-label={ariaLabel}
    >
      {dot ?
        <span
          className={badgeDotVariants({ tone: statusModifier ? 'none' : tone })}
          aria-hidden='true'
        />
      : null}
      {children}
    </span>
  );
}
