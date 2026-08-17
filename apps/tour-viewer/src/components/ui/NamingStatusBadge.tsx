import type { NamingOpportunityStatus } from '../../types/tour';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusShowsBadge,
} from '../../data/namingOpportunityStatus';
import { Badge, type NamingStatusModifier } from './Badge';

export interface NamingStatusBadgeProps {
  status?: NamingOpportunityStatus;
  statusModifier?: NamingStatusModifier;
  label?: string;
  /** Accessible name when visible label is abbreviated */
  ariaLabel?: string;
  /** Search / compact lists — uses status short label when `status` is set */
  compact?: boolean;
  /**
   * Guide reply text may surface Open as a chip. Explore gallery/list and
   * guide cards still hide Open via {@link namingOpportunityStatusShowsBadge}.
   */
  includeOpen?: boolean;
  uppercase?: boolean;
  className?: string;
}

export function NamingStatusBadge({
  status,
  statusModifier: statusModifierProp,
  label: labelProp,
  ariaLabel: ariaLabelProp,
  compact = false,
  includeOpen = false,
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
  if (
    !includeOpen &&
    !namingOpportunityStatusShowsBadge(
      status ?? (statusModifier as NamingOpportunityStatus),
    )
  ) {
    return null;
  }

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
