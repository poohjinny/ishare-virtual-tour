import { PopupCtaArrowIcon } from './popupContentUi';
import { tourNavSceneDetailFooterClassName } from './tourNavFloatVariants';

interface ExploreDetailVisitFooterProps {
  label: string;
  disabled?: boolean;
  onVisit: () => void;
}

/** Glass panel footer shell; Visit CTA is content-width. */
export function ExploreDetailVisitFooter({
  label,
  disabled = false,
  onVisit,
}: ExploreDetailVisitFooterProps) {
  return (
    <footer className={tourNavSceneDetailFooterClassName}>
      <div className='tour-glass-panel__cta-wrap'>
        <button
          type='button'
          className='tour-glass-panel__cta'
          data-visit-scene=''
          disabled={disabled}
          aria-label={label}
          onClick={onVisit}
        >
          <span className='tour-glass-panel__cta-text' data-cta-label={label}>
            {label}
          </span>
          <PopupCtaArrowIcon />
        </button>
      </div>
    </footer>
  );
}
