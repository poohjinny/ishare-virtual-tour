import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  TOUR_DIRECTORY_SCENE_INFO_TOOLTIP,
  tourDirectorySceneInfoAriaLabel,
} from '../constants/tourDirectory';
import { cn } from '../lib/cn';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_18,
  MATERIAL_SYMBOL_SIZE_22,
  materialSymbolCompactClassName,
} from './ui/materialSymbolClasses';
import {
  tourNavGalleryHeroInfoIconClassName,
  tourNavSceneInfoButtonClassName,
} from './tourNavFloatVariants';

interface ExploreSceneInfoButtonProps {
  sceneTitle: string;
  disabled?: boolean;
  onShow: () => void;
  /** Gallery cards: `galleryHero` on hero overlay chip; `list` on directory rows. */
  variant?: 'gallery' | 'galleryHero' | 'list';
}

export function ExploreSceneInfoButton({
  sceneTitle,
  disabled = false,
  onShow,
  variant = 'gallery',
}: ExploreSceneInfoButtonProps) {
  const label = tourDirectorySceneInfoAriaLabel(sceneTitle);
  const isGalleryHero = variant === 'galleryHero';

  return (
    <IconTooltip
      label={TOUR_DIRECTORY_SCENE_INFO_TOOLTIP}
      placement={isGalleryHero || variant === 'gallery' ? 'top' : 'left'}
    >
      <button
        type='button'
        className={tourNavSceneInfoButtonClassName({
          variant: isGalleryHero ? 'galleryHero' : variant,
        })}
        disabled={disabled}
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onShow();
        }}
      >
        <MaterialSymbol
          name={isGalleryHero ? 'info_i' : 'info'}
          className={cn(
            materialSymbolCompactClassName,
            isGalleryHero && tourNavGalleryHeroInfoIconClassName,
          )}
          sizePx={
            isGalleryHero ? MATERIAL_SYMBOL_SIZE_16
            : variant === 'list' ?
              MATERIAL_SYMBOL_SIZE_22
            : MATERIAL_SYMBOL_SIZE_18
          }
        />
      </button>
    </IconTooltip>
  );
}
