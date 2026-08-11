import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PopupContent, Tour } from '../types/tour';
import {
  PopupBodyCopy,
  PopupCtaArrowIcon,
  PopupHeaderMeta,
  NamingOpportunityPrice,
  NamingDonorCreditBlock,
  PopupCtasFooter,
  PopupVideoEmbed,
} from './popupContentUi';
import {
  resolvePopupContentCtas,
  stripNamingOpportunitySuffix,
} from '../data/namingOpportunityStatus';
import { popupCtaSizeClassName } from '../utils/popupCtaLayout';
import {
  TOUR_SHARE_OPPORTUNITY_ARIA,
  TOUR_SHARE_OPPORTUNITY_LABEL,
} from '../constants/tourShare';
import {
  buildAbsoluteShareUrl,
  buildShareMessage,
} from '../utils/buildShareUrl';
import { resolveShareDescription } from '../utils/tourOpenGraph';
import { formatNamingGalleryItemPrice } from '../utils/namingPrice';
import {
  resolveGlassPanelWidth,
  resolveNavPreviewHeroHeight,
} from './tourGlassPanelHtml';
import { GlassPanelHeaderActions } from './GlassPanelHeaderActions';
import { GlassPanelCloseIcon } from './TourGlassPanel';
import { MATERIAL_SYMBOL_SIZE_CHROME_HEADER } from './ui/materialSymbolClasses';
import {
  infoPopupBackdropVariants,
  infoPopupImageClassName,
  infoPopupPanelVariants,
  infoPopupPriceLabelClassName,
  infoPopupTitleBlockClassName,
  infoPopupTitleClassName,
  infoPopupTitleLineClassName,
} from './infoPopupVariants';
import { cn } from '../lib/cn';
import { ANCHORED_PANEL } from './anchoredPanelChrome';
import {
  AnchoredPanelHeroActions,
  AnchoredPanelShell,
} from './AnchoredPanelShell';

const POPUP_EXIT_MS = 280;

interface InfoPopupProps {
  popup: PopupContent | null;
  tour: Tour;
  sceneId: string;
  namingHotspotId?: string | null;
  embed?: boolean;
  onClose: () => void;
  onVisitScene?: (sceneId: string) => void;
  /** Desktop naming share — open in-app Share panel instead of OS sheet. */
  onOpenSharePanel?: () => void;
}

export function InfoPopup({
  popup,
  tour,
  sceneId,
  namingHotspotId = null,
  embed = false,
  onClose,
  onVisitScene,
  onOpenSharePanel,
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
  }, [shown, isExiting]);

  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    onClose();
  }, [isExiting, onClose]);

  const resolvedCtas = useMemo(
    () => (shown ? resolvePopupContentCtas(shown, tour) : []),
    [shown, tour],
  );

  const visitSceneId = shown?.visitScene;
  const visitSceneTitle =
    visitSceneId ? (tour.scenes[visitSceneId]?.title ?? visitSceneId) : null;
  const visitCtaLabel = visitSceneTitle ? `Visit ${visitSceneTitle}` : null;
  const canVisitScene = Boolean(
    visitSceneId && visitCtaLabel && onVisitScene && visitSceneId !== sceneId,
  );

  const handleVisitScene = useCallback(() => {
    if (!visitSceneId || !onVisitScene) return;
    onClose();
    onVisitScene(visitSceneId);
  }, [visitSceneId, onVisitScene, onClose]);

  const hasFooterCtas = resolvedCtas.length > 0 || canVisitScene;

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

  const shareMessage = useMemo(() => {
    const naming = shown?.namingOpportunity;
    return buildShareMessage(
      tour.title,
      sceneTitle,
      namingName,
      resolveShareDescription({ tour, sceneId, namingHotspotId }),
      {
        priceLabel:
          naming ?
            formatNamingGalleryItemPrice({
              price: naming.price,
              priceLabel: naming.priceLabel,
            })
          : null,
        status: naming?.status ?? null,
      },
    );
  }, [namingHotspotId, namingName, sceneId, sceneTitle, shown, tour]);

  const panelWidth = useMemo(
    () => (shown ? resolveGlassPanelWidth(shown, tour) : undefined),
    [shown, tour],
  );

  if (!shown) return null;

  const showNamingShare =
    !embed && Boolean(shown.namingOpportunity) && Boolean(namingHotspotId);

  const hasVideo = Boolean(shown.videoUrl?.trim());
  const hasImage = Boolean(shown.image?.trim()) && !hasVideo;
  const hasHero = hasVideo || hasImage;
  // Catalog image + video heroes share 16:9 (same as in-viewer image chrome).
  const heroHeight =
    panelWidth != null && hasHero ?
      resolveNavPreviewHeroHeight(panelWidth, { video: true })
    : undefined;

  const shareActions =
    showNamingShare ?
      {
        shareUrl,
        message: shareMessage,
        ariaLabel: TOUR_SHARE_OPPORTUNITY_ARIA,
        tooltipLabel: TOUR_SHARE_OPPORTUNITY_LABEL,
        onOpenSharePanel,
      }
    : undefined;

  const chromeActions = (
    <>
      <GlassPanelHeaderActions share={shareActions} />
      <button
        ref={closeRef}
        type='button'
        className={hasHero ? ANCHORED_PANEL.close : 'tour-glass-panel__close'}
        onClick={handleDismiss}
        aria-label='Close'
      >
        <GlassPanelCloseIcon
          className={hasHero ? ANCHORED_PANEL.closeIcon : undefined}
          sizePx={MATERIAL_SYMBOL_SIZE_CHROME_HEADER}
        />
      </button>
    </>
  );

  const hero =
    hasVideo ?
      <div
        className={`${ANCHORED_PANEL.hero} ${ANCHORED_PANEL.heroVideo}`}
        style={heroHeight ? { height: heroHeight } : undefined}
      >
        <PopupVideoEmbed
          videoUrl={shown.videoUrl!}
          title={shown.title}
          poster={shown.videoPoster}
        />
        <AnchoredPanelHeroActions>{chromeActions}</AnchoredPanelHeroActions>
      </div>
    : hasImage ?
      <div
        className={`${ANCHORED_PANEL.hero} ${ANCHORED_PANEL.heroImage}`}
        style={heroHeight ? { height: heroHeight } : undefined}
      >
        <img
          src={shown.image}
          alt=''
          className={cn(
            ANCHORED_PANEL.heroImageEl,
            ANCHORED_PANEL.heroImageLoaded,
            infoPopupImageClassName,
          )}
        />
        <AnchoredPanelHeroActions>{chromeActions}</AnchoredPanelHeroActions>
      </div>
    : undefined;

  const intro = (
    <div className='info-panel__intro'>
      <div className={infoPopupTitleBlockClassName}>
        <div className={infoPopupTitleLineClassName}>
          <h2 id='info-popup-title' className={infoPopupTitleClassName}>
            {shown.title}
          </h2>
          {shown.namingOpportunity ?
            <div className='tour-glass-panel__title-line-trailing'>
              <PopupHeaderMeta popup={shown} />
              <NamingOpportunityPrice opportunity={shown.namingOpportunity} />
            </div>
          : null}
        </div>
        {shown.namingOpportunity?.priceLabel ?
          <p className={infoPopupPriceLabelClassName}>
            {shown.namingOpportunity.priceLabel}
          </p>
        : null}
      </div>
      {shown.namingOpportunity ?
        <NamingDonorCreditBlock opportunity={shown.namingOpportunity} />
      : null}
    </div>
  );

  const header =
    hasHero ? intro : (
      <div className='tour-glass-panel__title-row'>
        <div className='tour-glass-panel__header-leading'>{intro}</div>
        <div className='tour-glass-panel__title-actions'>{chromeActions}</div>
      </div>
    );

  const footer =
    hasFooterCtas ?
      <>
        {resolvedCtas.length > 0 && <PopupCtasFooter ctas={resolvedCtas} />}
        {canVisitScene && (
          <footer className='tour-glass-panel__footer'>
            <div className='tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--full'>
              <button
                type='button'
                className={`tour-glass-panel__cta ${popupCtaSizeClassName('wide')}`}
                data-visit-scene={visitSceneId}
                onClick={handleVisitScene}
                aria-label={visitCtaLabel!}
              >
                <span
                  className='tour-glass-panel__cta-text'
                  data-cta-label={visitCtaLabel!}
                >
                  {visitCtaLabel}
                </span>
                <PopupCtaArrowIcon />
              </button>
            </div>
          </footer>
        )}
      </>
    : undefined;

  return (
    <div
      className={infoPopupBackdropVariants({
        phase: isExiting ? 'exit' : 'idle',
      })}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <AnchoredPanelShell
        titleId='info-popup-title'
        className={infoPopupPanelVariants({
          phase: isExiting ? 'exit' : 'idle',
        })}
        shellClassName='info-popup__shell'
        bodyClassName='info-popup__body'
        aria-modal='true'
        dataAttrs={{
          'data-info-panel-naming':
            shown.namingOpportunity ? 'true' : undefined,
        }}
        style={
          panelWidth ? { width: panelWidth, maxWidth: panelWidth } : undefined
        }
        onClick={(e) => e.stopPropagation()}
        hero={hero}
        header={header}
        footer={footer}
      >
        <PopupBodyCopy body={shown.body} />
      </AnchoredPanelShell>
    </div>
  );
}
