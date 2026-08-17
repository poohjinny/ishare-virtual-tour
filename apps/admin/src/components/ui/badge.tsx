import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent font-normal whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'badge-item [--badge-item:var(--status-open)] hover:opacity-90',
        warning:
          'badge-item [--badge-item:var(--status-reserved)] hover:opacity-90',
        info: 'badge-item [--badge-item:var(--status-soon)] hover:opacity-90',
        accent: 'badge-item [--badge-item:var(--status-sold)] hover:opacity-90',
        muted:
          'badge-item [--badge-item:var(--status-unlisted)] hover:opacity-90',
        public:
          'badge-item [--badge-item:var(--status-public)] hover:opacity-90',
        internal:
          'badge-item [--badge-item:var(--status-internal)] hover:opacity-90',
        naming:
          'badge-item [--badge-item:var(--status-naming)] hover:opacity-90',
        caution:
          'badge-item [--badge-item:var(--status-place)] hover:opacity-90',
        hero: 'border-transparent hover:opacity-90',
      },
      size: {
        default: 'h-5 px-2 py-0.5 text-[11px] [&>svg]:size-3!',
        sm: 'h-4.5 gap-1 px-2 py-0 text-[10px] [&>svg]:size-2.5!',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot='badge'
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
