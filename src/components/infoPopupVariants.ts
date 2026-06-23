import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import {
  tourGlassPanelCloseClassName,
  tourGlassPanelHeaderClassName,
  tourGlassPanelHeaderLeadingClassName,
  tourGlassPanelRootVariants,
  tourGlassPanelShellVariants,
  tourGlassPanelTitleActionsClassName,
  tourGlassPanelTitleClassName,
  tourGlassPanelTitleRowClassName,
  tourGlassPanelBodyClassName,
} from './tourGlassPanelVariants';

export const infoPopupBackdropVariants = cva('info-popup-backdrop', {
  variants: { phase: { idle: '', exit: 'info-popup-backdrop--exit' } },
  defaultVariants: { phase: 'idle' },
});

export const infoPopupPanelVariants = cva(
  cn(
    'info-popup',
    tourGlassPanelRootVariants({ variant: 'dock' }),
    'tour-glass-panel--modal',
  ),
  {
    variants: { phase: { idle: '', exit: 'info-popup--exit' } },
    defaultVariants: { phase: 'idle' },
  },
);

export const infoPopupTitleRowClassName = cn(
  tourGlassPanelTitleRowClassName,
  'info-popup__title-row',
);

export const infoPopupTitleClassName = cn(
  tourGlassPanelTitleClassName,
  'info-popup__title',
);

export const infoPopupImageClassName = cn('info-popup__image');

export {
  tourGlassPanelCloseClassName,
  tourGlassPanelHeaderClassName,
  tourGlassPanelHeaderLeadingClassName,
  tourGlassPanelShellVariants,
  tourGlassPanelTitleActionsClassName,
  tourGlassPanelTitleClassName,
  tourGlassPanelTitleRowClassName,
  tourGlassPanelBodyClassName,
};

export const infoPopupTitleBlockClassName = cn('tour-glass-panel__title-block');

export const infoPopupTitleLineClassName = cn('tour-glass-panel__title-line');

export const infoPopupPriceLabelClassName = cn('tour-glass-panel__price-label');
