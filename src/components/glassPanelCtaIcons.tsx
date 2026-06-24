import type { PopupCtaIconKind } from '../utils/popupCtaIcon';

const CTA_ICON_CLASS = 'tour-glass-panel__cta-icon';

function GlassPanelCtaIconSvg({
  kind,
  className = CTA_ICON_CLASS,
}: {
  kind: PopupCtaIconKind;
  className?: string;
}) {
  const common = {
    className,
    viewBox: '0 0 20 20' as const,
    fill: 'none' as const,
    'aria-hidden': true as const,
  };

  switch (kind) {
    case 'mail':
      return (
        <svg {...common}>
          <path
            d='M3.5 7.5 10 11.5l6.5-4M4 5.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path
            d='M15 6.67A5 5 0 0 0 5 6.67c0 5.83-2.5 7.5-2.5 7.5h15S15 12.5 15 6.67Z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M11.44 17.5a1.67 1.67 0 0 1-2.88 0'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    case 'external':
      return (
        <svg {...common}>
          <path
            d='M11.5 4.5H15v3.5M15 4.5 9 10.5M8.5 6H5.75A1.25 1.25 0 0 0 4.5 7.25v7A1.25 1.25 0 0 0 5.75 15.5h7a1.25 1.25 0 0 0 1.25-1.25V11.5'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path
            d='M10 16.1 8.95 15.1C5.4 12.05 3.75 10.35 3.75 8.25 3.75 6.45 5.15 5 7 5c1.15 0 2.25.55 3 1.45.75-.9 1.85-1.45 3-1.45 1.85 0 3.25 1.45 3.25 3.25 0 2.1-1.65 3.8-5.2 6.85L10 16.1Z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
        </svg>
      );
    case 'arrow':
    default:
      return (
        <svg {...common}>
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
}

export function PopupCtaIcon({ kind }: { kind: PopupCtaIconKind }) {
  return <GlassPanelCtaIconSvg kind={kind} />;
}

function iconPathMarkup(kind: PopupCtaIconKind): string {
  switch (kind) {
    case 'mail':
      return `<path d="M3.5 7.5 10 11.5l6.5-4M4 5.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'bell':
      return `<path d="M15 6.67A5 5 0 0 0 5 6.67c0 5.83-2.5 7.5-2.5 7.5h15S15 12.5 15 6.67Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11.44 17.5a1.67 1.67 0 0 1-2.88 0" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'external':
      return `<path d="M11.5 4.5H15v3.5M15 4.5 9 10.5M8.5 6H5.75A1.25 1.25 0 0 0 4.5 7.25v7A1.25 1.25 0 0 0 5.75 15.5h7a1.25 1.25 0 0 0 1.25-1.25V11.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'heart':
      return `<path d="M10 16.1 8.95 15.1C5.4 12.05 3.75 10.35 3.75 8.25 3.75 6.45 5.15 5 7 5c1.15 0 2.25.55 3 1.45.75-.9 1.85-1.45 3-1.45 1.85 0 3.25 1.45 3.25 3.25 0 2.1-1.65 3.8-5.2 6.85L10 16.1Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>`;
    case 'arrow':
    default:
      return `<path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

export function glassPanelCtaIconHtml(
  kind: PopupCtaIconKind,
  className = CTA_ICON_CLASS,
): string {
  return `<svg class="${className}" viewBox="0 0 20 20" fill="none" aria-hidden="true">${iconPathMarkup(kind)}</svg>`;
}
