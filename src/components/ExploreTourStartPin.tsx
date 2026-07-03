import { TOUR_DIRECTORY_TOUR_START_TOOLTIP } from '../constants/tourDirectory';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_16,
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolCompactClassName,
} from './ui/materialSymbolClasses';
import {
  tourNavDirectoryTourStartPinClassName,
  tourNavLocationGalleryTourStartPinClassName,
} from './tourNavFloatVariants';

interface ExploreTourStartPinProps {
  variant: 'list' | 'galleryHero';
}

export function ExploreTourStartPin({ variant }: ExploreTourStartPinProps) {
  const isGalleryHero = variant === 'galleryHero';
  return (
    <span
      className={
        isGalleryHero ?
          tourNavLocationGalleryTourStartPinClassName
        : tourNavDirectoryTourStartPinClassName
      }
      role='img'
      aria-label={TOUR_DIRECTORY_TOUR_START_TOOLTIP}
    >
      <MaterialSymbol
        name='push_pin'
        className={materialSymbolCompactClassName}
        sizePx={
          isGalleryHero ? MATERIAL_SYMBOL_SIZE_16 : MATERIAL_SYMBOL_SIZE_18
        }
      />
    </span>
  );
}
