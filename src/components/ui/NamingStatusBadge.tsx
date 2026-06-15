import type { NamingOpportunityStatus } from '../../types/tour';
import { namingOpportunityStatusConfig } from '../../data/namingOpportunityStatus';
import { Badge, type NamingStatusModifier } from './Badge';

export interface NamingStatusBadgeProps {
  status?: NamingOpportunityStatus;
  statusModifier?: NamingStatusModifier;
  label?: string;
  uppercase?: boolean;
  className?: string;
}

export function NamingStatusBadge({
  status,
  statusModifier: statusModifierProp,
  label: labelProp,
  uppercase = true,
  className = '',
}: NamingStatusBadgeProps) {
  const config =
    status !== undefined ? namingOpportunityStatusConfig(status) : undefined;
  const statusModifier = (config?.cssModifier ?? statusModifierProp) as
    | NamingStatusModifier
    | undefined;
  const label = labelProp ?? config?.label;

  if (!statusModifier || !label) return null;

  return (
    <Badge
      variant='fill'
      size='sm'
      statusModifier={statusModifier}
      uppercase={uppercase}
      className={className}
    >
      {label}
    </Badge>
  );
}
