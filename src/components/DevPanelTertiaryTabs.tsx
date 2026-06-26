import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useSegmentedTabIndicator } from '../hooks/useSegmentedTabIndicator';
import {
  SEGMENTED_TAB_ACTIVE_ATTR,
  SEGMENTED_TAB_ATTR,
} from './ui/segmentedTabsClasses';
import {
  devViewPanelTertiaryTabButtonVariants,
  devViewPanelTertiaryTabIndicatorClassName,
  devViewPanelTertiaryTabIndicatorReadyClassName,
  devViewPanelTertiaryTabsClassName,
  devViewPanelTertiaryTabsWrapClassName,
  type DevPanelTertiaryTabKind,
} from './devViewPanelVariants';

export interface DevPanelTertiaryTabItem<T extends string> {
  id: T;
  label: ReactNode;
  kind: DevPanelTertiaryTabKind;
  htmlId?: string;
  ariaControls?: string;
}

interface DevPanelTertiaryTabsProps<T extends string> {
  'aria-label': string;
  tabs: DevPanelTertiaryTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function DevPanelTertiaryTabs<T extends string>({
  'aria-label': ariaLabel,
  tabs,
  value,
  onChange,
}: DevPanelTertiaryTabsProps<T>) {
  const { tablistRef, indicator, indicatorReady } = useSegmentedTabIndicator(
    value,
    { observeKey: tabs.length },
  );

  return (
    <div className={devViewPanelTertiaryTabsWrapClassName}>
      <div
        ref={tablistRef}
        className={devViewPanelTertiaryTabsClassName}
        role='tablist'
        aria-label={ariaLabel}
      >
        <span
          className={cn(
            devViewPanelTertiaryTabIndicatorClassName,
            indicatorReady && devViewPanelTertiaryTabIndicatorReadyClassName,
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
              className={devViewPanelTertiaryTabButtonVariants({ active })}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
