import { Badge } from '../ui/Badge';

interface LocationBadgeProps {
  title: string;
}

export function LocationBadge({ title }: LocationBadgeProps) {
  return (
    <Badge
      variant='outline'
      tone='muted'
      dot
      className='ai-panel__location-badge ishare-badge--dot-primary'
      aria-label={`Current location: ${title}`}
    >
      {`You're on ${title}`}
    </Badge>
  );
}
