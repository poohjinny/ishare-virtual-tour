import { useCallback, useEffect, useRef, useState } from 'react';
import type { PopupContent, Tour } from '../types/tour';
import {
  PopupBodyCopy,
  PopupCtasBlock,
  PopupHeaderMeta,
  NamingOpportunityPrice,
  PopupVideoEmbed,
} from './popupContentUi';
import { resolvePopupContentCtas } from '../data/namingOpportunityStatus';
import { resolveGlassPanelWidth } from './tourGlassPanelHtml';
import { GlassPanelCloseIcon } from './TourGlassPanel';
import './TourGlassPanel.css';
import './InfoPopup.css';

const POPUP_EXIT_MS = 280;

interface InfoPopupProps {
  popup: PopupContent | null;
  tour: Tour;
  onClose: () => void;
}

export function InfoPopup({ popup, tour, onClose }: InfoPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState<PopupContent | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const shownRef = useRef<PopupContent | null>(null);

  shownRef.current = shown;

  useEffect(() => {
    if (popup) {
      setShown(popup);
      setIsExiting(false);
      return;
    }

    if (!shownRef.current) return;

    setIsExiting(true);
    const timer = window.setTimeout(() => {
      setShown(null);
      setIsExiting(false);
    }, POPUP_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [popup]);

  useEffect(() => {
    if (!shown || isExiting) return;

    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [shown, isExiting, onClose]);

  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    onClose();
  }, [isExiting, onClose]);

  if (!shown) return null;

  const resolvedCtas = resolvePopupContentCtas(shown, tour);

  return (
    <div
      className={`info-popup-backdrop${isExiting ? ' info-popup-backdrop--exit' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <article
        className={`info-popup tour-glass-panel tour-glass-panel--dock tour-glass-panel--modal${isExiting ? ' info-popup--exit' : ''}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='info-popup-title'
        style={{ maxWidth: resolveGlassPanelWidth(shown, tour) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='tour-glass-panel__shell'>
          <header className='tour-glass-panel__header'>
            <div className='tour-glass-panel__title-row info-popup__title-row'>
              <div className='tour-glass-panel__title-block'>
                <div className='tour-glass-panel__title-line'>
                  <h2
                    id='info-popup-title'
                    className='tour-glass-panel__title info-popup__title'
                  >
                    {shown.title}
                  </h2>
                  {shown.namingOpportunity && (
                    <NamingOpportunityPrice
                      opportunity={shown.namingOpportunity}
                    />
                  )}
                </div>
                {shown.namingOpportunity?.priceLabel && (
                  <p className='tour-glass-panel__price-label'>
                    {shown.namingOpportunity.priceLabel}
                  </p>
                )}
              </div>
              <button
                ref={closeRef}
                type='button'
                className='tour-glass-panel__close'
                onClick={handleDismiss}
                aria-label='Close'
              >
                <GlassPanelCloseIcon />
              </button>
            </div>
            <PopupHeaderMeta popup={shown} />
          </header>

          <div className='tour-glass-panel__body ishare-scrollbar'>
            {shown.image && (
              <img src={shown.image} alt='' className='info-popup__image' />
            )}
            <PopupBodyCopy body={shown.body} />
            {shown.videoUrl && (
              <PopupVideoEmbed
                videoUrl={shown.videoUrl}
                title={shown.title}
                poster={shown.videoPoster}
              />
            )}
          </div>

          {resolvedCtas.length > 0 && <PopupCtasBlock ctas={resolvedCtas} />}
        </div>
      </article>
    </div>
  );
}
