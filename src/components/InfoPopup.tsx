import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PopupContent, Tour } from '../types/tour';
import {
  PopupBodyCopy,
  PopupHeaderMeta,
  NamingOpportunityPrice,
  PopupPrimaryCtaFooter,
  PopupVideoEmbed,
} from './popupContentUi';
import {
  resolvePopupContentCtas,
  stripNamingOpportunitySuffix,
} from '../data/namingOpportunityStatus';
import { TOUR_SHARE_OPPORTUNITY_ARIA } from '../constants/tourShare';
import {
  buildAbsoluteShareUrl,
  buildShareMessage,
} from '../utils/buildShareUrl';
import { partitionPopupCtasForPlacement } from '../utils/popupCtaPlacement';
import { GlassPanelHeaderActions } from './GlassPanelHeaderActions';
import { resolveGlassPanelWidth } from './tourGlassPanelHtml';
import { GlassPanelCloseIcon } from './TourGlassPanel';
import './TourGlassPanel.css';
import './InfoPopup.css';

const POPUP_EXIT_MS = 280;

interface InfoPopupProps {
  popup: PopupContent | null;
  tour: Tour;
  tourTitle: string;
  sceneId: string;
  namingHotspotId?: string | null;
  onClose: () => void;
}

export function InfoPopup({
  popup,
  tour,
  tourTitle,
  sceneId,
  namingHotspotId = null,
  onClose,
}: InfoPopupProps) {
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

  const resolvedCtas = useMemo(
    () => (shown ? resolvePopupContentCtas(shown, tour) : []),
    [shown, tour],
  );

  const { primary: footerPrimary, headerCtas } = useMemo(
    () => partitionPopupCtasForPlacement(resolvedCtas),
    [resolvedCtas],
  );

  const sceneTitle = tour.scenes[sceneId]?.title ?? sceneId;
  const namingName =
    shown?.namingOpportunity ?
      stripNamingOpportunitySuffix(shown.namingOpportunity.name)
    : null;

  const shareUrl = useMemo(
    () =>
      buildAbsoluteShareUrl({
        tourId: tour.id,
        sceneId,
        firstSceneId: tour.firstScene,
        namingHotspotId:
          shown?.namingOpportunity && namingHotspotId ? namingHotspotId : null,
      }),
    [
      namingHotspotId,
      sceneId,
      shown?.namingOpportunity,
      tour.firstScene,
      tour.id,
    ],
  );

  const shareMessage = useMemo(
    () => buildShareMessage(tourTitle, sceneTitle, namingName),
    [namingName, sceneTitle, tourTitle],
  );

  if (!shown) return null;

  const showNamingShare =
    Boolean(shown.namingOpportunity) && Boolean(namingHotspotId);

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
              <div className='tour-glass-panel__header-leading'>
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
              </div>
              <div className='tour-glass-panel__title-actions'>
                <GlassPanelHeaderActions
                  headerCtas={headerCtas}
                  share={
                    showNamingShare ?
                      {
                        shareUrl,
                        message: shareMessage,
                        ariaLabel: TOUR_SHARE_OPPORTUNITY_ARIA,
                      }
                    : undefined
                  }
                />
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

          {footerPrimary && <PopupPrimaryCtaFooter cta={footerPrimary} />}
        </div>
      </article>
    </div>
  );
}
