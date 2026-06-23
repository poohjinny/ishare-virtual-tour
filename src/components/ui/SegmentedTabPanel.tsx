import { useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '../../lib/cn';
import { useSegmentedTabPanelScroll } from '../../hooks/useSegmentedTabPanelScroll';
import { segmentedTabPanelContentClassName } from './segmentedTabsClasses';

interface SegmentedTabPanelContentProps {
  panelKey: string;
  children: ReactNode;
  className?: string;
}

export function SegmentedTabPanelContent({
  panelKey,
  children,
  className = '',
}: SegmentedTabPanelContentProps) {
  return (
    <div
      key={panelKey}
      className={cn(segmentedTabPanelContentClassName, className)}
    >
      {children}
    </div>
  );
}

interface SegmentedTabPanelProps {
  panelKey: string;
  children: ReactNode;
  id?: string;
  'aria-labelledby'?: string;
  className?: string;
  scrollRef?: RefObject<HTMLElement | null>;
}

export function SegmentedTabPanel({
  panelKey,
  children,
  id,
  'aria-labelledby': ariaLabelledBy,
  className = '',
  scrollRef,
}: SegmentedTabPanelProps) {
  const fallbackScrollRef = useRef<HTMLElement | null>(null);
  useSegmentedTabPanelScroll(panelKey, scrollRef ?? fallbackScrollRef);

  return (
    <div
      id={id}
      role='tabpanel'
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      <SegmentedTabPanelContent panelKey={panelKey}>
        {children}
      </SegmentedTabPanelContent>
    </div>
  );
}
