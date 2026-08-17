'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn, cardLinkClass } from '@/lib/utils';

/** Info-card value that navigates — primary at rest, underline on hover. */
export function InfoLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={cardLinkClass}>
        {children}
      </Link>
    );
  }

  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      className={cardLinkClass}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function InfoFieldList({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid items-start gap-x-3 gap-y-3',
        columns === 1 && 'grid-cols-[auto_minmax(0,1fr)]',
        columns === 2 &&
          'grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[var(--admin-info-subject-width)_minmax(0,1fr)_var(--admin-info-subject-width)_minmax(0,1fr)] sm:gap-x-8',
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function InfoField({
  label,
  children,
  icon: Icon,
  layout = 'stack',
  span = 'row',
}: {
  label: string;
  children: ReactNode;
  icon?: LucideIcon;
  layout?: 'stack' | 'inline';
  span?: 'row' | 'full';
}) {
  const value = children == null || children === '' ? '—' : children;
  const subject = (
    <dt
      className={cn(
        'type-body inline-flex items-center gap-1.5 font-heading text-foreground',
        layout === 'inline' && 'whitespace-nowrap',
      )}
    >
      {Icon ?
        <Icon aria-hidden='true' className='icon-inline' />
      : null}
      {label}
    </dt>
  );

  if (layout === 'inline') {
    return (
      <div
        className={cn(
          'col-span-2 grid grid-cols-subgrid items-start',
          span === 'full' && 'sm:col-span-4',
        )}
      >
        {subject}
        <dd
          className={cn(
            'type-body min-w-0 break-words text-foreground',
            span === 'full' && 'sm:col-span-3',
          )}
        >
          {value}
        </dd>
      </div>
    );
  }

  return (
    <div className='grid gap-1'>
      {subject}
      <dd className='type-body text-foreground'>{value}</dd>
    </div>
  );
}

export function FormCancelButton({
  disabled,
  onReset,
}: {
  disabled?: boolean;
  onReset: () => void;
}) {
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled}
      onClick={onReset}
    >
      Cancel
    </Button>
  );
}

export function StickyFormActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot='sticky-form-actions'
      className={cn(
        // Sticky save row for long forms. The divider above the submit row is a
        // rule — it closes the field list on every form, drawer or in-page. It
        // spans the field column; globals.css owns the space over the divider,
        // which has to come from the grid gap or a margin depending on the
        // parent, and a utility here would win over that.
        'sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t bg-card/95 pb-4 backdrop-blur supports-[backdrop-filter]:bg-card/80',
        className,
      )}
    >
      {children}
    </div>
  );
}
