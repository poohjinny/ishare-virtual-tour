import { IconTooltip } from './ui/IconTooltip';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  EXPLORE_GALLERY_LOCATION_DETAILS_LABEL,
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
  /** Gallery cards: `galleryHeroText` secondary pill below description; `listText` row pill on hover. */
  variant?: 'gallery' | 'galleryHero' | 'galleryHeroText' | 'list' | 'listText';
}

export function ExploreSceneInfoButton({
  sceneTitle,
  disabled = false,
  onShow,
  variant = 'gallery',
}: ExploreSceneInfoButtonProps) {
  const label = tourDirectorySceneInfoAriaLabel(sceneTitle);
  const isGalleryHeroChip = variant === 'galleryHero';
  const isGalleryHeroText = variant === 'galleryHeroText';
  const isListText = variant === 'listText';
  const isTextButton = isGalleryHeroText || isListText;

  const button = (
    <button
      type='button'
      className={tourNavSceneInfoButtonClassName({
        variant:
          isListText ? 'listText'
          : isGalleryHeroText ? 'galleryHeroText'
          : isGalleryHeroChip ? 'galleryHero'
          : variant,
      })}
      disabled={disabled}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onShow();
      }}
    >
      {isTextButton ?
        <span>{EXPLORE_GALLERY_LOCATION_DETAILS_LABEL}</span>
      : <MaterialSymbol
          name={isGalleryHeroChip ? 'info_i' : 'info'}
          className={cn(
            materialSymbolCompactClassName,
            isGalleryHeroChip && tourNavGalleryHeroInfoIconClassName,
          )}
          sizePx={
            isGalleryHeroChip ? MATERIAL_SYMBOL_SIZE_16
            : variant === 'list' ?
              MATERIAL_SYMBOL_SIZE_22
            : MATERIAL_SYMBOL_SIZE_18
          }
        />
      }
    </button>
  );

  if (isTextButton) {
    return button;
  }

  return (
    <IconTooltip
      label={TOUR_DIRECTORY_SCENE_INFO_TOOLTIP}
      placement={isGalleryHeroChip || variant === 'gallery' ? 'top' : 'left'}
    >
      {button}
    </IconTooltip>
  );
}
