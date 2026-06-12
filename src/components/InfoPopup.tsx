import { useCallback, useEffect, useRef, useState } from 'react';
import type { PopupContent } from '../types/tour';
import {
  PopupBodyCopy,
  PopupCtaBlock,
  PopupHeaderMeta,
  PopupVideoEmbed,
} from './popupContentUi';
import { namingOpportunityCtaEnabled } from '../data/namingOpportunityStatus';
import { resolveGlassPanelWidth } from './tourGlassPanelHtml';
import './TourGlassPanel.css';
import './InfoPopup.css';

const POPUP_EXIT_MS = 280;

interface InfoPopupProps {
  popup: PopupContent | null;
  onClose: () => void;
}

export function InfoPopup({ popup, onClose }: InfoPopupProps) {
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

  return (
    <div
      className={`info-popup-backdrop${isExiting ? ' info-popup-backdrop--exit' : ''}`}
      role='dialog'
      aria-modal='true'
      aria-labelledby='info-popup-title'
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={`info-popup${isExiting ? ' info-popup--exit' : ''}`}
        style={{ maxWidth: resolveGlassPanelWidth(shown) }}
      >
        <div className='info-popup__header'>
          <div className='info-popup__title-row'>
            <h2 id='info-popup-title' className='info-popup__title'>
              {shown.title}
            </h2>
            <button
              ref={closeRef}
              type='button'
              className='info-popup__close'
              onClick={handleDismiss}
              aria-label='Close'
            >
              <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                <path
                  d='M6 6l12 12M18 6L6 18'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
          </div>
          <PopupHeaderMeta popup={shown} />
        </div>

        <div className='info-popup__scroll ishare-scrollbar'>
          {shown.image && (
            <img src={shown.image} alt='' className='info-popup__image' />
          )}
          <PopupBodyCopy body={shown.body} />
          {shown.videoUrl && (
            <PopupVideoEmbed videoUrl={shown.videoUrl} title={shown.title} />
          )}
        </div>

        {shown.cta &&
          (!shown.namingOpportunity ||
            namingOpportunityCtaEnabled(shown.namingOpportunity.status)) && (
            <PopupCtaBlock cta={shown.cta} />
          )}
      </div>
    </div>
  );
}
