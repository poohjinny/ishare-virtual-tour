import { VIRTUAL_TOUR_GUIDE_CTA } from '../constants/branding';
import { PopupCtaArrowIcon } from './popupContentUi';
import { tourNavSceneDetailFooterClassName } from './tourNavFloatVariants';
import { popupCtaSizeClassName } from '../utils/popupCtaLayout';

interface ExploreDetailVisitFooterProps {
  label: string;
  disabled?: boolean;
  onVisit: () => void;
  /** Secondary Ask Guide CTA — only when Ask Guide is enabled. */
  askLabel?: string;
  onAsk?: () => void;
}

/** Glass panel footer shell — Visit uses shared wide/full CTA sizes. */
export function ExploreDetailVisitFooter({
  label,
  disabled = false,
  onVisit,
  askLabel = VIRTUAL_TOUR_GUIDE_CTA,
  onAsk,
}: ExploreDetailVisitFooterProps) {
  const showAsk = typeof onAsk === 'function';

  return (
    <footer className={tourNavSceneDetailFooterClassName}>
      <div
        className={
          showAsk ?
            'tour-glass-panel__cta-wrap tour-glass-panel__cta-row'
          : 'tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--full'
        }
      >
        {showAsk ?
          <button
            type='button'
            className={`tour-glass-panel__cta tour-glass-panel__cta--secondary ${popupCtaSizeClassName('default')}`}
            disabled={disabled}
            aria-label={askLabel}
            onClick={onAsk}
          >
            <span
              className='tour-glass-panel__cta-text'
              data-cta-label={askLabel}
            >
              {askLabel}
            </span>
          </button>
        : null}
        <button
          type='button'
          className={`tour-glass-panel__cta ${popupCtaSizeClassName(showAsk ? 'full' : 'wide')}`}
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
