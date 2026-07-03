import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { tourGlassPanelBodyLeadClassName } from './tourGlassPanelVariants';

export const shareTourPanelRootClassName = cn(
  'flex min-w-0 flex-col gap-3.5 px-5 pb-5',
  'max-[480px]:px-[22px] max-[480px]:pb-[18px]',
);

export const shareTourPanelLeadClassName = cn(
  tourGlassPanelBodyLeadClassName,
  '[&_strong]:font-semibold [&_strong]:text-foreground',
);

export const shareTourPanelUrlFieldClassName = cn('mt-2.5 block min-w-0');

export const shareTourPreviewSectionClassName = cn(
  'flex min-w-0 flex-col gap-2',
);

export const shareTourPreviewLabelClassName = cn(
  'm-0 font-display text-xs font-semibold uppercase tracking-[0.04em] text-muted',
);

export const shareTourPreviewCardClassName = cn(
  'overflow-hidden rounded-xl border border-[color:var(--ishare-border)] bg-white/72',
);

export const shareTourPreviewImageWrapClassName = cn(
  'relative aspect-[1.91/1] w-full overflow-hidden bg-[rgba(15,23,42,0.06)]',
);

export const shareTourPreviewImageClassName = cn('size-full object-cover');

export const shareTourPreviewPlaceholderClassName = cn(
  'flex size-full items-center justify-center text-muted',
);

export const shareTourPreviewBodyClassName = cn(
  'flex flex-col gap-1 px-3.5 py-3',
);

export const shareTourPreviewHostClassName = cn(
  'text-[11px] font-medium uppercase tracking-[0.04em] text-muted',
);

export const shareTourPreviewTitleClassName = cn(
  'line-clamp-2 font-display text-sm font-semibold leading-[1.35] text-foreground',
);

export const shareTourPreviewDescriptionClassName = cn(
  'line-clamp-2 text-xs leading-[1.45] text-muted',
);

export const shareTourPanelUrlRowClassName = cn(
  'flex min-w-0 items-center gap-1.5 rounded-full border border-[color:var(--ishare-border)] bg-white/72 py-1 pr-1 pl-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-primary-light focus-within:shadow-[inset_0_0_0_3px_rgba(var(--ishare-primary-rgb),0.12)]',
);

export const shareTourPanelUrlInputClassName = cn(
  'min-w-0 flex-1 border-none bg-transparent py-2 font-display text-sm text-body focus:outline-none',
);

export const shareTourCopyButtonVariants = cva(
  'inline-flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-primary p-0 text-white transition-[background,transform] duration-150 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/90',
  {
    variants: {
      state: { idle: '', copied: 'bg-primary/82', failed: 'bg-muted' },
    },
    defaultVariants: { state: 'idle' },
  },
);

export const shareTourPanelDividerClassName = cn(
  'my-3.5 mb-0.5 flex items-center gap-3.5',
);

export const shareTourPanelDividerLineClassName = cn(
  'h-px min-w-3 flex-1 bg-[rgba(15,23,42,0.08)]',
);

export const shareTourPanelDividerLabelClassName = cn(
  'm-0 min-w-0 flex-[0_1_auto] font-display text-sm font-semibold leading-[1.3] text-muted',
);

export const shareTourAppTileClassName = cn(
  'group flex w-14 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent p-0 font-display text-muted no-underline transition-transform duration-150 hover:-translate-y-px focus-visible:outline-none',
);

export const shareTourAppLabelClassName = cn(
  'max-w-full text-center text-xs font-semibold leading-[1.2] text-body',
);

export const shareTourAppIconVariants = cva(
  'share-tour-app-icon inline-flex size-10 items-center justify-center rounded-full text-white transition-[transform,box-shadow] duration-150 group-hover:scale-[1.04] group-focus-visible:scale-[1.04] group-focus-visible:shadow-[0_0_0_3px_rgba(var(--ishare-primary-rgb),0.22)] [&_svg]:size-5',
  {
    variants: {
      channel: {
        native: 'bg-primary',
        email: 'bg-[#0078d4]',
        instagram:
          'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)] [&_svg]:size-[21px] [&_svg]:drop-shadow-[0_1px_1px_rgba(15,23,42,0.22)]',
        whatsapp: 'bg-[#25d366]',
        facebook: 'bg-[#1877f2]',
        x: 'bg-[#0f1419]',
        linkedin: 'bg-[#0a66c2]',
      },
    },
  },
);
