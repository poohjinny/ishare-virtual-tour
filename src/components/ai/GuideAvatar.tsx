import { cn } from '../../lib/cn';
import { guideAvatarMarkClassName } from './aiAssistantVariants';

interface GuideAvatarProps {
  className?: string;
}

export function GuideAvatar({ className }: GuideAvatarProps) {
  return (
    <span
      className={cn(guideAvatarMarkClassName, className)}
      aria-hidden='true'
    />
  );
}
