import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Route width and section rhythm. `workbench` is for a tool route whose canvas
 * is the content — the panorama editor: it trades the reading-column cap for
 * display width and tightens the section beat so the canvas keeps the height.
 */
const PAGE_MAIN_VARIANTS = {
  default: 'max-w-7xl [--page-section-gap:3rem] md:[--page-section-gap:4rem]',
  workbench:
    'max-w-[120rem] [--page-section-gap:2rem] md:[--page-section-gap:2.5rem]',
} as const;

/** Shared page chrome: consistent padding, gap, and heading scale. */
export function PageMain({
  children,
  className,
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof PAGE_MAIN_VARIANTS;
}) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full flex-1 flex-col gap-(--page-section-gap) p-4 md:p-6',
        PAGE_MAIN_VARIANTS[variant],
        // Intro blocks (identity, tabs + lead, summary stats) sit closer to the
        // block they introduce than sections sit to each other — always half the
        // section gap, so a variant only has to state the gap.
        '[&>:is([data-slot=page-header],[data-slot=page-chrome],[data-slot=stat-grid])]:mb-[calc(var(--page-section-gap)/-2)]',
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  media,
  meta,
  switcher,
  icon: Icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  meta?: ReactNode;
  switcher?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      data-slot='page-header'
      className={cn('flex min-w-0 items-stretch gap-4', className)}
    >
      {media ?
        <div className='flex min-h-0 w-fit shrink-0 self-stretch'>{media}</div>
      : null}
      <div className='min-w-0 flex-1 space-y-1'>
        {meta ?
          <div className='flex flex-wrap items-center gap-2'>{meta}</div>
        : null}
        {switcher ?? (
          <h1 className='type-display inline-flex min-w-0 items-center gap-3'>
            {Icon ?
              <Icon
                aria-hidden='true'
                className='size-6 text-muted-foreground/70'
              />
            : null}
            {title}
          </h1>
        )}
        {description ?
          <div className='line-clamp-2 text-sm text-muted-foreground'>
            {description}
          </div>
        : null}
      </div>
      {actions ?
        <div className='flex shrink-0 items-center gap-2 self-center'>
          {actions}
        </div>
      : null}
    </div>
  );
}

/** Tab-panel lead under workspace tabs — not the page-header identity description. */
export function PageLead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
}

/** Identity + tabs + lead. Direct PageMain child so the section gap pulls in. */
export function PageChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot='page-chrome'
      className={cn('space-y-6 md:space-y-8', className)}
    >
      {children}
    </div>
  );
}

/** Primary tabs and the lead that introduces the panel. */
export function WorkspaceTabs({
  children,
  lead,
  className,
}: {
  children: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
      {lead ?
        <PageLead>{lead}</PageLead>
      : null}
    </div>
  );
}

export function SectionHeader({
  id,
  title,
  description,
  actions,
  icon: Icon,
  className,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn('flex min-w-0 items-end justify-between gap-4', className)}
    >
      <div className='min-w-0 flex-1 space-y-1'>
        <h2 id={id} className='type-heading inline-flex items-center gap-3'>
          {Icon ?
            <Icon
              aria-hidden='true'
              className='size-5 text-muted-foreground/70'
            />
          : null}
          {title}
        </h2>
        {description ?
          <p className='text-sm text-muted-foreground'>{description}</p>
        : null}
      </div>
      {actions ?
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      : null}
    </div>
  );
}
