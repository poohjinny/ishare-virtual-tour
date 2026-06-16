import type { ReactNode } from 'react';
import type { TourCategory } from '../../constants/tourCategories';

interface TourCategoryIconProps {
  category: TourCategory;
  className?: string;
}

function IconShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      {children}
    </svg>
  );
}

export function TourCategoryIcon({ category, className }: TourCategoryIconProps) {
  switch (category) {
    case 'Healthcare':
      return (
        <IconShell className={className}>
          <path
            d='M12 21s-3.5-2.4-5.5-5.8C4.5 12.2 4 10.2 4 8.5a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 1.7-.5 3.7-2.5 6.7C15.5 18.6 12 21 12 21z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
          <path
            d='M12 11v4M10 13h4'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
        </IconShell>
      );

    case 'Education':
      return (
        <IconShell className={className}>
          <path
            d='M4 9.5 12 5l8 4.5L12 14 4 9.5z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
          <path
            d='M7 11.5V16c0 .8 2.2 2 5 2s5-1.2 5-2v-4.5'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
          <path
            d='M19 10v6'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
        </IconShell>
      );

    case 'Culture':
      return (
        <IconShell className={className}>
          <path
            d='M5 20V9M9 20V9M15 20V9M19 20V9'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
          <path
            d='M4 20h16M6.5 9h2M11.5 9h2M15.5 9h2'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
          <path
            d='M12 5.5 14.5 9h-5L12 5.5z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
        </IconShell>
      );

    case 'Sporting Venues':
      return (
        <IconShell className={className}>
          <path
            d='M8 4h8l1 4-5 3-5-3 1-4z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
          <path
            d='M12 11v3M9.5 20h5M10.5 14h3l.5 6'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </IconShell>
      );

    case 'International Aid':
      return (
        <IconShell className={className}>
          <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='1.75' />
          <path
            d='M4 12h16M12 4a12.5 12.5 0 0 1 0 16M12 4a12.5 12.5 0 0 0 0 16'
            stroke='currentColor'
            strokeWidth='1.75'
          />
        </IconShell>
      );

    case 'Social Services':
      return (
        <IconShell className={className}>
          <circle cx='9' cy='8.5' r='2.5' stroke='currentColor' strokeWidth='1.75' />
          <circle cx='16' cy='9.5' r='2' stroke='currentColor' strokeWidth='1.75' />
          <path
            d='M4.5 18c.8-2.4 2.6-3.5 4.5-3.5s3.7 1.1 4.5 3.5M13 18c.5-1.6 1.6-2.5 3-2.5 1.8 0 3 1.2 3.5 2.5'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
          />
        </IconShell>
      );

    case 'Tourism':
      return (
        <IconShell className={className}>
          <circle cx='12' cy='13' r='7' stroke='currentColor' strokeWidth='1.75' />
          <path
            d='M12 9.5V13l2.5 1.5'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M9 4.5h6l-.5 2h-5l-.5-2z'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinejoin='round'
          />
        </IconShell>
      );
  }
}
