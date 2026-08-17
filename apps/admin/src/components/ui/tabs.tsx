'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot='tabs'
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-horizontal:flex-col',
        className,
      )}
      {...props}
    />
  );
}

// Height comes from `level` below — a base `group-data-horizontal/tabs:h-8`
// would win on source order and squash the underline bar's trigger padding.
const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: { default: 'bg-muted', line: 'gap-1 bg-transparent' },
    },
    defaultVariants: { variant: 'default' },
  },
);

function TabsList({
  className,
  variant = 'default',
  level = 'primary',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants> & {
    level?: 'primary' | 'secondary' | 'tertiary';
  }) {
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      data-variant={level === 'secondary' ? 'default' : variant}
      data-level={level}
      className={cn(
        tabsListVariants({
          variant: level === 'secondary' ? 'default' : variant,
        }),
        level === 'primary' &&
          'h-auto w-full justify-start gap-x-6 rounded-none border-b bg-transparent p-0',
        level === 'secondary' && 'h-9 w-fit rounded-full bg-muted p-1',
        level === 'tertiary' &&
          'h-auto gap-3 rounded-none bg-transparent p-0 text-xs',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 font-heading text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-none group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:font-semibold data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
        'group-data-[level=primary]/tabs-list:h-auto group-data-[level=primary]/tabs-list:flex-none group-data-[level=primary]/tabs-list:rounded-none group-data-[level=primary]/tabs-list:px-3 group-data-[level=primary]/tabs-list:py-2.5 group-data-[level=primary]/tabs-list:data-active:bg-transparent group-data-[level=primary]/tabs-list:data-active:font-semibold group-data-[level=primary]/tabs-list:data-active:text-primary group-data-[level=primary]/tabs-list:data-active:shadow-none',
        'group-data-[level=secondary]/tabs-list:h-7 group-data-[level=secondary]/tabs-list:flex-none group-data-[level=secondary]/tabs-list:rounded-full group-data-[level=secondary]/tabs-list:px-3 group-data-[level=secondary]/tabs-list:data-active:bg-background group-data-[level=secondary]/tabs-list:data-active:font-semibold group-data-[level=secondary]/tabs-list:data-active:text-primary group-data-[level=secondary]/tabs-list:data-active:after:opacity-0',
        'group-data-[level=tertiary]/tabs-list:rounded-none group-data-[level=tertiary]/tabs-list:px-0 group-data-[level=tertiary]/tabs-list:text-muted-foreground group-data-[level=tertiary]/tabs-list:data-active:bg-transparent group-data-[level=tertiary]/tabs-list:data-active:font-semibold group-data-[level=tertiary]/tabs-list:data-active:text-primary group-data-[level=tertiary]/tabs-list:data-active:shadow-none',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 group-data-[level=primary]/tabs-list:after:bg-primary group-data-[level=primary]/tabs-list:data-active:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      className={cn('flex-1 text-[0.8125rem] outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
