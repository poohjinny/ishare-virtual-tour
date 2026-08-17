import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Field with a leading icon inside its own chrome: an account name, a URL, a
 * config path. The icon only introduces the value, so it reads a step quieter
 * than the text, and the input's left inset comes from the `input-group` slot
 * in `globals.css` instead of a padding class per call site.
 *
 * Server-safe on purpose: Settings renders these fields on the server, and a
 * component reference cannot cross into a client module.
 */
export function InputGroup({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot='input-group'
      className={cn('relative w-full min-w-0', className)}
    >
      <Icon
        aria-hidden='true'
        className='icon-inline pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2'
      />
      {children}
    </div>
  );
}
