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
  /** When true, renders children only (no hover tooltip). */
  disabled?: boolean;
  children: ReactNode;
}

function canUseHoverTooltips(): boolean {
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Dark iShare tooltip — shared body portal runtime (ancestor overflow safe).
 * Same layer as HTML/`data-ishare-tooltip` hosts.
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

  if (disabled) {
    return children as ReactElement;
  }

  return (
    <span
      ref={hostRef}
      className={cn(
        tooltipHostClassName,
        tooltipHostPortalClassName,
        className,
      )}
      onPointerEnter={() => {
        if (canUseHoverTooltips()) open();
      }}
      onPointerLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children as ReactElement}
    </span>
  );
}
