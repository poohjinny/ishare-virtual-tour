import type { ReactNode } from 'react';
import { useSegmentedTabIndicator } from '../../hooks/useSegmentedTabIndicator';
import {
  SEGMENTED_TABS_LIST_CLASS,
  segmentedTabClassName,
} from './segmentedTabsClasses';
import './SegmentedTabs.css';

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
      className={[
        SEGMENTED_TABS_LIST_CLASS,
        'ishare-segmented-tabs--animated',
        scrollable ? 'ishare-segmented-tabs--scroll' : '',
        indicatorReady ? 'ishare-segmented-tabs--indicator-ready' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role='tablist'
      aria-label={ariaLabel}
    >
      <span
        className='ishare-segmented-tabs__indicator'
        aria-hidden='true'
        style={{
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.left}px)`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type='button'
          role='tab'
          id={tab.htmlId}
          aria-selected={value === tab.id}
          aria-controls={tab.ariaControls}
          className={segmentedTabClassName(value === tab.id)}
          disabled={disabled || tab.disabled}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
