import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import {
  ensureIshareTooltipDelegation,
  hideIshareTooltip,
  refreshIshareTooltipIfActive,
  showIshareTooltip,
} from '../../utils/ishareTooltipRuntime';
import {
  tooltipHostClassName,
  tooltipHostPortalClassName,
  type IshareTooltipPlacement,
} from './tooltipClasses';

interface IconTooltipProps {
  label: string;
  placement?: IshareTooltipPlacement;
  className?: string;
  /** When true, host stays mounted but hover/focus tooltips are off. */
  disabled?: boolean;
  /**
   * Keep the bubble open (e.g. after click feedback) even without hover —
   * label updates still refresh via {@link refreshIshareTooltipIfActive}.
   */
  forceShow?: boolean;
  children: ReactNode;
}

function canUseHoverTooltips(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Dark iShare tooltip — shared body portal runtime (ancestor overflow safe).
 * Same layer as HTML/`data-ishare-tooltip` hosts.
 * Host span is always rendered so toggling `disabled` does not reflow flex/grid parents.
 */
export function IconTooltip({
  label,
  placement = 'top',
  className,
  disabled = false,
  forceShow = false,
  children,
}: IconTooltipProps) {
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    ensureIshareTooltipDelegation();
  }, []);

  const close = useCallback(() => {
    hideIshareTooltip(hostRef.current);
  }, []);

  const open = useCallback(() => {
    const host = hostRef.current;
    if (!host || !label.trim()) return;
    showIshareTooltip({ anchor: host, label, placement });
  }, [label, placement]);

  useEffect(() => () => hideIshareTooltip(hostRef.current), []);

  useEffect(() => {
    if (disabled) close();
  }, [close, disabled]);

  useEffect(() => {
    if (disabled) return;
    if (forceShow) {
      open();
      return;
    }
  }, [disabled, forceShow, open]);

  // Keep the visible bubble in sync when copy/feedback labels change mid-hover.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || disabled) return;
    refreshIshareTooltipIfActive(host, label, placement);
  }, [disabled, label, placement]);

  return (
    <span
      ref={hostRef}
      className={cn(
        tooltipHostClassName,
        tooltipHostPortalClassName,
        className,
      )}
      onPointerEnter={() => {
        if (disabled || !canUseHoverTooltips()) return;
        open();
      }}
      onPointerLeave={() => {
        if (forceShow) return;
        close();
      }}
      onFocus={() => {
        if (disabled) return;
        open();
      }}
      onBlur={() => {
        if (forceShow) return;
        close();
      }}
    >
      {children as ReactElement}
    </span>
  );
}
