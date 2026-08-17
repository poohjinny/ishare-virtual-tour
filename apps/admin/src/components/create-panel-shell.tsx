'use client';

import type { ReactNode } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * Catalog create — header CTA + sheet. Not the in-page Dev accordion.
 * The drawer itself does not scroll: the body does, and a form card inside it
 * scrolls in its own frame (globals.css). Scrolling under the drawer edge
 * instead sliced the card's bottom border off.
 */
export const AUTHORING_SHEET_CLASS =
  'overflow-clip w-full data-[side=left]:sm:max-w-xl data-[side=right]:sm:max-w-xl [&>[data-slot=sheet-header]]:px-6 [&>[data-slot=sheet-header]]:pt-6';

/** Body inset under the sheet header — authoring drawers need more than p-4. */
export const AUTHORING_SHEET_BODY_CLASS =
  'ishare-scrollbar min-h-0 overflow-y-auto px-6 pb-6';

export function CreateSheet({
  title,
  description,
  triggerLabel,
  disabled,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size='sm' disabled={disabled}>
          <Plus aria-hidden='true' />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className={AUTHORING_SHEET_CLASS}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ?
            <SheetDescription>{description}</SheetDescription>
          : null}
        </SheetHeader>
        <div className={AUTHORING_SHEET_BODY_CLASS}>{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function CreatePanelShell({
  title,
  description,
  triggerLabel,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className='group/create rounded-xl border bg-card'
    >
      <CollapsibleTrigger
        type='button'
        className='flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40'
      >
        <ChevronDown
          aria-hidden='true'
          className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/create:rotate-180'
        />
        <span className='min-w-0 flex-1'>
          <span className='type-title block'>{title}</span>
          {description ?
            <span className='type-body mt-1 block text-muted-foreground'>
              {description}
            </span>
          : null}
        </span>
        <span className='shrink-0 text-sm font-medium text-primary'>
          <span className='group-data-[state=open]/create:hidden'>
            {triggerLabel}
          </span>
          <span className='hidden group-data-[state=open]/create:inline'>
            Hide
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='border-t px-4 py-4'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
