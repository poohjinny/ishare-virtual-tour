import type { HTMLAttributes } from 'react';
import { MaterialSymbol } from '../ui/MaterialSymbol';

interface TourMarkerIconProps extends HTMLAttributes<HTMLSpanElement> {
  sizePx?: number;
  /** Filled pin — list items / branding. Outline by default. */
  filled?: boolean;
}

export function TourMarkerIcon({
  className,
  sizePx,
  filled = false,
  ...rest
}: TourMarkerIconProps) {
  return (
    <MaterialSymbol
      name='location_on'
      filled={filled}
      className={className}
      sizePx={sizePx}
      {...rest}
    />
  );
}
