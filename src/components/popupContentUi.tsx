import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { NamingOpportunity, PopupContent, PopupCta } from '../types/tour';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import { cn } from '../lib/cn';
import {
  partitionPopupCtasForPlacement,
  isMailtoCtaUrl,
  openCtaUrl,
} from '../utils/popupCtaPlacement';
import {
  popupCtaRowClassName,
  popupCtaSizeClassName,
  popupCtaWrapClassName,
  resolvePopupCtaSizeLayout,
  resolvePopupFooterLayout,
  type PopupCtaSizeLayout,
} from '../utils/popupCtaLayout';
import { GENERAL_INFO_BADGE_LABEL } from '../data/generalInfoHotspot';
import {
  namingOpportunityStatusConfig,
  namingOpportunityStatusShowsBadge,
} from '../data/namingOpportunityStatus';
import {
  bindYoutubeIframeForegroundMedia,
  isPopupVideoShellFullscreen,
  isYoutubePausedOrEnded,
  popupVideoSynthesiaEmbedUrl,
  popupVideoYoutubeEmbedUrl,
  postYoutubePlayerCommand,
  resolvePopupVideo,
  togglePopupVideoFullscreen,
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
import {
  NAMING_DONOR_CREDIT_PREFIX,
  resolveNamingDonorPresentation,
} from '../utils/namingDonor';
import { applyCtaTextOverflowTitle } from '../utils/glassPanelCtaOverflow';
import { PopupCtaIcon } from './glassPanelCtaIcons';
import {
  resolvePopupCtaIconKind,
  shouldShowPopupCtaIcon,
} from '../utils/popupCtaIcon';
import { MaterialSymbol } from './ui/MaterialSymbol';
import {
  MATERIAL_SYMBOL_SIZE_18,
  materialSymbolBadgeClassName,
} from './ui/materialSymbolClasses';
import {
  renderInlineMarkdown,
  splitMarkdownParagraphs,
} from '../utils/inlineMarkdown';

export function splitPopupBody(body: string): string[] {
  return splitMarkdownParagraphs(body);
}

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
      <span className='tour-glass-panel__price-value'>
        {formatNamingPriceDisplay(opportunity.price)}
      </span>
    </p>
  );
}

export function NamingDonorCreditBlock({
  opportunity,
}: {
  opportunity?: NamingOpportunity | null;
}) {
  const donor = resolveNamingDonorPresentation(opportunity);
  if (!donor) return null;

  const creditBody =
    donor.kind === 'organization' && donor.website ?
      <>
        {NAMING_DONOR_CREDIT_PREFIX}{' '}
        <a
          className='tour-glass-panel__donor-credit-link'
          href={donor.website}
          target='_blank'
          rel='noopener noreferrer'
        >
          {donor.name}
        </a>
      </>
    : donor.kind === 'person' && donor.affiliation ?
      <>
        {NAMING_DONOR_CREDIT_PREFIX} {donor.name},{' '}
        {donor.website ?
          <a
            className='tour-glass-panel__donor-credit-link'
            href={donor.website}
            target='_blank'
            rel='noopener noreferrer'
          >
            {donor.affiliation}
          </a>
        : donor.affiliation}
      </>
    : donor.credit;

  return (
    <div className='tour-glass-panel__donor'>
      {donor.logo ?
        <img
          className='tour-glass-panel__donor-logo'
          src={donor.logo}
          alt=''
          decoding='async'
        />
      : null}
      <p className='tour-glass-panel__donor-credit'>{creditBody}</p>
    </div>
  );
}

export function NamingOpportunityMeta({
  opportunity,
}: {
  opportunity: NamingOpportunity;
}) {
  const statusConfig = namingOpportunityStatusConfig(opportunity.status);
  const showStatusBadge = namingOpportunityStatusShowsBadge(opportunity.status);
  if (!showStatusBadge) return null;

  return (
    <div className='tour-glass-panel__meta' aria-label={opportunity.name}>
      <div className='tour-glass-panel__meta-row'>
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
          {renderInlineMarkdown(paragraph, `body-${index}`)}
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

function PopupVideoPauseIcon() {
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
        d='M20 18h6v20h-6V18zm10 0h6v20h-6V18z'
        fill='currentColor'
      />
    </svg>
  );
}

function PopupVideoFullscreenEnterIcon() {
  return (
    <svg
      className='tour-glass-panel__video-fs-icon'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function PopupVideoFullscreenExitIcon() {
  return (
    <svg
      className='tour-glass-panel__video-fs-icon'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
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
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(() => !resolved?.thumbnailUrl);
  const shellRef = useRef<HTMLDivElement>(null);
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
      setPaused(false);
      return bindYoutubeIframeForegroundMedia(iframe, mediaId, (state) => {
        setPaused(isYoutubePausedOrEnded(state));
      });
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

  useLayoutEffect(() => {
    if (!playing || resolved?.kind !== 'youtube') return;
    const shell = shellRef.current;
    if (!shell) return;

    const onFullscreenChange = () => {
      setFullscreen(isPopupVideoShellFullscreen(shell));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [playing, resolved?.kind]);

  if (!resolved) return null;

  if (playing) {
    return (
      <div
        ref={shellRef}
        className={cn(
          'tour-glass-panel__video tour-glass-panel__video--playing',
          resolved.kind === 'youtube' &&
            paused &&
            'tour-glass-panel__video--paused',
        )}
      >
        {resolved.kind === 'youtube' ?
          <>
            <iframe
              ref={iframeRef}
              src={popupVideoYoutubeEmbedUrl(resolved.sourceUrl)}
              title={`${title} video`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              referrerPolicy='strict-origin-when-cross-origin'
            />
            <div className='tour-glass-panel__video-controls'>
              <button
                type='button'
                className='tour-glass-panel__video-toggle'
                aria-label={paused ? 'Play' : 'Pause'}
                data-paused={paused ? 'true' : 'false'}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const iframe = iframeRef.current;
                  if (!iframe) return;
                  postYoutubePlayerCommand(
                    iframe,
                    paused ? 'playVideo' : 'pauseVideo',
                  );
                }}
              >
                {paused ?
                  <PopupVideoPlayIcon />
                : <PopupVideoPauseIcon />}
              </button>
              <button
                type='button'
                className='tour-glass-panel__video-fullscreen'
                aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
                data-active={fullscreen ? 'true' : 'false'}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const shell = shellRef.current;
                  if (!shell) return;
                  togglePopupVideoFullscreen(shell);
                }}
              >
                {fullscreen ?
                  <PopupVideoFullscreenExitIcon />
                : <PopupVideoFullscreenEnterIcon />}
              </button>
            </div>
          </>
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
  return <>{resolvePopupCta(cta).label}</>;
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

export function PopupCtaButton({
  cta,
  sizeLayout,
}: {
  cta: PopupCta;
  /** Shared glass CTA size — full | wide | default. */
  sizeLayout?: PopupCtaSizeLayout;
}) {
  const resolved = resolvePopupCta(cta);
  const isSecondary = cta.variant === 'secondary';
  const showIcon = shouldShowPopupCtaIcon(cta, isSecondary);
  const isMailto = isMailtoCtaUrl(resolved.url);
  const layout = sizeLayout ?? (showIcon ? 'full' : 'default');

  return (
    <a
      className={cn(
        'tour-glass-panel__cta',
        isSecondary && 'tour-glass-panel__cta--secondary',
        popupCtaSizeClassName(layout),
      )}
      href={resolved.url}
      {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      aria-label={resolved.ariaLabel}
      onClick={(event) => {
        if (!isMailto) return;
        event.preventDefault();
        openCtaUrl(resolved.url);
      }}
    >
      <GlassPanelCtaText label={resolved.label}>
        <PopupCtaLabel cta={cta} />
      </GlassPanelCtaText>
      {showIcon ?
        <PopupCtaIcon kind={resolvePopupCtaIconKind(cta)} />
      : null}
    </a>
  );
}

export function PopupCtasFooter({ ctas }: { ctas: PopupCta[] }) {
  const layout = resolvePopupFooterLayout(ctas);
  if (!layout) return null;

  const { mode, primary, secondaries } = layout;
  const primaryShowIcon = shouldShowPopupCtaIcon(
    { ...primary, variant: 'primary' },
    false,
  );
  const primarySize = resolvePopupCtaSizeLayout(mode, {
    hasIcon: primaryShowIcon,
  });
  const primaryButton = (
    <PopupCtaButton
      cta={{ ...primary, variant: 'primary' }}
      sizeLayout={primarySize}
    />
  );

  if (secondaries.length === 0) {
    return (
      <footer className='tour-glass-panel__footer'>
        <div className={popupCtaWrapClassName('full')}>{primaryButton}</div>
      </footer>
    );
  }

  const secondaryButtons = secondaries.map((cta, index) => {
    const secondary = { ...cta, variant: 'secondary' as const };
    const showIcon = shouldShowPopupCtaIcon(secondary, true);
    return (
      <PopupCtaButton
        key={`${cta.url}-${cta.label ?? cta.product ?? index}`}
        cta={secondary}
        sizeLayout={resolvePopupCtaSizeLayout(mode, { hasIcon: showIcon })}
      />
    );
  });

  if (mode === 'row-equal') {
    return (
      <footer className='tour-glass-panel__footer'>
        <div className={popupCtaWrapClassName('row-equal')}>
          <div className={popupCtaRowClassName(secondaries.length)}>
            {secondaryButtons}
            {primaryButton}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className='tour-glass-panel__footer'>
      <div className={popupCtaWrapClassName('primary-stack')}>
        {secondaryButtons}
        <div className='tour-glass-panel__cta-primary-group'>
          {primaryButton}
        </div>
      </div>
    </footer>
  );
}

export function PopupPrimaryCtaFooter({ cta }: { cta: PopupCta }) {
  return <PopupCtasFooter ctas={[cta]} />;
}

export function PopupCtasContent({ ctas }: { ctas: PopupCta[] }) {
  const { primary } = partitionPopupCtasForPlacement(ctas);
  if (!primary) return null;

  return (
    <div className='tour-glass-panel__cta-wrap tour-glass-panel__cta-wrap--full'>
      <PopupCtaButton
        cta={{ ...primary, variant: 'primary' }}
        sizeLayout='wide'
      />
    </div>
  );
}

export function PopupCtasBlock({ ctas }: { ctas: PopupCta[] }) {
  return <PopupCtasFooter ctas={ctas} />;
}

export function PopupCtaBlock({ cta }: { cta: PopupCta }) {
  return <PopupCtasBlock ctas={[cta]} />;
}
