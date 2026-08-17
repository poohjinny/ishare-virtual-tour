'use client';

import { type ReactNode, useState } from 'react';
import { MonitorPlay, PenLine } from 'lucide-react';

import { cn } from '@/lib/utils';

export function EditorPreviewSplit({
  editor,
  preview,
  className,
}: {
  editor: ReactNode;
  preview: ReactNode;
  className?: string;
}) {
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');

  return (
    <div className={cn('grid gap-4 xl:gap-6', className)}>
      <div
        className='flex w-fit gap-1 rounded-lg border bg-muted/40 p-1 xl:hidden'
        role='tablist'
        aria-label='Editor or preview'
      >
        {(
          [
            { id: 'editor', label: 'Editor', icon: PenLine },
            { id: 'preview', label: 'Preview', icon: MonitorPlay },
          ] as const
        ).map((pane) => {
          const Icon = pane.icon;
          const active = mobilePane === pane.id;
          return (
            <button
              key={pane.id}
              type='button'
              role='tab'
              aria-selected={active}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                active ?
                  'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
              )}
              onClick={() => setMobilePane(pane.id)}
            >
              <Icon aria-hidden='true' className='size-3.5' />
              {pane.label}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          mobilePane === 'editor' ? 'block' : 'hidden',
          'h-full xl:block',
        )}
      >
        {editor}
      </div>
      <div
        className={cn(
          mobilePane === 'preview' ? 'block' : 'hidden',
          'h-full xl:block',
        )}
      >
        {preview}
      </div>
    </div>
  );
}
