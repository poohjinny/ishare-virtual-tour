import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { NamingOpportunity, PopupContent, PopupCta } from '../types/tour';
import {
  GIFTABULATOR_PRODUCT,
  resolvePopupCta,
} from '../data/giftabulatorBrand';
import { PlatformBrandLink } from './PlatformBrandLink';
import {
  partitionPopupCtas,
  popupCtaRowClassName,
  popupCtaWrapClassName,
  resolvePopupCtaLayoutMode,
} from '../utils/popupCtaLayout';
import { namingOpportunityStatusConfig } from '../data/namingOpportunityStatus';
import { popupVideoAutoplayUrl, resolvePopupVideo } from '../utils/popupVideo';
import {
  isNamingStatusIconModifier,
  NamingStatusBadgeIcon,
} from './namingStatusBadgeIcons';
import { BADGE_CLASS } from './ui/badgeClasses';
import type { NamingStatusModifier } from './ui/Badge';
import { applyCtaTextOverflowTitle } from '../utils/glassPanelCtaOverflow';

export function splitPopupBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const NAMING_BADGE_ICON = (
  <svg
    className={BADGE_CLASS.icon}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinejoin='round'
    />
  </svg>
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
      <span className='tour-glass-panel__price-value'>{opportunity.price}</span>
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
          <span className={BADGE_CLASS.label}>Naming Opportunity</span>
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
      <svg
        className={BADGE_CLASS.icon}
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
      >
        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 11v5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle cx='12' cy='8' r='1.25' fill='currentColor' />
      </svg>
      <span className={BADGE_CLASS.label}>Info</span>
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

  if (!resolved) return null;

  if (playing) {
    return (
      <div className='tour-glass-panel__video tour-glass-panel__video--playing'>
        {resolved.kind === 'youtube' ?
          <iframe
            src={popupVideoAutoplayUrl(resolved.sourceUrl)}
            title={`${title} video`}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
            referrerPolicy='strict-origin-when-cross-origin'
          />
        : <video
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
    <div className='tour-glass-panel__video tour-glass-panel__video--preview'>
      {resolved.thumbnailUrl ?
        <img
          className='tour-glass-panel__video-thumb'
          src={resolved.thumbnailUrl}
          alt=''
        />
      : null}
      <button
        type='button'
        className='tour-glass-panel__video-play'
        aria-label={`Play video: ${title}`}
        onClick={() => setPlaying(true)}
      >
        <PopupVideoPlayIcon />
      </button>
    </div>
  );
}

export function PopupCtaArrowIcon() {
  return (
    <svg
      className='tour-glass-panel__cta-icon'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M4 10h12M11 5l5 5-5 5'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
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
      {!isSecondary && <PopupCtaArrowIcon />}
    </a>
  );
}

export function PopupCtasBlock({ ctas }: { ctas: PopupCta[] }) {
  if (ctas.length === 0) return null;

  const mode = resolvePopupCtaLayoutMode(ctas);
  const wrapClassName = popupCtaWrapClassName(mode);

  if (mode === 'full') {
    const cta = ctas[0];

    return (
      <footer className='tour-glass-panel__footer'>
        <div className={wrapClassName}>
          <PopupCtaButton cta={cta} />
        </div>
      </footer>
    );
  }

  const { ordered, primary, secondaries } = partitionPopupCtas(ctas);

  if (mode === 'row-equal') {
    return (
      <footer className='tour-glass-panel__footer'>
        <div className={wrapClassName}>
          {ordered.map((cta, index) => (
            <PopupCtaButton key={`${cta.url}-${index}`} cta={cta} />
          ))}
        </div>
      </footer>
    );
  }

  return (
    <footer className='tour-glass-panel__footer'>
      <div className={wrapClassName}>
        {secondaries.length > 1 ?
          <div className={popupCtaRowClassName(secondaries.length)}>
            {secondaries.map((cta, index) => (
              <PopupCtaButton key={`${cta.url}-${index}`} cta={cta} />
            ))}
          </div>
        : secondaries.map((cta, index) => (
            <PopupCtaButton key={`${cta.url}-${index}`} cta={cta} />
          ))
        }
        <div className='tour-glass-panel__cta-primary-group'>
          <PopupCtaButton cta={primary} />
        </div>
      </div>
    </footer>
  );
}

export function PopupCtaBlock({ cta }: { cta: PopupCta }) {
  return <PopupCtasBlock ctas={[cta]} />;
}
