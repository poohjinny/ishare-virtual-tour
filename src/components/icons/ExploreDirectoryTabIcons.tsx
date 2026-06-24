import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { TourDirectoryTab } from '../../constants/tourDirectory';
import { segmentedTabIconClassName } from '../ui/segmentedTabsClasses';

function TabIcon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={cn(segmentedTabIconClassName, className)}
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      {children}
    </svg>
  );
}

export function ExploreDirectoryTabAllIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <TabIcon className={className}>
      <rect
        x='3.5'
        y='3.5'
        width='5'
        height='5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <rect
        x='11.5'
        y='3.5'
        width='5'
        height='5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <rect
        x='3.5'
        y='11.5'
        width='5'
        height='5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <rect
        x='11.5'
        y='11.5'
        width='5'
        height='5'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.5'
      />
    </TabIcon>
  );
}

export function ExploreDirectoryTabLocationsIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <TabIcon className={className}>
      <path
        d='M10 17s-5.5-5.74-5.5-9A5.5 5.5 0 0110 2.5 5.5 5.5 0 0115.5 8C15.5 11.26 10 17 10 17z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <circle cx='10' cy='8' r='1.75' fill='currentColor' />
    </TabIcon>
  );
}

export function ExploreDirectoryTabNamingIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={cn(segmentedTabIconClassName, className)}
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
}

const EXPLORE_DIRECTORY_TAB_ICONS: Record<
  TourDirectoryTab,
  typeof ExploreDirectoryTabAllIcon
> = {
  all: ExploreDirectoryTabAllIcon,
  locations: ExploreDirectoryTabLocationsIcon,
  naming: ExploreDirectoryTabNamingIcon,
};

export function ExploreDirectoryTabLabel({
  tab,
  label,
}: {
  tab: TourDirectoryTab;
  label: string;
}) {
  const Icon = EXPLORE_DIRECTORY_TAB_ICONS[tab];

  return (
    <>
      <Icon />
      <span>{label}</span>
    </>
  );
}
