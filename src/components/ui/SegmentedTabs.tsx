import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useSegmentedTabIndicator } from '../../hooks/useSegmentedTabIndicator';
import {
  SEGMENTED_TAB_ACTIVE_ATTR,
  SEGMENTED_TAB_ATTR,
  segmentedTabButtonClassName,
  segmentedTabsIndicatorClassName,
  segmentedTabsIndicatorReadyClassName,
  segmentedTabsListClassName,
  segmentedTabsScrollableClassName,
} from './segmentedTabsClasses';

export interface SegmentedTabItem<T extends string> {
  id: T;
  label: ReactNode;
  disabled?: boolean;
  htmlId?: string;
  ariaControls?: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  className?: string;
  scrollable?: boolean;
  scrollToStartKey?: T;
  disabled?: boolean;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  'aria-label': ariaLabel,
  className = '',
  scrollable = false,
  scrollToStartKey,
  disabled = false,
}: SegmentedTabsProps<T>) {
  const { tablistRef, indicator, indicatorReady } = useSegmentedTabIndicator(
    value,
    { scrollable, scrollToStartKey, observeKey: tabs.length },
  );

  return (
    <div
      ref={tablistRef}
      className={cn(
        segmentedTabsListClassName,
        scrollable && segmentedTabsScrollableClassName,
        className,
      )}
      role='tablist'
      aria-label={ariaLabel}
    >
      <span
        className={cn(
          segmentedTabsIndicatorClassName,
          indicatorReady && segmentedTabsIndicatorReadyClassName,
        )}
        aria-hidden='true'
        style={{
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            id={tab.htmlId}
            aria-selected={active}
            aria-controls={tab.ariaControls}
            {...{ [SEGMENTED_TAB_ATTR]: '' }}
            {...{ [SEGMENTED_TAB_ACTIVE_ATTR]: active ? 'true' : 'false' }}
            className={segmentedTabButtonClassName(active)}
            disabled={disabled || tab.disabled}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
