import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { NamingOpportunity, PopupContent, PopupCta } from '../types/tour';
import {
  GIFTABULATOR_PRODUCT,
  resolvePopupCta,
} from '../data/giftabulatorBrand';
import { PlatformBrandLink } from './PlatformBrandLink';
import { cn } from '../lib/cn';
import { partitionPopupCtasForPlacement } from '../utils/popupCtaPlacement';
import { GENERAL_INFO_BADGE_LABEL } from '../data/generalInfoHotspot';
import {
  NAMING_OPPORTUNITY_BADGE_LABEL,
  namingOpportunityStatusConfig,
} from '../data/namingOpportunityStatus';
import {
  bindYoutubeIframeForegroundMedia,
  popupVideoSynthesiaEmbedUrl,
  popupVideoYoutubeEmbedUrl,
  resolvePopupVideo,
} from '../utils/popupVideo';
import {
  bindHtmlVideoForegroundMedia,
  claimTourMedia,
  releaseTourMedia,
} from '../utils/tourMediaCoordinator';
import {
  isNamingStatusIconModifier,
  NamingStatusBadgeIcon,
} from './namingStatusBadgeIcons';
import { BADGE_CLASS } from './ui/badgeClasses';
import type { NamingStatusModifier } from './ui/Badge';
import { formatNamingPriceDisplay } from '../utils/namingPrice';
import { applyCtaTextOverflowTitle } from '../utils/glassPanelCtaOverflow';
import { PopupCtaIcon } from './glassPanelCtaIcons';
import { resolvePopupCtaIconKind } from '../utils/popupCtaIcon';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolBadgeClassName,
} from './ui/materialSymbolClasses';

export function splitPopupBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const NAMING_BADGE_ICON = (
  <MaterialSymbol
    name='favorite'
    className={cn(BADGE_CLASS.icon, materialSymbolBadgeClassName)}
    sizePx={MATERIAL_SYMBOL_SIZE_18}
  />
);

function StatusBadgeIcon({ modifier }: { modifier: string }) {
  if (!isNamingStatusIconModifier(modifier)) return null;

  return <NamingStatusBadgeIcon modifier={modifier} />;
}

export function NamingOpportunityPrice({
  opportunity,
}: {
  opportunity: NamingOpportunity;
}) {
  const priceSold =
    namingOpportunityStatusConfig(opportunity.status).cssModifier === 'sold';

  return (
    <p
      className={
        priceSold ?
          'tour-glass-panel__price tour-glass-panel__price--under-title tour-glass-panel__price--sold'
        : 'tour-glass-panel__price tour-glass-panel__price--under-title'
      }
    >
      <span className='tour-glass-panel__price-sep' aria-hidden='true'>
        |
      </span>
      <span className='tour-glass-panel__price-value'>
        {formatNamingPriceDisplay(opportunity.price)}
      </span>
    </p>
  );
}

export function NamingOpportunityMeta({
  opportunity,
}: {
  opportunity: NamingOpportunity;
}) {
  const statusConfig = namingOpportunityStatusConfig(opportunity.status);

  return (
    <div className='tour-glass-panel__meta' aria-label={opportunity.name}>
      <div className='tour-glass-panel__meta-row'>
        <span className={BADGE_CLASS.fillLgPrimaryIcon}>
          {NAMING_BADGE_ICON}
          <span className={BADGE_CLASS.label}>
            {NAMING_OPPORTUNITY_BADGE_LABEL}
          </span>
        </span>
        <span
          className={BADGE_CLASS.fillLgStatusIcon(
            statusConfig.cssModifier as NamingStatusModifier,
          )}
        >
          <StatusBadgeIcon modifier={statusConfig.cssModifier} />
          <span className={BADGE_CLASS.label}>{statusConfig.label}</span>
        </span>
      </div>
    </div>
  );
}

export function PopupHeaderMeta({ popup }: { popup: PopupContent }) {
  if (popup.namingOpportunity) {
    return <NamingOpportunityMeta opportunity={popup.namingOpportunity} />;
  }

  if (popup.sponsor) {
    return (
      <span className={BADGE_CLASS.fillLgSponsor}>
        <span className={BADGE_CLASS.label}>
          {popup.sponsor.label ?? 'Presented by'} {popup.sponsor.name}
        </span>
      </span>
    );
  }

  return (
    <span className={BADGE_CLASS.fillLgAccentIcon}>
      <MaterialSymbol
        name='info'
        className={cn(BADGE_CLASS.icon, materialSymbolBadgeClassName)}
        sizePx={MATERIAL_SYMBOL_SIZE_18}
      />
      <span className={BADGE_CLASS.label}>{GENERAL_INFO_BADGE_LABEL}</span>
    </span>
  );
}

export function PopupBodyCopy({ body }: { body: string }) {
  const paragraphs = splitPopupBody(body);

  return (
    <div className='tour-glass-panel__copy'>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className='tour-glass-panel__paragraph'>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function PopupVideoPlayIcon() {
  return (
    <svg
      className='tour-glass-panel__video-play-icon'
      viewBox='0 0 56 56'
      fill='none'
      aria-hidden='true'
    >
      <circle
        className='tour-glass-panel__video-play-ring'
        cx='28'
        cy='28'
        r='26'
        stroke='currentColor'
        strokeWidth='2.5'
        fill='transparent'
      />
      <path
        className='tour-glass-panel__video-play-glyph'
        d='M23 18.5v19l14-9.5-14-9.5z'
        fill='currentColor'
      />
    </svg>
  );
}

export function PopupVideoEmbed({
  videoUrl,
  title,
  poster,
}: {
  videoUrl: string;
  title: string;
  poster?: string;
}) {
  const resolved = resolvePopupVideo(videoUrl, poster);
  const [playing, setPlaying] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(() => !resolved?.thumbnailUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const thumbRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!resolved?.thumbnailUrl) {
      setThumbLoaded(true);
      return;
    }

    const img = thumbRef.current;
    if (img?.complete && img.src) {
      setThumbLoaded(true);
      return;
    }

    setThumbLoaded(false);
  }, [resolved?.thumbnailUrl, videoUrl, poster]);

  useLayoutEffect(() => {
    if (!playing || !resolved) return;

    const mediaId = `info-popup-video:${resolved.kind}:${resolved.sourceUrl}`;

    if (resolved.kind === 'youtube') {
      const iframe = iframeRef.current;
      if (!iframe) return;
      return bindYoutubeIframeForegroundMedia(iframe, mediaId);
    }

    if (resolved.kind === 'embed') {
      claimTourMedia(mediaId);
      return () => releaseTourMedia(mediaId);
    }

    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    void video.play().catch(() => undefined);
    return bindHtmlVideoForegroundMedia(video, mediaId);
  }, [playing, resolved]);

  if (!resolved) return null;

  if (playing) {
    return (
      <div className='tour-glass-panel__video tour-glass-panel__video--playing'>
        {resolved.kind === 'youtube' ?
          <iframe
            ref={iframeRef}
            src={popupVideoYoutubeEmbedUrl(resolved.sourceUrl)}
            title={`${title} video`}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
            referrerPolicy='strict-origin-when-cross-origin'
          />
        : resolved.kind === 'embed' ?
          <iframe
            ref={iframeRef}
            src={popupVideoSynthesiaEmbedUrl(resolved.sourceUrl)}
            title={`${title} video`}
            allow='autoplay; fullscreen; encrypted-media; picture-in-picture'
            allowFullScreen
            referrerPolicy='strict-origin-when-cross-origin'
          />
        : <video
            ref={videoRef}
            src={resolved.sourceUrl}
            title={`${title} video`}
            controls
            playsInline
            autoPlay
          />
        }
      </div>
    );
  }

  return (
    <div
      className={cn(
        'tour-glass-panel__video tour-glass-panel__video--preview',
        thumbLoaded ?
          'tour-glass-panel__video--thumb-loaded'
        : 'tour-glass-panel__video--thumb-loading',
      )}
    >
      <div
        className='preview-hero-skeleton tour-glass-panel__video-skeleton'
        aria-hidden='true'
      />
      {resolved.thumbnailUrl ?
        <img
          ref={thumbRef}
          className='tour-glass-panel__video-thumb'
          src={resolved.thumbnailUrl}
          alt=''
          onLoad={() => setThumbLoaded(true)}
          onError={() => setThumbLoaded(true)}
        />
      : null}
      <button
        type='button'
        className='tour-glass-panel__video-play'
        aria-label={`Play video: ${title}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          flushSync(() => setPlaying(true));
        }}
      >
        <PopupVideoPlayIcon />
      </button>
    </div>
  );
}

export function PopupCtaArrowIcon() {
  return <PopupCtaIcon kind='arrow' />;
}

export function PopupCtaLabel({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);

  if (resolved.kind === 'giftabulator' && !cta.label) {
    return (
      <>
        {GIFTABULATOR_PRODUCT.ctaButtonLabelPrefix}
        <PlatformBrandLink brandId='giftabulator' link={false} />
      </>
    );
  }

  return <>{resolved.label}</>;
}

function GlassPanelCtaText({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const syncOverflowTitle = useCallback(() => {
    if (ref.current) {
      applyCtaTextOverflowTitle(ref.current);
    }
  }, []);

  useLayoutEffect(() => {
    syncOverflowTitle();

    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(syncOverflowTitle);
    resizeObserver.observe(element);

    const footer = element.closest('.tour-glass-panel__footer');
    if (footer instanceof HTMLElement) {
      resizeObserver.observe(footer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [label, syncOverflowTitle]);

  return (
    <span
      ref={ref}
      className='tour-glass-panel__cta-text'
      data-cta-label={label}
    >
      {children ?? label}
    </span>
  );
}

export function PopupCtaButton({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);
  const isSecondary = cta.variant === 'secondary';

  return (
    <a
      className={`tour-glass-panel__cta${isSecondary ? ' tour-glass-panel__cta--secondary' : ''}`}
      href={resolved.url}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={resolved.ariaLabel}
    >
      <GlassPanelCtaText label={resolved.label}>
        <PopupCtaLabel cta={cta} />
      </GlassPanelCtaText>
      {!isSecondary && <PopupCtaIcon kind={resolvePopupCtaIconKind(cta)} />}
    </a>
  );
}

export function PopupPrimaryCtaFooter({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);
  const sublabel =
    cta.sublabel ??
    (resolved.kind === 'custom' ? resolved.sublabel : undefined);

  return (
    <footer className='tour-glass-panel__footer'>
      <div className='tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--full'>
        <PopupCtaButton cta={{ ...cta, variant: 'primary' }} />
        {sublabel && (
          <p className='tour-glass-panel__cta-sublabel'>{sublabel}</p>
        )}
      </div>
    </footer>
  );
}

export function PopupCtasContent({ ctas }: { ctas: PopupCta[] }) {
  const { primary } = partitionPopupCtasForPlacement(ctas);
  if (!primary) return null;

  return (
    <div className='tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--full'>
      <PopupCtaButton cta={{ ...primary, variant: 'primary' }} />
    </div>
  );
}

export function PopupCtasBlock({ ctas }: { ctas: PopupCta[] }) {
  const { primary } = partitionPopupCtasForPlacement(ctas);
  if (!primary) return null;

  return <PopupPrimaryCtaFooter cta={primary} />;
}

export function PopupCtaBlock({ cta }: { cta: PopupCta }) {
  return <PopupCtasBlock ctas={[cta]} />;
}
