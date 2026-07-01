import { GUIDE_PANEL_CURRENT_SCENE_LABEL } from '../../constants/branding';
import {
  aiPanelLocationBadgeClassName,
  aiPanelLocationBadgeLabelClassName,
  aiPanelLocationBadgeSeparatorClassName,
  aiPanelLocationBadgeTitleClassName,
  aiPanelLocationDotClassName,
} from './aiAssistantVariants';

interface LocationBadgeProps {
  title: string;
}

export function LocationBadge({ title }: LocationBadgeProps) {
  return (
    <p
      className={aiPanelLocationBadgeClassName}
      aria-label={`${GUIDE_PANEL_CURRENT_SCENE_LABEL}: ${title}`}
    >
      <span className={aiPanelLocationDotClassName} aria-hidden='true' />
      <span className={aiPanelLocationBadgeLabelClassName}>
        {GUIDE_PANEL_CURRENT_SCENE_LABEL}
      </span>
      <span
        className={aiPanelLocationBadgeSeparatorClassName}
        aria-hidden='true'
      >
        ·
      </span>
      <span className={aiPanelLocationBadgeTitleClassName}>{title}</span>
    </p>
  );
}
