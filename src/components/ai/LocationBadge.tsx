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
      aria-label={`Current location: ${title}`}
    >
      {`You're on ${title}`}
    </Badge>
  );
}
