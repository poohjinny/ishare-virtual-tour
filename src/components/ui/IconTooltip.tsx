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
      onPointerLeave={close}
      onFocus={() => {
        if (disabled) return;
        open();
      }}
      onBlur={close}
    >
      {children as ReactElement}
    </span>
  );
}
