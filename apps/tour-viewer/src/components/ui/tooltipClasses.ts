import { cn } from '../../lib/cn';

export type IshareTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Trigger host — visual tooltips via shared body portal runtime. */
export const tooltipHostClassName = cn('ishare-tooltip-host');

/** Marks hosts that use the portal runtime (vs legacy CSS ::after). */
export const tooltipHostPortalClassName = cn('ishare-tooltip-host--portal');

/** Body-portaled dark tooltip bubble. */
export const tooltipBubbleClassName = cn('ishare-tooltip-bubble');

export const tooltipBubbleEnteredClassName = cn(
  'ishare-tooltip-bubble--entered',
);
