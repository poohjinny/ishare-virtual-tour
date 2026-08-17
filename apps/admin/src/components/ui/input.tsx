import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:mr-2.5 file:inline-flex file:h-5.5 file:cursor-pointer file:rounded-md file:border file:border-input file:bg-muted/60 file:px-2 file:text-xs file:font-medium file:text-foreground file:hover:bg-muted placeholder:text-muted-foreground/50 enabled:not-read-only:hover:border-ring/40 not-read-only:focus-visible:border-ring not-read-only:focus-visible:ring-1 not-read-only:focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 read-only:cursor-default aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
