import { Badge } from '../ui/Badge';
import { cn } from '../../lib/cn';
import { aiPanelLocationBadgeClassName } from './aiAssistantVariants';

interface LocationBadgeProps {
  title: string;
}

export function LocationBadge({ title }: LocationBadgeProps) {
  return (
    <Badge
      variant='outline'
      tone='muted'
      dot
      className={cn(aiPanelLocationBadgeClassName, 'ishare-badge--dot-primary')}
      aria-label={`Current location: ${title}`}
    >
      {`You're on ${title}`}
    </Badge>
  );
}
