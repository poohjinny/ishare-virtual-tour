'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';

import {
  BrandedAvatar,
  OptionThumb,
  PersonAvatar,
} from '@/components/branded-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { breadcrumbMediaLabelClass, cn, mediaLabelClass } from '@/lib/utils';

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
  shape,
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
  /** Person identity — circular avatar, including the no-photo fallback. */
  shape?: 'circle';
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

  const personMark = shape === 'circle';
  const crumbMark =
    personMark ?
      <PersonAvatar src={crumbImage} label={title} size='xs' />
    : crumbImage ?
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
            breadcrumbMediaLabelClass,
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
            className={cn(
              'group transition-colors duration-200 hover:text-primary',
              breadcrumbMediaLabelClass,
            )}
          >
            {crumbMark}
            <span className='min-w-0 truncate underline-offset-4 group-hover:underline'>
              {title}
            </span>
          </Link>
        : <span
            aria-current={current ? 'page' : undefined}
            className={breadcrumbMediaLabelClass}
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
        {personMark || selected?.image ?
          <span className={mediaLabelClass}>
            {personMark ?
              <PersonAvatar src={selected?.image} label={title} />
            : <OptionThumb
                src={selected?.image}
                label={selected?.label ?? title}
                fit={imageFit}
                loading='eager'
              />}
            <span className='truncate'>
              {personMark ? title : (selected?.label ?? title)}
            </span>
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
                <span className={cn(mediaLabelClass, 'flex-1')}>
                  {personMark ?
                    <PersonAvatar src={option.image} label={option.label} />
                  : option.image ?
                    <OptionThumb
                      src={loadThumbs ? option.image : undefined}
                      fallbackSrc={
                        loadThumbs ? option.fallbackImage : undefined
                      }
                      label={option.label}
                      fit={imageFit}
                      loading='lazy'
                    />
                  : null}
                  <span className='min-w-0 flex-1 whitespace-nowrap'>
                    {option.label}
                  </span>
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
