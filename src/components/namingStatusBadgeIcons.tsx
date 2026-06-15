import type { NamingStatusModifier } from './ui/Badge';

const ICON_PROPS = {
  className: 'ishare-badge__icon',
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  'aria-hidden': true as const,
};

export function NamingStatusBadgeIcon({
  modifier,
}: {
  modifier: NamingStatusModifier;
}) {
  switch (modifier) {
    case 'on-sale':
      return (
        <svg {...ICON_PROPS}>
          <path
            d='M9 5H5v4l9 9 4-4-9-9z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
          <circle cx='8' cy='8' r='1.25' fill='currentColor' />
        </svg>
      );
    case 'reserved':
      return (
        <svg {...ICON_PROPS}>
          <rect
            x='6'
            y='11'
            width='12'
            height='9'
            rx='2'
            stroke='currentColor'
            strokeWidth='1.75'
          />
          <path
            d='M8 11V8a4 4 0 0 1 8 0v3'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
        </svg>
      );
    case 'coming-soon':
      return (
        <svg {...ICON_PROPS}>
          <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='1.75' />
          <path
            d='M12 8v5l3 2'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    case 'sold':
      return (
        <svg {...ICON_PROPS}>
          <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='1.75' />
          <path
            d='M9 12l2 2 4-4'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
  }
}

/** HTML popups (anchored glass panel). */
export function namingStatusBadgeIconHtml(
  modifier: NamingStatusModifier,
  iconClass: string,
): string {
  switch (modifier) {
    case 'on-sale':
      return `<svg class="${iconClass}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M9 5H5v4l9 9 4-4-9-9z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
  <circle cx="8" cy="8" r="1.25" fill="currentColor"/>
</svg>`;
    case 'reserved':
      return `<svg class="${iconClass}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.75"/>
  <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
</svg>`;
    case 'coming-soon':
      return `<svg class="${iconClass}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>
  <path d="M12 8v5l3 2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    case 'sold':
      return `<svg class="${iconClass}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75"/>
  <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  }
}

export function isNamingStatusIconModifier(
  modifier: string,
): modifier is NamingStatusModifier {
  return (
    modifier === 'on-sale' ||
    modifier === 'sold' ||
    modifier === 'reserved' ||
    modifier === 'coming-soon'
  );
}
