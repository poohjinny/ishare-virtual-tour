import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { materialSymbolCompactClassName } from './ui/materialSymbolClasses';

export const namingPriceFilterVariants = cva('naming-price-filter', {
  variants: {
    active: {
      true: cn(
        'naming-price-filter--active',
        '[&_.naming-price-filter__icon]:text-primary',
      ),
      false: '',
    },
  },
  defaultVariants: { active: false },
});

export const namingPriceFilterHeaderClassName = cn(
  'naming-price-filter__header flex items-center justify-between gap-3',
);

export const namingPriceFilterLabelRowClassName = cn(
  'naming-price-filter__label-row flex min-w-0 items-center gap-1.5',
);

export const namingPriceFilterIconClassName = cn(
  'naming-price-filter__icon',
  materialSymbolCompactClassName,
  'text-muted transition-colors duration-200',
);

export const namingPriceFilterLabelClassName = cn(
  'naming-price-filter__label font-display text-sm font-semibold text-foreground',
);

export const namingPriceFilterValuesClassName = cn(
  'naming-price-filter__values whitespace-nowrap font-display text-xs font-semibold text-[color-mix(in_srgb,var(--color-muted)_72%,transparent)]',
);

export const namingPriceFilterTrackClassName = cn(
  'naming-price-filter__track relative h-6',
);

export const namingPriceFilterRailClassName = cn(
  'naming-price-filter__rail absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[rgba(15,23,42,0.08)]',
);

export const namingPriceFilterFillClassName = cn(
  'naming-price-filter__fill absolute inset-y-0 rounded-full bg-[rgba(15,23,42,0.14)] transition-colors duration-200',
);

export const namingPriceFilterInputClassName = cn(
  'naming-price-filter__input pointer-events-none absolute inset-0 m-0 w-full appearance-none bg-transparent p-0',
);

export const namingPriceFilterInputMinClassName = cn(
  namingPriceFilterInputClassName,
  'naming-price-filter__input--min z-[3]',
);

export const namingPriceFilterInputMaxClassName = cn(
  namingPriceFilterInputClassName,
  'naming-price-filter__input--max z-[4]',
);

export const namingPriceFilterRootClassName = cn(
  'mb-[var(--tour-directory-space,16px)] flex flex-col gap-2.5 px-1',
);

export const namingPriceFilterRootEmbeddedClassName = cn(
  'flex flex-col gap-2 px-1 py-0.5',
);

export const namingPriceFilterEmbeddedHeaderClassName = cn(
  'flex items-center justify-between gap-3',
);

export const namingPriceFilterEmbeddedLabelClassName = cn(
  'font-display text-xs font-semibold text-foreground',
);
