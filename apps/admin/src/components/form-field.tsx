'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChevronDown, Info } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/**
 * Shared section title chrome: soft pill icon + uppercase eyebrow, with the
 * description in the same column. Used by static and collapsible sections so
 * both read as the same kind of group.
 */
function FormSectionHeading({
  title,
  icon: Icon,
  description,
  as: Tag = 'div',
}: {
  title: ReactNode;
  icon?: LucideIcon;
  description?: ReactNode;
  /** `span` inside a collapsible trigger (a button cannot contain a div). */
  as?: 'div' | 'span';
}) {
  const Column = Tag === 'span' ? 'span' : 'div';
  const Title = Tag === 'span' ? 'span' : 'h3';
  const Description = Tag === 'span' ? 'span' : 'p';

  return (
    <>
      {Icon ?
        <Column
          aria-hidden='true'
          className='flex size-9 shrink-0 items-center justify-center rounded-full bg-info/20 text-info-foreground'
        >
          <Icon className='size-5' />
        </Column>
      : null}
      <Column className='grid min-w-0 flex-1 gap-1'>
        <Title className='type-label uppercase tracking-[0.14em] text-muted-foreground'>
          {title}
        </Title>
        {description ?
          <Description className='type-body normal-case tracking-normal text-muted-foreground'>
            {description}
          </Description>
        : null}
      </Column>
    </>
  );
}

export function FormSection({
  title,
  icon,
  description,
  children,
  className,
}: {
  title?: string;
  icon?: LucideIcon;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-slot='form-section' className={cn('grid', className)}>
      {title || description ?
        <div
          data-slot='form-section-heading'
          className='flex items-start gap-2.5'
        >
          <FormSectionHeading
            title={title}
            icon={icon}
            description={description}
          />
        </div>
      : null}
      <div data-slot='form-section-body'>{children}</div>
    </section>
  );
}

/**
 * Independent fold for one group inside a single save form. Multiple sections
 * may stay open — unlike tabs, this keeps one sticky submit for the whole form.
 */
export function CollapsibleFormSection({
  title,
  icon,
  description,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Collapsible
      data-slot='collapsible-form-section'
      defaultOpen={defaultOpen}
      className={cn('group/form-section grid', className)}
    >
      <CollapsibleTrigger
        type='button'
        className='group/fold flex w-full cursor-pointer items-start gap-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/30'
      >
        <FormSectionHeading
          as='span'
          title={title}
          icon={icon}
          description={description}
        />
        <ChevronDown
          aria-hidden='true'
          className='mt-2 size-4 shrink-0 text-muted-foreground transition-[transform,color] group-hover/fold:text-primary group-focus-visible/fold:text-primary group-data-[state=open]/form-section:rotate-180 group-data-[state=open]/form-section:text-primary'
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='overflow-hidden'>
        <div data-slot='form-section-body'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function FormHint({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p
      id={id}
      data-slot='form-hint'
      className={cn('type-meta flex items-start gap-1', className)}
    >
      {/* One line box tall, so the mark centers on the first line of the hint
          at any type size — a fixed top offset drifts with the leading. */}
      <span className='flex h-[1lh] shrink-0 items-center'>
        <Info aria-hidden='true' className='size-3' />
      </span>
      <span className='min-w-0'>{children}</span>
    </p>
  );
}

export function FormDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p data-slot='form-description' className={cn('type-meta', className)}>
      {children}
    </p>
  );
}

/**
 * Checkbox + label on one row; supporting copy starts under the label.
 * Spacing comes from `.admin-form [data-slot=checkbox-field]`.
 */
export function CheckboxField({
  id,
  label,
  description,
  hint,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div data-slot='checkbox-field' className={className}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label htmlFor={id}>{label}</Label>
      {description ?
        <FormDescription>{description}</FormDescription>
      : null}
      {hint ?
        <FormHint>{hint}</FormHint>
      : null}
    </div>
  );
}

/**
 * Label (+ optional description) beside the Switch; FormHint sits under the
 * whole row — same “hint under the control” slot as other fields.
 */
export function SwitchField({
  id,
  label,
  description,
  hint,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div data-slot='switch-field' className={cn('grid gap-1.5', className)}>
      <div className='flex items-center justify-between gap-3'>
        <div className='grid min-w-0 gap-1.5'>
          <Label htmlFor={id}>{label}</Label>
          {description ?
            <FormDescription>{description}</FormDescription>
          : null}
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
      {hint ?
        <FormHint>{hint}</FormHint>
      : null}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  description,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  description?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {description ?
        <FormDescription>{description}</FormDescription>
      : null}
      {children}
      {hint ?
        <FormHint>{hint}</FormHint>
      : null}
    </div>
  );
}
