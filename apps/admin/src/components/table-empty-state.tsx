import type { ReactNode } from 'react';

import { TableCell, TableRow } from '@/components/ui/table';

export function TableEmptyState({
  colSpan,
  title,
  description,
  action,
}: {
  colSpan: number;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className='h-28'>
        <div className='flex flex-col items-center justify-center gap-2 py-4 text-center'>
          <p className='font-heading font-medium'>{title}</p>
          {description ?
            <p className='max-w-sm text-sm text-muted-foreground'>
              {description}
            </p>
          : null}
          {action}
        </div>
      </TableCell>
    </TableRow>
  );
}
