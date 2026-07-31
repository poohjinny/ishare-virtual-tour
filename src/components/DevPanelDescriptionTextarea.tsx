import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { devViewPanelTextareaClassName } from './devViewPanelVariants';

type DevPanelDescriptionTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> & { value: string };

function syncDescriptionTextareaHeight(el: HTMLTextAreaElement) {
  // Measure unconstrained content height first.
  el.style.height = 'auto';
  el.style.overflowY = 'hidden';

  const contentHeight = el.scrollHeight;
  const computedMax = Number.parseFloat(getComputedStyle(el).maxHeight);
  const maxHeight =
    Number.isFinite(computedMax) && computedMax > 0 ?
      computedMax
    : Number.POSITIVE_INFINITY;

  // Cap the *specified* height — setting height to full scrollHeight while
  // CSS max-height clips causes Chromium to skip the scrollbar (content
  // clipped with nowhere to scroll).
  const nextHeight = Math.min(contentHeight, maxHeight);
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
}

/**
 * Dev form description/body field: keeps the compact default height, then grows
 * with content (capped) instead of jumping to a fixed tall size when non-empty.
 */
export function DevPanelDescriptionTextarea({
  value,
  className,
  onChange,
  ...props
}: DevPanelDescriptionTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    syncDescriptionTextareaHeight(el);
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      rows={2}
      className={cn(
        devViewPanelTextareaClassName,
        // Cap growth; overflow is toggled in syncDescriptionTextareaHeight.
        'max-h-[min(50vh,24rem)] resize-none overflow-y-hidden',
        className,
      )}
      onChange={(event) => {
        onChange?.(event);
        syncDescriptionTextareaHeight(event.currentTarget);
      }}
    />
  );
}
