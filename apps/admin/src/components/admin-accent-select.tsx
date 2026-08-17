'use client';

import { Check } from 'lucide-react';

import { ColorSwatch } from '@/components/color-swatch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { adminAccentColor, type AdminAccentId } from '@/lib/admin-accent';
import { setAdminAccent, useAdminAccent } from '@/lib/admin-accent-store';
import { cn } from '@/lib/utils';

const accentOptions = [
  { value: 'blue', label: 'Teal' },
  { value: 'green', label: 'Green' },
  { value: 'gold', label: 'Yellow-orange' },
  { value: 'red', label: 'Red' },
] as const satisfies ReadonlyArray<{
  value: AdminAccentId;
  label: string;
}>;

/**
 * One field, read left to right: the four colors are the control, the checked
 * one's name is the field's value. Field chrome comes from the same shell as
 * `FileInput`, so it stands one input tall beside the Theme select.
 *
 * The swatch is the whole option: the radio covers it invisibly so Radix keeps
 * focus, arrow keys, and the checked state. Selection is a ring plus a check
 * mark — never color alone — and the field border carries focus, so arrow keys
 * still show that the group has it even while ring styles stay on the option.
 */
export function AdminAccentSelect() {
  const accent = useAdminAccent();
  const selected =
    accentOptions.find((option) => option.value === accent) ?? accentOptions[0];

  return (
    <div
      className={cn(
        'flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-2 transition-colors',
        'hover:border-ring/40 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30 dark:bg-input/30',
      )}
    >
      <RadioGroup
        aria-label='Primary color'
        className='shrink-0 flex-nowrap gap-x-1.5'
        value={accent}
        onValueChange={(value) => setAdminAccent(value as AdminAccentId)}
      >
        {accentOptions.map((option) => (
          <span key={option.value} className='relative flex'>
            <Tooltip>
              <TooltipTrigger asChild>
                <RadioGroupItem
                  aria-label={option.label}
                  value={option.value}
                  className='absolute inset-0 size-full opacity-0'
                />
              </TooltipTrigger>
              <TooltipContent>{option.label}</TooltipContent>
            </Tooltip>
            {/* Checked reads from `aria-checked`, not `data-state`: the
                tooltip trigger owns that attribute on this button. */}
            <ColorSwatch
              color={adminAccentColor(option.value)}
              size='field'
              className={cn(
                'border-foreground/10 ring-offset-1 ring-offset-background transition-[box-shadow]',
                'peer-hover:ring-2 peer-hover:ring-foreground/20',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                'peer-aria-checked:ring-2 peer-aria-checked:ring-foreground/70',
              )}
            />
            {/* The checked swatch is painted in --primary, so its paired
                foreground is the one ink guaranteed to read on it. */}
            <Check
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-aria-checked:opacity-100'
            />
          </span>
        ))}
      </RadioGroup>
      {/* The field's value, read like the Theme select's: visual echo of the
          checked radio, which already carries the name for a reader. */}
      <span
        aria-hidden='true'
        className='ms-auto min-w-0 truncate text-sm text-muted-foreground'
      >
        {selected.label}
      </span>
    </div>
  );
}
