import {
  aiPanelLocationBadgeClassName,
  aiPanelLocationBadgeTitleClassName,
} from './aiAssistantVariants';

interface LocationBadgeProps {
  /** Facility / tour title — distinct from the breadcrumb scene path. */
  title: string;
}

export function LocationBadge({ title }: LocationBadgeProps) {
  return (
    <p className={aiPanelLocationBadgeClassName} aria-label={title}>
      <span className={aiPanelLocationBadgeTitleClassName}>{title}</span>
    </p>
  );
}
