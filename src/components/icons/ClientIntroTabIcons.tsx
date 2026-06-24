import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { TourCategory } from '../../constants/tourCategories';
import { TourCategoryIcon } from './TourCategoryIcon';
import { segmentedTabIconClassName } from '../ui/segmentedTabsClasses';

export type ClientIntroCategoryFilter = 'all' | TourCategory;

function TabIconShell({
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

export function ClientIntroTabAllIcon({ className }: { className?: string }) {
  return (
    <TabIconShell className={className}>
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
    </TabIconShell>
  );
}

export function ClientIntroTabLabel({
  filter,
  label,
}: {
  filter: ClientIntroCategoryFilter;
  label: string;
}) {
  if (filter === 'all') {
    return (
      <>
        <ClientIntroTabAllIcon />
        <span>{label}</span>
      </>
    );
  }

  return (
    <>
      <TourCategoryIcon
        category={filter}
        className={segmentedTabIconClassName}
      />
      <span>{label}</span>
    </>
  );
}
