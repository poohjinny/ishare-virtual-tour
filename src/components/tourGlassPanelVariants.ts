import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const tourGlassPanelRootVariants = cva('tour-glass-panel', {
  variants: {
    variant: {
      dock: 'tour-glass-panel--dock',
      anchored: 'tour-glass-panel--anchored',
    },
  },
  defaultVariants: { variant: 'dock' },
});

export const tourGlassPanelShellVariants = cva('tour-glass-panel__shell', {
  variants: {
    animation: {
      none: '',
      enter: 'tour-glass-panel__shell--enter',
      exit: 'tour-glass-panel__shell--exit',
    },
  },
  defaultVariants: { animation: 'none' },
});

export const tourGlassPanelHeaderClassName = cn('tour-glass-panel__header');

export const tourGlassPanelTitleRowClassName = cn(
  'tour-glass-panel__title-row',
);

export const tourGlassPanelHeaderLeadingClassName = cn(
  'tour-glass-panel__header-leading',
);

export const tourGlassPanelTitleClassName = cn('tour-glass-panel__title');

export const tourGlassPanelTitleActionsClassName = cn(
  'tour-glass-panel__title-actions',
);

export const tourGlassPanelCloseClassName = cn('tour-glass-panel__close');

export const tourGlassPanelCloseIconClassName = cn(
  'tour-glass-panel__close-icon',
);

export const tourGlassPanelBodyClassName = cn(
  'tour-glass-panel__body ishare-scrollbar',
);

export function tourGlassPanelRootClassName(
  variant: 'anchored' | 'dock',
  extra?: string,
): string {
  return cn(tourGlassPanelRootVariants({ variant }), extra);
}

export function tourGlassPanelShellClassName(
  animation: 'enter' | 'exit' | 'none',
): string {
  return tourGlassPanelShellVariants({ animation });
}

export function tourGlassPanelBodyClassNameWith(extra?: string): string {
  return cn(tourGlassPanelBodyClassName, extra);
}
