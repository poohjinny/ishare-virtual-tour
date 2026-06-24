import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const shareTourPanelRootClassName = cn(
  'flex min-w-0 flex-col gap-3.5 px-5 pb-5',
);

export const shareTourPanelLeadClassName = cn(
  'm-0 font-body text-md leading-[1.55] text-[var(--ishare-glass-body-text)] [&_strong]:font-semibold [&_strong]:text-foreground',
);

export const shareTourPanelUrlFieldClassName = cn('mt-2.5 block min-w-0');

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
