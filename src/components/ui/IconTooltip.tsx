import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  tooltipHostClassName,
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

/** Google Sans dark tooltip — CSS hover only (see components-layer.css). */
export function IconTooltip({
  label,
  placement = 'top',
  className,
  disabled = false,
  children,
}: IconTooltipProps) {
  if (disabled) {
    return children as ReactElement;
  }

  return (
    <span
      className={cn(tooltipHostClassName, className)}
      data-ishare-tooltip={label}
      data-ishare-tooltip-placement={placement}
    >
      {children as ReactElement}
    </span>
  );
}
