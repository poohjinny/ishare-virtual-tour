import './Badge.css';

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

  const classes = [
    'ishare-badge',

    `ishare-badge--${resolvedVariant}`,

    resolvedVariant === 'fill' && `ishare-badge--fill-${size}`,

    statusModifier ?
      `ishare-badge--status-${statusModifier}`
    : tone !== 'none' && `ishare-badge--tone-${tone}`,

    uppercase && 'ishare-badge--uppercase',

    className,
  ]

    .filter(Boolean)

    .join(' ');

  return (
    <span className={classes} aria-label={ariaLabel}>
      {dot ?
        <span className='ishare-badge__dot' aria-hidden='true' />
      : null}

      {children}
    </span>
  );
}
