'use client';

import { ArrowUp, ArrowUpDown } from 'lucide-react';

import { TableHead } from '@/components/ui/table';
import type { SortDir } from '@/hooks/use-sortable-rows';
import { cn } from '@/lib/utils';

export function SortableHead({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  column: string;
  sortKey?: string;
  sortDir: SortDir;
  onSort: (column: string) => void;
  className?: string;
}) {
  const active = sortKey === column;
  const Icon = active ? ArrowUp : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type='button'
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 font-medium transition-colors hover:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon
          aria-hidden='true'
          className={cn(
            'icon-meta opacity-60 transition-transform duration-200 motion-reduce:transition-none',
            active && sortDir === 'desc' && 'rotate-180',
          )}
        />
        <span className='sr-only'>{active ? `Sorted ${sortDir}` : 'Sort'}</span>
      </button>
    </TableHead>
  );
}
