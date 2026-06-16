import type { NamingOpportunityStatus } from '../../types/tour';
import { namingOpportunityStatusConfig } from '../../data/namingOpportunityStatus';
import { Badge, type NamingStatusModifier } from './Badge';

export interface NamingStatusBadgeProps {
  status?: NamingOpportunityStatus;
  statusModifier?: NamingStatusModifier;
  label?: string;
  /** Accessible name when visible label is abbreviated */
  ariaLabel?: string;
  /** Search / compact lists — uses status short label when `status` is set */
  compact?: boolean;
  uppercase?: boolean;
  className?: string;
}

export function NamingStatusBadge({
  status,
  statusModifier: statusModifierProp,
  label: labelProp,
  ariaLabel: ariaLabelProp,
  compact = false,
  uppercase = true,
  className = '',
}: NamingStatusBadgeProps) {
  const config =
    status !== undefined ? namingOpportunityStatusConfig(status) : undefined;
  const statusModifier = (config?.cssModifier ?? statusModifierProp) as
    | NamingStatusModifier
    | undefined;
  const label =
    labelProp ??
    (config ?
      compact ? config.shortLabel
      : config.label
    : undefined);
  const ariaLabel =
    ariaLabelProp ??
    (compact && config && label !== config.label ? config.label : undefined);

  if (!statusModifier || !label) return null;

  return (
    <Badge
      variant='fill'
      size='sm'
      statusModifier={statusModifier}
      uppercase={uppercase}
      className={className}
      aria-label={ariaLabel}
    >
      {label}
    </Badge>
  );
}
