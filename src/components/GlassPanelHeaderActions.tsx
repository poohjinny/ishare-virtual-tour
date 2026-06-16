import type { PopupCta } from '../types/tour';
import { resolvePopupCta } from '../data/giftabulatorBrand';
import { isMailtoCtaUrl } from '../utils/popupCtaPlacement';
import { ShareTourHeaderButton } from './ShareTourHeaderButton';

function MailIcon() {
  return (
    <svg
      className='tour-glass-panel__header-btn-icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M4 6h16v12H4z' />
      <path d='m4 7 8 6 8-6' />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className='tour-glass-panel__header-btn-icon'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M14 5h5v5' />
      <path d='M10 14 19 5' />
      <path d='M19 14v5H5V5h5' />
    </svg>
  );
}

export function PopupCtaHeaderLink({ cta }: { cta: PopupCta }) {
  const resolved = resolvePopupCta(cta);

  return (
    <a
      className='tour-glass-panel__header-btn'
      href={resolved.url}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={resolved.ariaLabel}
      title={resolved.label}
    >
      {isMailtoCtaUrl(resolved.url) ?
        <MailIcon />
      : <ExternalLinkIcon />}
    </a>
  );
}

interface GlassPanelHeaderActionsProps {
  headerCtas?: PopupCta[];
  share?: {
    shareUrl: string;
    message: Parameters<typeof ShareTourHeaderButton>[0]['message'];
    ariaLabel: string;
  };
}

export function GlassPanelHeaderActions({
  headerCtas = [],
  share,
}: GlassPanelHeaderActionsProps) {
  if (headerCtas.length === 0 && !share) return null;

  return (
    <div className='tour-glass-panel__header-actions'>
      {share && (
        <ShareTourHeaderButton
          shareUrl={share.shareUrl}
          message={share.message}
          ariaLabel={share.ariaLabel}
        />
      )}
      {headerCtas.map((cta, index) => (
        <PopupCtaHeaderLink key={`${cta.url}-${index}`} cta={cta} />
      ))}
    </div>
  );
}
