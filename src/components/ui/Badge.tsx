import './Badge.css';

export type BadgeVariant = 'outline' | 'soft';
export type BadgeTone = 'primary' | 'accent' | 'muted';

export interface BadgeProps {
  children: React.ReactNode;
  /** outline = bordered pill; soft = tinted fill */
  variant?: BadgeVariant;
  tone?: BadgeTone;
  dot?: boolean;
  uppercase?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Badge({
  children,
  variant = 'outline',
  tone = 'muted',
  dot = false,
  uppercase = false,
  className = '',
  'aria-label': ariaLabel,
}: BadgeProps) {
  const classes = [
    'ishare-badge',
    `ishare-badge--${variant}`,
    `ishare-badge--tone-${tone}`,
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
