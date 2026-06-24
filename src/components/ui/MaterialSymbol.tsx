import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import {
  CTA_MATERIAL_SYMBOL_CLASS,
  materialSymbolVariation,
} from '../glassPanelCtaIcons';

interface MaterialSymbolProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  flip?: 'vertical' | 'horizontal';
  filled?: boolean;
  /** Pixel size — inline `font-size` (reliable inside badges vs Tailwind alone). */
  sizePx?: number;
}

/** Material Symbols Rounded — pass `sizePx` for reliable sizing; class tokens are layout-only. */
export function MaterialSymbol({
  name,
  className,
  flip,
  filled,
  sizePx,
  style,
  ...rest
}: MaterialSymbolProps) {
  return (
    <span
      className={cn(
        CTA_MATERIAL_SYMBOL_CLASS,
        flip === 'vertical' && 'scale-y-[-1]',
        flip === 'horizontal' && 'scale-x-[-1]',
        className,
      )}
      style={{
        ...style,
        ...(sizePx !== undefined && { fontSize: `${sizePx}px`, lineHeight: 1 }),
        fontVariationSettings: materialSymbolVariation(
          filled ? 1 : 0,
          sizePx ?? 20,
        ),
      }}
      aria-hidden='true'
      {...rest}
    >
      {name}
    </span>
  );
}
