'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';

import { BrandedAvatar, OptionThumb } from '@/components/branded-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function PeerSwitcher({
  label,
  value,
  options,
  hrefTemplate,
  variant = 'default',
  imageFit = 'cover',
  current = false,
  fallbackImage,
  href,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    image?: string;
    fallbackImage?: string;
  }>;
  /** Use `{id}` for the selected peer, e.g. `/clients/{id}`. */
  hrefTemplate: string;
  /** `title` replaces the page heading. `crumb` is the breadcrumb control. */
  variant?: 'default' | 'title' | 'crumb';
  imageFit?: 'cover' | 'contain';
  /** Current breadcrumb page — foreground label. */
  current?: boolean;
  fallbackImage?: string;
  /**
   * Crumb only. Splits the control: the label navigates here and the chevron
   * opens the peer list. Omit on the current page, which has nowhere to go.
   */
  href?: string;
}) {
  const [loadThumbs, setLoadThumbs] = useState(false);
  const selected = options.find((option) => option.value === value);
  const title = selected?.label ?? label;
  const crumbImage = selected?.image ?? fallbackImage;
  const crumbFallback =
    selected?.fallbackImage ??
    (selected?.image && selected.image !== fallbackImage ?
      fallbackImage
    : undefined);

  const crumbMark =
    crumbImage ?
      <BrandedAvatar
        src={crumbImage}
        fallbackSrc={crumbFallback}
        label={title}
        size='xs'
        fit={imageFit}
        loading='eager'
        className='h-5 w-7 shrink-0'
      />
    : null;

  if (options.length < 2) {
    if (variant === 'title') {
      return <h1 className='type-display'>{title}</h1>;
    }
    if (variant === 'crumb') {
      return (
        <span
          className={cn(
            'inline-flex min-w-0 items-center gap-1.5',
            current && 'font-medium text-foreground',
          )}
        >
          {crumbMark}
          <span className='min-w-0 truncate'>{title}</span>
        </span>
      );
    }
    return null;
  }

  const chevron = (
    <ChevronDown
      aria-hidden='true'
      strokeWidth={1.75}
      className={cn(
        'shrink-0 text-muted-foreground/80 transition-all duration-200 ease-out',
        'group-hover:text-primary group-data-[state=open]:text-primary',
        'group-data-[state=open]:rotate-180',
        variant === 'title' ? 'size-5' : 'size-4',
      )}
    />
  );

  const trigger =
    variant === 'title' ?
      <h1 className='type-display min-w-0'>
        <DropdownMenuTrigger
          aria-label={label}
          className={cn(
            'group inline-flex h-auto w-fit max-w-full cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0',
            'rounded-none font-[inherit] text-[length:inherit] leading-[inherit] tracking-[inherit]',
            'underline-offset-4 transition-colors hover:text-primary hover:underline',
            'focus-visible:ring-0 focus-visible:outline-none whitespace-normal',
          )}
        >
          {title}
          {chevron}
        </DropdownMenuTrigger>
      </h1>
    : variant === 'crumb' ?
      <span
        className={cn(
          'inline-flex min-w-0 max-w-full items-center gap-0.5',
          current ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        {href ?
          <Link
            href={href}
            title={title}
            className='group flex min-w-0 items-center gap-1.5 transition-colors duration-200 hover:text-primary'
          >
            {crumbMark}
            <span className='min-w-0 truncate underline-offset-4 group-hover:underline'>
              {title}
            </span>
          </Link>
        : <span
            aria-current={current ? 'page' : undefined}
            className='flex min-w-0 items-center gap-1.5'
          >
            {crumbMark}
            <span className='min-w-0 truncate'>{title}</span>
          </span>
        }
        <DropdownMenuTrigger
          aria-label={label}
          className={cn(
            'group relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0',
            // Invisible hit area — grows into the header padding and the gap
            // before the separator, but only 2px left so the label keeps its
            // own clicks.
            'after:absolute after:-top-2 after:-bottom-2 after:-right-2 after:-left-0.5',
            // Hover disc, drawn on its own pseudo-element so it can outgrow the
            // box. 2px is the whole gap before the label's text, so this is as
            // wide as the disc gets without covering the label.
            'before:pointer-events-none before:absolute before:-inset-0.5 before:rounded-full before:transition-colors before:duration-200',
            'hover:before:bg-primary/10 data-[state=open]:before:bg-primary/10',
            'transition-colors duration-200 hover:text-primary data-[state=open]:text-primary',
            'focus-visible:ring-0 focus-visible:outline-none',
          )}
        >
          {chevron}
        </DropdownMenuTrigger>
      </span>
    : <DropdownMenuTrigger
        aria-label={label}
        className='inline-flex h-auto max-w-72 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:outline-none'
      >
        {selected?.image ?
          <span className='flex min-w-0 items-center gap-2'>
            <OptionThumb
              src={selected.image}
              label={selected.label}
              fit={imageFit}
              loading='eager'
            />
            <span className='truncate'>{selected.label}</span>
          </span>
        : <span className='truncate'>{title}</span>}
        {chevron}
      </DropdownMenuTrigger>;

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(next) => {
        if (!next || loadThumbs) return;
        window.setTimeout(() => setLoadThumbs(true), 0);
      }}
    >
      {trigger}
      <DropdownMenuContent
        align='start'
        sideOffset={4}
        className='w-max min-w-0 max-w-[min(24rem,calc(100vw-2rem))]'
      >
        {options.map((option) => {
          const href = hrefTemplate.replaceAll('{id}', option.value);
          const active = option.value === value;

          return (
            <DropdownMenuItem key={option.value} asChild>
              <Link href={href} aria-current={active ? 'page' : undefined}>
                {option.image ?
                  <OptionThumb
                    src={loadThumbs ? option.image : undefined}
                    fallbackSrc={loadThumbs ? option.fallbackImage : undefined}
                    label={option.label}
                    fit={imageFit}
                    loading='lazy'
                  />
                : null}
                <span className='min-w-0 flex-1 whitespace-nowrap'>
                  {option.label}
                </span>
                {active ?
                  <Check aria-hidden='true' className='text-primary' />
                : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
