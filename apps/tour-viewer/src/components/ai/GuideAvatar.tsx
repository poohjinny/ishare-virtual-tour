import { cn } from '../../lib/cn';
import {
  guideAvatarOrbLayerActiveClassName,
  guideAvatarOrbLayerClassName,
  guideAvatarOrbLayerInactiveClassName,
  guideAvatarRingLayerActiveClassName,
  guideAvatarRingLayerClassName,
  guideAvatarRingLayerInactiveClassName,
  guideAvatarRingSpecularActiveClassName,
  guideAvatarRingSpecularClassName,
  guideAvatarRingSpecularInactiveClassName,
  guideAvatarShellClassName,
} from './aiAssistantVariants';

export type GuideAvatarPresence = 'ring' | 'orb';

interface GuideAvatarProps {
  className?: string;
  /**
   * FAB idle uses `ring`; proximity bubble / panel header use `orb`.
   * Morphs between layers — not a hard asset swap.
   */
  presence?: GuideAvatarPresence;
}

export function GuideAvatar({ className, presence = 'orb' }: GuideAvatarProps) {
  const isOrb = presence === 'orb';

  return (
    <span
      className={cn(guideAvatarShellClassName, className)}
      data-presence={presence}
      aria-hidden='true'
    >
      <span
        className={cn(
          guideAvatarRingLayerClassName,
          isOrb ?
            guideAvatarRingLayerInactiveClassName
          : guideAvatarRingLayerActiveClassName,
        )}
      />
      <span
        className={cn(
          guideAvatarRingSpecularClassName,
          isOrb ?
            guideAvatarRingSpecularInactiveClassName
          : guideAvatarRingSpecularActiveClassName,
        )}
      />
      <span
        className={cn(
          guideAvatarOrbLayerClassName,
          isOrb ?
            guideAvatarOrbLayerActiveClassName
          : guideAvatarOrbLayerInactiveClassName,
        )}
      />
    </span>
  );
}
