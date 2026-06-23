import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full font-body leading-[1.2]',
  {
    variants: {
      variant: {
        outline:
          'gap-[7px] border border-[rgba(15,23,42,0.1)] bg-transparent py-1.5 pl-2.5 pr-[11px] text-2xs font-medium text-muted',
        fill: 'border-none',
      },
      size: {
        sm: 'px-2 py-[3px] text-2xs font-medium',
        lg: 'gap-1.5 px-3 py-[5px] font-display text-xs font-bold uppercase tracking-[0.04em]',
      },
      tone: { none: '', muted: '', primary: '', accent: '' },
      status: {
        none: '',
        'on-sale': '',
        sold: '',
        reserved: '',
        'coming-soon': '',
      },
      uppercase: { true: 'uppercase tracking-[0.04em]', false: '' },
    },
    compoundVariants: [
      {
        variant: 'fill',
        tone: 'primary',
        status: 'none',
        class: 'bg-primary/10 font-semibold text-primary',
      },
      {
        variant: 'fill',
        tone: 'accent',
        status: 'none',
        class:
          'bg-[var(--ishare-badge-accent-bg)] font-semibold text-[var(--ishare-badge-accent-color)]',
      },
      {
        variant: 'fill',
        tone: 'muted',
        status: 'none',
        class: 'bg-[rgba(15,23,42,0.06)] text-muted',
      },
      {
        variant: 'fill',
        status: 'on-sale',
        class:
          'bg-[var(--ishare-naming-status-on-sale-bg)] font-semibold text-[var(--ishare-naming-status-on-sale-color)]',
      },
      {
        variant: 'fill',
        status: 'sold',
        class:
          'bg-[var(--ishare-naming-status-sold-bg)] font-semibold text-[var(--ishare-naming-status-sold-color)]',
      },
      {
        variant: 'fill',
        status: 'reserved',
        class:
          'bg-[var(--ishare-naming-status-reserved-bg)] font-semibold text-[var(--ishare-naming-status-reserved-color)]',
      },
      {
        variant: 'fill',
        status: 'coming-soon',
        class:
          'bg-[var(--ishare-naming-status-coming-soon-bg)] font-semibold text-[var(--ishare-naming-status-coming-soon-color)]',
      },
    ],
    defaultVariants: {
      variant: 'outline',
      size: 'sm',
      tone: 'muted',
      status: 'none',
      uppercase: false,
    },
  },
);

export const badgeDotVariants = cva('size-[5px] shrink-0 rounded-full', {
  variants: {
    tone: {
      muted: 'bg-muted/65',
      primary: 'bg-primary',
      accent: 'bg-accent/85',
      none: 'bg-muted/65',
    },
  },
  defaultVariants: { tone: 'muted' },
});
