import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const tourProductBrandingVariants = cva(
  cn(
    'relative m-0 flex items-center justify-center gap-2.5 p-0 font-display leading-[1.2]',
    '[--tour-product-branding-accent:var(--color-primary)] [--tour-product-branding-icon-size:26px] [--tour-product-branding-logo-height:36px]',
  ),
  {
    variants: {
      scope: {
        platform: '[--tour-product-branding-accent:var(--color-gold)]',
        client: '',
      },
    },
  },
);

export const tourProductBrandingLogoClassName = cn(
  'block h-[var(--tour-product-branding-logo-height)] w-auto shrink-0 object-contain',
);

export const tourProductBrandingIconClassName = cn(
  'size-[var(--tour-product-branding-icon-size)] shrink-0 text-[var(--tour-product-branding-accent)] drop-shadow-[0_2px_6px_rgba(15,23,42,0.12)]',
);

export const tourProductBrandingTextClassName = cn(
  'min-w-0 text-xl tracking-[-0.02em]',
);

export const tourProductBrandingClientClassName = cn(
  'font-semibold text-foreground',
);

export const tourProductBrandingSuffixClassName = cn(
  'font-bold text-[var(--tour-product-branding-accent)]',
);

export const tourProductBrandingSrOnlyClassName = cn(
  'absolute m-[-1px] h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]',
);
