import type { NamingOpportunity, PopupContent, PopupCta } from '../types/tour';
import {
  GIFTABULATOR_PRODUCT,
  resolvePopupCta,
} from '../data/giftabulatorBrand';
import { namingOpportunityStatusConfig } from '../data/namingOpportunityStatus';
import { youtubeEmbedUrl } from './tourGlassPanelHtml';

export function splitPopupBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const NAMING_BADGE_ICON = (
  <svg
    className='tour-glass-panel__badge-icon'
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

export function NamingOpportunityMeta({
  opportunity,
}: {
  opportunity: NamingOpportunity;
}) {
  const statusConfig = namingOpportunityStatusConfig(opportunity.status);
  const priceSold = statusConfig.cssModifier === 'sold';

  return (
    <div className='tour-glass-panel__meta' aria-label={opportunity.name}>
      <div className='tour-glass-panel__meta-row'>
        <span className='tour-glass-panel__badge tour-glass-panel__badge--naming'>
          {NAMING_BADGE_ICON}
          <span className='tour-glass-panel__badge-text'>
            Naming Opportunity
          </span>
        </span>
        <span
          className={`tour-glass-panel__badge tour-glass-panel__badge--status tour-glass-panel__badge--status-${statusConfig.cssModifier}`}
        >
          <span className='tour-glass-panel__badge-text'>
            {statusConfig.label}
          </span>
        </span>
        <span
          className={`tour-glass-panel__badge tour-glass-panel__badge--price${priceSold ? ' tour-glass-panel__badge--price-sold' : ''}`}
        >
          <span className='tour-glass-panel__badge-text'>
            {opportunity.price}
          </span>
        </span>
      </div>
      {opportunity.priceLabel && (
        <p className='tour-glass-panel__price-label'>
          {opportunity.priceLabel}
        </p>
      )}
    </div>
  );
}

export function PopupHeaderMeta({ popup }: { popup: PopupContent }) {
  if (popup.namingOpportunity) {
    return <NamingOpportunityMeta opportunity={popup.namingOpportunity} />;
  }

  if (popup.sponsor) {
    return (
      <span className='tour-glass-panel__badge tour-glass-panel__badge--sponsor'>
        <span className='tour-glass-panel__badge-text'>
          {popup.sponsor.label ?? 'Presented by'} {popup.sponsor.name}
        </span>
      </span>
    );
  }

  return (
    <span className='tour-glass-panel__badge'>
      <svg
        className='tour-glass-panel__badge-icon'
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
      <span className='tour-glass-panel__badge-text'>Info</span>
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

export function PopupVideoEmbed({
  videoUrl,
  title,
}: {
  videoUrl: string;
  title: string;
}) {
  const embedUrl = youtubeEmbedUrl(videoUrl);
  if (!embedUrl) return null;

  return (
    <div className='tour-glass-panel__video'>
      <iframe
        src={embedUrl}
        title={`${title} video`}
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        allowFullScreen
        referrerPolicy='strict-origin-when-cross-origin'
      />
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

  if (resolved.kind === 'giftabulator') {
    return (
      <>
        {resolved.labelPrefix}
        {GIFTABULATOR_PRODUCT.name}
        <sup className='tour-glass-panel__reg' aria-hidden='true'>
          {GIFTABULATOR_PRODUCT.mark}
        </sup>
      </>
    );
  }

  return <>{resolved.label}</>;
}

export function PopupCtaBlock({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);

  return (
    <footer className='tour-glass-panel__footer'>
      <div className='tour-glass-panel__cta-wrap'>
        <a
          className='tour-glass-panel__cta'
          href={resolved.url}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={resolved.ariaLabel}
        >
          <span className='tour-glass-panel__cta-text'>
            <PopupCtaLabel cta={cta} />
          </span>
          <PopupCtaArrowIcon />
        </a>
        {resolved.sublabel && (
          <p className='tour-glass-panel__cta-sublabel'>{resolved.sublabel}</p>
        )}
      </div>
    </footer>
  );
}
